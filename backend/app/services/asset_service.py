"""SportShield AI — Asset service layer."""

import uuid
from typing import Optional, List

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import MediaAsset
from app.schemas.asset import AssetCreate, AssetUpdate


async def get_assets(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    file_type: Optional[str] = None,
    fingerprint_status: Optional[str] = None,
    sort_by: str = "created_at",
) -> tuple[List[MediaAsset], int]:
    """Get paginated list of assets for an organization.

    Returns:
        Tuple of (assets list, total count).
    """
    # Base query filtered by org
    query = select(MediaAsset).where(MediaAsset.org_id == org_id)
    count_query = select(func.count()).select_from(MediaAsset).where(MediaAsset.org_id == org_id)

    # Apply filters
    if search:
        search_filter = or_(
            MediaAsset.name.ilike(f"%{search}%"),
            MediaAsset.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if file_type:
        query = query.where(MediaAsset.file_type == file_type)
        count_query = count_query.where(MediaAsset.file_type == file_type)

    if fingerprint_status:
        query = query.where(MediaAsset.fingerprint_status == fingerprint_status)
        count_query = count_query.where(MediaAsset.fingerprint_status == fingerprint_status)

    # Sorting
    if sort_by == "violation_count":
        query = query.order_by(MediaAsset.violation_count.desc())
    elif sort_by == "last_scan_at":
        query = query.order_by(MediaAsset.last_scan_at.desc().nullslast())
    else:
        query = query.order_by(MediaAsset.created_at.desc())

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    # Execute queries
    result = await db.execute(query)
    assets = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return assets, total


async def get_asset_by_id(
    db: AsyncSession, asset_id: uuid.UUID, org_id: uuid.UUID
) -> Optional[MediaAsset]:
    """Get a single asset by ID, filtered by organization."""
    result = await db.execute(
        select(MediaAsset).where(
            MediaAsset.id == asset_id,
            MediaAsset.org_id == org_id,
        )
    )
    return result.scalar_one_or_none()


async def update_asset(
    db: AsyncSession, asset: MediaAsset, data: AssetUpdate
) -> MediaAsset:
    """Update asset metadata."""
    if data.name is not None:
        asset.name = data.name
    if data.description is not None:
        asset.description = data.description
    if data.tags is not None:
        asset.tags = data.tags
    await db.commit()
    await db.refresh(asset)
    return asset


async def delete_asset(db: AsyncSession, asset: MediaAsset) -> None:
    """Delete an asset and its associated data."""
    # Remove from FAISS index
    if asset.faiss_index_id is not None:
        try:
            from app.ai.similarity import FAISSIndex
            FAISSIndex().remove_from_index(str(asset.id))
        except Exception:
            pass

    # Delete from storage
    try:
        from app.core.storage import storage
        await storage.delete(asset.storage_key)
    except Exception:
        pass

    await db.delete(asset)
    await db.commit()
