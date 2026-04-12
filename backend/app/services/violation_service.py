"""SportShield AI — Violation service layer."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.violation import Violation
from app.models.asset import MediaAsset


async def get_violations(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    asset_id: Optional[uuid.UUID] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    platform: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
) -> tuple[List[Violation], int]:
    """Get paginated list of violations for an organization.

    Retrieves a list of intellectual property violations matching the specified
    filters. The results are ordered by detection time in descending order.

    Args:
        db (AsyncSession): The asynchronous SQLAlchemy database session.
        org_id (uuid.UUID): The UUID of the organization.
        page (int, optional): The page number for pagination. Defaults to 1.
        limit (int, optional): The maximum number of items per page. Defaults to 20.
        asset_id (uuid.UUID, optional): Filter by associated asset ID.
        severity (str, optional): Filter by threat severity (e.g., 'high', 'critical').
        status (str, optional): Filter by violation status (e.g., 'new', 'flagged').
        platform (str, optional): Filter by detection platform (e.g., 'twitter').
        date_from (datetime, optional): Filter by minimum detection date.
        date_to (datetime, optional): Filter by maximum detection date.
        search (str, optional): Case-insensitive search string applied to detected URLs.

    Returns:
        tuple[List[Violation], int]: A tuple containing the list of matching 
            Violation objects and the total count of matches.
    """
    query = select(Violation).where(Violation.org_id == org_id)
    count_query = select(func.count()).select_from(Violation).where(Violation.org_id == org_id)

    if asset_id:
        query = query.where(Violation.asset_id == asset_id)
        count_query = count_query.where(Violation.asset_id == asset_id)

    if severity:
        query = query.where(Violation.severity == severity)
        count_query = count_query.where(Violation.severity == severity)

    if status:
        query = query.where(Violation.status == status)
        count_query = count_query.where(Violation.status == status)

    if platform:
        query = query.where(Violation.platform == platform)
        count_query = count_query.where(Violation.platform == platform)

    if date_from:
        query = query.where(Violation.detected_at >= date_from)
        count_query = count_query.where(Violation.detected_at >= date_from)

    if date_to:
        query = query.where(Violation.detected_at <= date_to)
        count_query = count_query.where(Violation.detected_at <= date_to)

    if search:
        query = query.where(Violation.detected_url.ilike(f"%{search}%"))
        count_query = count_query.where(Violation.detected_url.ilike(f"%{search}%"))

    query = query.order_by(Violation.detected_at.desc())

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    violations = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return violations, total


async def get_violation_by_id(
    db: AsyncSession, violation_id: uuid.UUID, org_id: uuid.UUID
) -> Optional[Violation]:
    """Get a single violation by ID, filtered by organization.

    Ensures that the requested violation belongs to the specified organization
    to prevent unauthorized cross-tenant data access.

    Args:
        db (AsyncSession): The asynchronous SQLAlchemy database session.
        violation_id (uuid.UUID): The UUID of the violation to retrieve.
        org_id (uuid.UUID): The UUID of the requesting user's organization.

    Returns:
        Optional[Violation]: The Violation object if found and authorized, 
            otherwise None.
    """
    result = await db.execute(
        select(Violation).where(
            Violation.id == violation_id,
            Violation.org_id == org_id,
        )
    )
    return result.scalar_one_or_none()


async def update_violation_status(
    db: AsyncSession,
    violation: Violation,
    new_status: str,
    user_id: uuid.UUID,
) -> Violation:
    """Update violation status and record reviewer info.

    Persists a status transition (e.g., flagging or dismissing a violation)
    and logs the timestamp and user ID responsible for the review.

    Args:
        db (AsyncSession): The asynchronous SQLAlchemy database session.
        violation (Violation): The Violation model instance to update.
        new_status (str): The target status string.
        user_id (uuid.UUID): The UUID of the user performing the update.

    Returns:
        Violation: The updated and refreshed Violation model representation.
    """
    violation.status = new_status
    violation.reviewed_at = datetime.now(timezone.utc)
    violation.reviewed_by = user_id
    await db.commit()
    await db.refresh(violation)
    return violation
