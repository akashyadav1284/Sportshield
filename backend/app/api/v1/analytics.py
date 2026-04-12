"""SportShield AI — Analytics API endpoints."""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi_cache.decorator import cache
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.models.asset import MediaAsset
from app.models.violation import Violation
from app.models.scan_job import ScanJob
from app.schemas.analytics import (
    StatsResponse, TrendsResponse, TrendPoint,
    PlatformResponse, PlatformBreakdown,
    SeverityResponse, SeverityBreakdown,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _get_org_id(user_id: str, db: AsyncSession) -> uuid.UUID:
    result = await db.execute(select(User.org_id).where(User.id == uuid.UUID(user_id)))
    org_id = result.scalar_one_or_none()
    if not org_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return org_id


@router.get("/stats", response_model=StatsResponse)
@cache(expire=60)
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard stats: total assets, violations, active violations, resolved this week, scans today."""
    org_id = await _get_org_id(user_id, db)

    # Total assets
    result = await db.execute(
        select(func.count()).select_from(MediaAsset).where(MediaAsset.org_id == org_id)
    )
    total_assets = result.scalar()

    # Total violations
    result = await db.execute(
        select(func.count()).select_from(Violation).where(Violation.org_id == org_id)
    )
    total_violations = result.scalar()

    # Active violations (status = new or flagged)
    result = await db.execute(
        select(func.count()).select_from(Violation).where(
            Violation.org_id == org_id,
            Violation.status.in_(["new", "flagged"]),
        )
    )
    active_violations = result.scalar()

    # Resolved this week
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(func.count()).select_from(Violation).where(
            Violation.org_id == org_id,
            Violation.status.in_(["reviewed", "dismissed"]),
            Violation.reviewed_at >= week_ago,
        )
    )
    resolved_this_week = result.scalar()

    # Scans today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count()).select_from(ScanJob).where(
            ScanJob.started_at >= today_start,
        )
    )
    scans_today = result.scalar()

    return StatsResponse(
        total_assets=total_assets or 0,
        total_violations=total_violations or 0,
        active_violations=active_violations or 0,
        resolved_this_week=resolved_this_week or 0,
        scans_today=scans_today or 0,
    )


@router.get("/trends", response_model=TrendsResponse)
@cache(expire=60)
async def get_trends(
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get violation count per day for the specified time range."""
    org_id = await _get_org_id(user_id, db)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Violation.detected_at).label("date"),
            func.count().label("count"),
        )
        .where(
            Violation.org_id == org_id,
            Violation.detected_at >= start_date,
        )
        .group_by(func.date(Violation.detected_at))
        .order_by(func.date(Violation.detected_at))
    )
    rows = result.all()

    # Fill in missing dates with zero counts
    data = []
    current = start_date.date()
    end = datetime.now(timezone.utc).date()
    date_counts = {str(row.date): row.count for row in rows}

    while current <= end:
        date_str = str(current)
        data.append(TrendPoint(date=date_str, count=date_counts.get(date_str, 0)))
        current += timedelta(days=1)

    return TrendsResponse(data=data)


@router.get("/platforms", response_model=PlatformResponse)
@cache(expire=60)
async def get_platform_breakdown(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get violation count by platform."""
    org_id = await _get_org_id(user_id, db)

    result = await db.execute(
        select(
            Violation.platform,
            func.count().label("count"),
        )
        .where(Violation.org_id == org_id)
        .group_by(Violation.platform)
        .order_by(func.count().desc())
    )
    rows = result.all()

    return PlatformResponse(
        data=[PlatformBreakdown(platform=row.platform, count=row.count) for row in rows]
    )


@router.get("/severity", response_model=SeverityResponse)
@cache(expire=60)
async def get_severity_breakdown(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get violation count by severity."""
    org_id = await _get_org_id(user_id, db)

    result = await db.execute(
        select(
            Violation.severity,
            func.count().label("count"),
        )
        .where(Violation.org_id == org_id)
        .group_by(Violation.severity)
        .order_by(func.count().desc())
    )
    rows = result.all()

    return SeverityResponse(
        data=[SeverityBreakdown(severity=row.severity, count=row.count) for row in rows]
    )
