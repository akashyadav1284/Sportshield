"""SportShield AI — Alert API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertListResponse
from app.services.alert_service import get_alerts, mark_alert_read, mark_all_read, get_unread_count

router = APIRouter(prefix="/alerts", tags=["alerts"])


async def _get_user_and_org(user_id: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=AlertListResponse)
async def list_alerts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated list of alerts for the current user's organization."""
    user = await _get_user_and_org(user_id, db)
    alerts, total = await get_alerts(db, user.org_id, page, limit, is_read)
    return AlertListResponse(
        items=[AlertResponse.model_validate(a) for a in alerts],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/unread-count")
async def unread_alert_count(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get the number of unread alerts."""
    user = await _get_user_and_org(user_id, db)
    count = await get_unread_count(db, user.org_id)
    return {"count": count}


@router.patch("/{alert_id}/read", response_model=AlertResponse)
async def read_alert(
    alert_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single alert as read."""
    user = await _get_user_and_org(user_id, db)
    alert = await mark_alert_read(db, alert_id, user.org_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertResponse.model_validate(alert)


@router.post("/mark-all-read")
async def read_all_alerts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread alerts as read."""
    user = await _get_user_and_org(user_id, db)
    count = await mark_all_read(db, user.org_id)
    return {"detail": f"Marked {count} alerts as read"}
