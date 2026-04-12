"""SportShield AI — Reports endpoints."""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.models.report import Report

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportCreate(BaseModel):
    name: str
    report_type: str = "weekly"
    format: str = "pdf"
    parameters: dict | None = None

class ReportResponse(BaseModel):
    id: str
    name: str
    report_type: str
    format: str
    status: str
    file_url: str | None
    created_at: datetime


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all reports for the user's organization."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reports_result = await db.execute(
        select(Report).where(Report.org_id == user.org_id).order_by(Report.created_at.desc())
    )
    reports = reports_result.scalars().all()
    
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "report_type": r.report_type,
            "format": r.format,
            "status": r.status,
            "file_url": r.file_url,
            "created_at": r.created_at,
        }
        for r in reports
    ]


@router.post("", response_model=ReportResponse)
async def create_report(
    data: ReportCreate,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new report and schedule its generation."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role not in ["admin", "owner", "analyst"]:
        raise HTTPException(status_code=403, detail="Not authorized to create reports")

    db_report = Report(
        org_id=user.org_id,
        created_by=user.id,
        name=data.name,
        report_type=data.report_type,
        format=data.format,
        parameters_json=data.parameters or {},
        status="processing"
    )
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)
    
    # In a real app we would use Celery: `generate_report_task.delay(str(db_report.id))`
    # For now, we simulate background processing:
    def process_report(report_id: str):
        # Background dummy function
        pass
        
    background_tasks.add_task(process_report, str(db_report.id))

    return {
        "id": str(db_report.id),
        "name": db_report.name,
        "report_type": db_report.report_type,
        "format": db_report.format,
        "status": db_report.status,
        "file_url": db_report.file_url,
        "created_at": db_report.created_at,
    }


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a report."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    report_result = await db.execute(
        select(Report).where(Report.id == uuid.UUID(report_id), Report.org_id == user.org_id)
    )
    db_report = report_result.scalar_one_or_none()
    
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    await db.delete(db_report)
    await db.commit()
    return {"detail": "Report deleted"}
