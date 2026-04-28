"""SportShield AI — Asset API endpoints."""

import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id, decode_token
from app.core.storage import storage
from app.models.user import User
from app.models.asset import MediaAsset
from app.schemas.asset import AssetResponse, AssetListResponse, AssetUpdate
from app.services.asset_service import get_assets, get_asset_by_id, update_asset, delete_asset

router = APIRouter(prefix="/assets", tags=["assets"])


async def _get_user_and_org(user_id: str, db: AsyncSession):
    """Helper to fetch user and their org_id."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=AssetListResponse)
async def list_assets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    file_type: Optional[str] = None,
    fingerprint_status: Optional[str] = None,
    sort_by: str = "created_at",
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated list of assets for the current user's organization."""
    user = await _get_user_and_org(user_id, db)
    assets, total = await get_assets(
        db, user.org_id, page, limit, search, file_type, fingerprint_status, sort_by
    )
    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in assets],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/upload", response_model=List[AssetResponse], status_code=status.HTTP_201_CREATED)
async def upload_assets(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    names: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more media files.

    Accepts multipart/form-data with files and optional metadata.
    Triggers fingerprinting task for each file automatically.
    """
    user = await _get_user_and_org(user_id, db)

    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files per upload",
        )

    # Parse comma-separated names and tags
    name_list = names.split(",") if names else []
    tag_list = [t.strip() for t in tags.split(",")] if tags else []

    allowed_types = {
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/quicktime", "video/x-msvideo",
    }

    created_assets = []

    for i, file in enumerate(files):
        # Validate file type
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}",
            )

        # Read file bytes
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # Validate size (500MB max)
        if file_size > 500 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} exceeds 500MB limit",
            )

        # Determine file type
        file_type = "video" if file.content_type.startswith("video") else "image"

        # Upload to storage
        storage_key, storage_url = await storage.upload(
            file_bytes, file.filename, file.content_type
        )

        # Get name for this file
        asset_name = name_list[i] if i < len(name_list) else file.filename

        # Create asset record
        asset = MediaAsset(
            org_id=user.org_id,
            uploaded_by=user.id,
            name=asset_name,
            description=description or "",
            tags=tag_list,
            file_type=file_type,
            mime_type=file.content_type,
            file_size_bytes=file_size,
            storage_key=storage_key,
            storage_url=storage_url,
            fingerprint_status="pending",
        )
        db.add(asset)
        await db.flush()
        await db.refresh(asset)
        created_assets.append(asset)

        # Dispatch fingerprinting task
        from app.tasks.fingerprint_task import fingerprint_asset
        
        class DummyTask:
            def retry(self, exc=None):
                raise exc or Exception("Retry called on fallback task")

        try:
            fingerprint_asset.delay(str(asset.id))
        except Exception as e:
            print(f"Celery queue failed, using BackgroundTasks fallback for fingerprint: {e}")
            background_tasks.add_task(fingerprint_asset, DummyTask(), str(asset.id))

    await db.commit()

    return [AssetResponse.model_validate(a) for a in created_assets]


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get a single asset by ID."""
    user = await _get_user_and_org(user_id, db)
    asset = await get_asset_by_id(db, asset_id, user.org_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def patch_asset(
    asset_id: uuid.UUID,
    data: AssetUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update asset metadata (name, tags, description)."""
    user = await _get_user_and_org(user_id, db)
    asset = await get_asset_by_id(db, asset_id, user.org_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    updated = await update_asset(db, asset, data)
    return AssetResponse.model_validate(updated)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_asset(
    asset_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete an asset and all associated data."""
    user = await _get_user_and_org(user_id, db)
    asset = await get_asset_by_id(db, asset_id, user.org_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    await delete_asset(db, asset)


@router.post("/{asset_id}/scan", status_code=status.HTTP_202_ACCEPTED)
async def trigger_scan(
    asset_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger a scan for a specific asset."""
    user = await _get_user_and_org(user_id, db)
    asset = await get_asset_by_id(db, asset_id, user.org_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.fingerprint_status != "indexed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset must be indexed before scanning",
        )

    from app.tasks.scan_task import scan_asset
    
    class DummyTask:
        def retry(self, exc=None):
            raise exc or Exception("Retry called on fallback task")

    try:
        scan_asset.delay(str(asset.id))
    except Exception as e:
        print(f"Celery queue failed, using BackgroundTasks fallback for scan: {e}")
        background_tasks.add_task(scan_asset, DummyTask(), str(asset.id))

    return {"detail": "Scan queued successfully", "asset_id": str(asset.id)}
