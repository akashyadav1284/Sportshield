"""SportShield AI — Report ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), default="weekly", nullable=False) # e.g., weekly, monthly, custom, violation_summary
    format: Mapped[str] = mapped_column(String(20), default="pdf", nullable=False) # pdf, csv, json
    
    status: Mapped[str] = mapped_column(String(20), default="processing", nullable=False) # processing, ready, failed
    file_url: Mapped[str] = mapped_column(String(1000), nullable=True) # S3 or local url
    
    parameters_json: Mapped[dict] = mapped_column(JSON, nullable=True) # store date ranges, filters

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    organization = relationship("Organization", back_populates="reports")
    creator = relationship("User")
