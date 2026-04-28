"""SportShield AI — Manual scan trigger endpoint."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.models.asset import MediaAsset

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("/trigger")
async def trigger_full_scan(
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a scan for all indexed assets in the organization."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all indexed assets for this org
    assets_result = await db.execute(
        select(MediaAsset).where(
            MediaAsset.org_id == user.org_id,
            MediaAsset.fingerprint_status == "indexed",
        )
    )
    assets = assets_result.scalars().all()

    from app.tasks.scan_task import scan_asset
    
    for asset in assets:
        try:
            # Try to queue in Celery/Redis
            scan_asset.delay(str(asset.id))
        except Exception as e:
            print(f"Celery queue failed, using BackgroundTasks fallback: {e}")
            # Fallback to local background thread execution
            background_tasks.add_task(scan_asset, str(asset.id))

    return {
        "detail": f"Scan triggered for {len(assets)} assets",
        "asset_count": len(assets),
    }
