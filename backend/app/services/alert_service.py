"""SportShield AI — Alert service layer."""

import uuid
from typing import Optional, List

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert


async def get_alerts(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    is_read: Optional[bool] = None,
) -> tuple[List[Alert], int]:
    """Get paginated list of alerts for an organization."""
    query = select(Alert).where(Alert.org_id == org_id)
    count_query = select(func.count()).select_from(Alert).where(Alert.org_id == org_id)

    if is_read is not None:
        query = query.where(Alert.is_read == is_read)
        count_query = count_query.where(Alert.is_read == is_read)

    query = query.order_by(Alert.sent_at.desc())

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    alerts = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return alerts, total


async def mark_alert_read(
    db: AsyncSession, alert_id: uuid.UUID, org_id: uuid.UUID
) -> Optional[Alert]:
    """Mark a single alert as read."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.org_id == org_id)
    )
    alert = result.scalar_one_or_none()
    if alert:
        alert.is_read = True
        await db.commit()
        await db.refresh(alert)
    return alert


async def mark_all_read(db: AsyncSession, org_id: uuid.UUID) -> int:
    """Mark all unread alerts as read for an organization.

    Returns:
        Number of alerts marked as read.
    """
    stmt = (
        update(Alert)
        .where(Alert.org_id == org_id, Alert.is_read == False)
        .values(is_read=True)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount


async def get_unread_count(db: AsyncSession, org_id: uuid.UUID) -> int:
    """Get count of unread alerts for an organization."""
    result = await db.execute(
        select(func.count()).select_from(Alert).where(
            Alert.org_id == org_id, Alert.is_read == False
        )
    )
    return result.scalar()
