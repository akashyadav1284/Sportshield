"""SportShield AI — Violation API endpoints."""

import uuid
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.models.violation import Violation
from app.models.asset import MediaAsset
from app.schemas.violation import ViolationResponse, ViolationListResponse, ViolationStatusUpdate, ViolationBulkStatusUpdate
from app.services.violation_service import get_violations, get_violation_by_id, update_violation_status

router = APIRouter(prefix="/violations", tags=["violations"])


async def _get_user_and_org(user_id: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=ViolationListResponse)
async def list_violations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    asset_id: Optional[uuid.UUID] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    platform: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated list of violations with comprehensive filters.

    Fetches a subset of threat incidents associated with the authenticated user's
    organization, applying various query parameters for filtering and pagination.

    Args:
        page (int): Pagination offset multiplier. Defaults to 1.
        limit (int): Max records to return per page. Defaults to 20.
        asset_id (uuid.UUID, optional): Filter violations mapped to a specific media asset.
        severity (str, optional): Filter by threat severity rating.
        status_filter (str, optional): Filter by current triage status.
        platform (str, optional): Filter by host platform.
        date_from (datetime, optional): Earliest detected timestamp limit.
        date_to (datetime, optional): Latest detected timestamp limit.
        search (str, optional): Substring to match against the detected URL.
        user_id (str): The current authenticated user's ID.
        db (AsyncSession): Active database session injected via Depends.

    Returns:
        ViolationListResponse: A populated pydantic schema containing the filtered items array
        and total pagination metadata.
        
    Raises:
        HTTPException: 404 if the user resolves to a null context.
    """
    user = await _get_user_and_org(user_id, db)
    violations, total = await get_violations(
        db, user.org_id, page, limit,
        asset_id, severity, status_filter, platform,
        date_from, date_to, search,
    )

    # Enrich with asset names
    items = []
    for v in violations:
        resp = ViolationResponse.model_validate(v)
        # Fetch asset name
        asset_result = await db.execute(
            select(MediaAsset.name).where(MediaAsset.id == v.asset_id)
        )
        asset_name = asset_result.scalar_one_or_none()
        resp.asset_name = asset_name
        items.append(resp)

    return ViolationListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{violation_id}", response_model=ViolationResponse)
async def get_violation(
    violation_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get a single violation by ID.

    Retrieves absolute details for an overarching violation alert, establishing correct 
    tenant isolation boundaries to prevent IDOR attacks.

    Args:
        violation_id (uuid.UUID): Target violation primary key.
        user_id (str): The current authenticated user's ID.
        db (AsyncSession): Active database session injected via Depends.

    Returns:
        ViolationResponse: A robust summary schema of the requested threat alert.

    Raises:
        HTTPException: 404 if the violation ID is unmapped or violates tenant scoping.
    """
    user = await _get_user_and_org(user_id, db)
    violation = await get_violation_by_id(db, violation_id, user.org_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    resp = ViolationResponse.model_validate(violation)
    asset_result = await db.execute(
        select(MediaAsset.name).where(MediaAsset.id == violation.asset_id)
    )
    resp.asset_name = asset_result.scalar_one_or_none()
    return resp


@router.patch("/{violation_id}/status", response_model=ViolationResponse)
async def update_status(
    violation_id: uuid.UUID,
    data: ViolationStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update violation status (reviewed, flagged, dismissed).

    Commits a state mutation for an unresolved or existing violation record.
    Logs the user UUID driving the action and refreshes timestamp hooks.

    Args:
        violation_id (uuid.UUID): Target violation primary key to mutate.
        data (ViolationStatusUpdate): Expected request payload dictating standard states.
        user_id (str): The current authenticated user's ID.
        db (AsyncSession): Active database session injected via Depends.

    Returns:
        ViolationResponse: The materialized mutation returned in response.

    Raises:
        HTTPException: 400 on malformed state enumeration.
        HTTPException: 404 if the target ID scopes incorrectly against the tenant.
    """
    valid_statuses = {"reviewed", "flagged", "dismissed"}
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    user = await _get_user_and_org(user_id, db)
    violation = await get_violation_by_id(db, violation_id, user.org_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    updated = await update_violation_status(db, violation, data.status, user.id)
    resp = ViolationResponse.model_validate(updated)
    asset_result = await db.execute(
        select(MediaAsset.name).where(MediaAsset.id == updated.asset_id)
    )
    resp.asset_name = asset_result.scalar_one_or_none()
    return resp

@router.patch("/bulk-status")
async def bulk_update_status(
    data: ViolationBulkStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update status for multiple violations simultaneously.

    Optimizes analyst workflows by batch mutating threat incidents across defined selections.

    Args:
        data (ViolationBulkStatusUpdate): Represents an array of primary keys and a unified schema target status.
        user_id (str): The current authenticated user's ID.
        db (AsyncSession): Active database session injected via Depends.

    Returns:
        dict: A simple acknowledgement tracking internal iteration counts.

    Raises:
        HTTPException: 400 on illegal bulk triage states.
    """
    valid_statuses = {"reviewed", "flagged", "dismissed"}
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    user = await _get_user_and_org(user_id, db)
    
    # Simple iteration for MVP
    updated_count = 0
    for vid in data.violation_ids:
        violation = await get_violation_by_id(db, vid, user.org_id)
        if violation:
            await update_violation_status(db, violation, data.status, user.id)
            updated_count += 1
            
    return {"message": f"Successfully updated {updated_count} violations to {data.status}"}


@router.get("/{violation_id}/evidence")
async def download_evidence(
    violation_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate and download an evidence PDF for a violation."""
    user = await _get_user_and_org(user_id, db)
    violation = await get_violation_by_id(db, violation_id, user.org_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    # Get asset info
    asset_result = await db.execute(
        select(MediaAsset).where(MediaAsset.id == violation.asset_id)
    )
    asset = asset_result.scalar_one_or_none()

    # Get org info
    from app.models.organization import Organization
    org_result = await db.execute(
        select(Organization).where(Organization.id == violation.org_id)
    )
    org = org_result.scalar_one_or_none()

    # Generate PDF
    pdf_bytes = _generate_evidence_pdf(violation, asset, org)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="evidence_{violation.id}.pdf"'
        },
    )


def _generate_evidence_pdf(violation, asset, org) -> bytes:
    """Generate an evidence PDF using ReportLab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import inch

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=HexColor("#1A3C6E"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=HexColor("#64748b"),
        spaceAfter=20,
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=HexColor("#1A3C6E"),
        spaceBefore=20,
        spaceAfter=10,
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontSize=11,
        textColor=HexColor("#1e293b"),
        spaceAfter=6,
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=HexColor("#94a3b8"),
        alignment=1,
    )

    elements = []

    # Header
    elements.append(Paragraph("🛡️ SportShield AI", title_style))
    elements.append(Paragraph("IP Violation Evidence Report", subtitle_style))
    elements.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
        body_style,
    ))
    elements.append(Spacer(1, 20))

    # Section 1: Original Asset
    elements.append(Paragraph("Section 1: Original Asset", section_style))
    asset_data = [
        ["Field", "Value"],
        ["Asset Name", asset.name if asset else "Unknown"],
        ["Upload Date", str(asset.created_at.strftime("%Y-%m-%d %H:%M UTC")) if asset and asset.created_at else "N/A"],
        ["Organization", org.name if org else "Unknown"],
        ["File Type", asset.file_type if asset else "N/A"],
        ["File Size", f"{asset.file_size_bytes / 1024 / 1024:.2f} MB" if asset else "N/A"],
    ]
    t = Table(asset_data, colWidths=[2 * inch, 4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1A3C6E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#FFFFFF"), HexColor("#f8fafc")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Section 2: Detected Violation
    elements.append(Paragraph("Section 2: Detected Violation", section_style))
    severity_color = {"high": "#DC2626", "medium": "#D97706", "low": "#2563EB"}.get(
        violation.severity, "#6B7280"
    )
    violation_data = [
        ["Field", "Value"],
        ["Detected URL", violation.detected_url[:80] + ("..." if len(violation.detected_url) > 80 else "")],
        ["Platform", violation.platform.title()],
        ["Severity", violation.severity.upper()],
        ["Detection Date", str(violation.detected_at.strftime("%Y-%m-%d %H:%M UTC")) if violation.detected_at else "N/A"],
        ["Status", violation.status.title()],
    ]
    t2 = Table(violation_data, colWidths=[2 * inch, 4 * inch])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1A3C6E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#FFFFFF"), HexColor("#f8fafc")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 20))

    # Section 3: Analysis
    elements.append(Paragraph("Section 3: Analysis", section_style))
    analysis_data = [
        ["Metric", "Value"],
        ["pHash Distance", str(violation.phash_distance) if violation.phash_distance is not None else "N/A"],
        ["CNN Similarity", f"{violation.cnn_similarity:.4f}" if violation.cnn_similarity is not None else "N/A"],
        ["Confidence Score", f"{violation.confidence_score:.1f}%"],
        ["Severity Tier", violation.severity.upper()],
    ]
    t3 = Table(analysis_data, colWidths=[2 * inch, 4 * inch])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1A3C6E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#FFFFFF"), HexColor("#f8fafc")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t3)
    elements.append(Spacer(1, 20))

    # Section 4: Metadata
    elements.append(Paragraph("Section 4: Metadata", section_style))
    elements.append(Paragraph(f"Violation ID: {violation.id}", body_style))
    if asset:
        elements.append(Paragraph(f"Asset ID: {asset.id}", body_style))
        elements.append(Paragraph(f"FAISS Index ID: {asset.faiss_index_id or 'N/A'}", body_style))
    elements.append(Spacer(1, 40))

    # Footer
    elements.append(Paragraph(
        "Generated by SportShield AI | This document can be used as evidence for DMCA filings",
        footer_style,
    ))

    doc.build(elements)
    return buffer.getvalue()
