"""SportShield AI — MediaAsset ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, BigInteger, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID, JSON as ARRAY

from app.core.database import Base


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True, default="")
    tags: Mapped[list] = mapped_column(ARRAY(Text), default=list)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # image / video
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_url: Mapped[str] = mapped_column(String(1000), nullable=False)

    # Fingerprint data
    phash: Mapped[str] = mapped_column(String(64), nullable=True)
    dhash: Mapped[str] = mapped_column(String(64), nullable=True)
    faiss_index_id: Mapped[int] = mapped_column(BigInteger, nullable=True)
    fingerprint_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending / processing / indexed / failed

    # Scan metadata
    last_scan_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    scan_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    violation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    organization = relationship("Organization", back_populates="assets")
    uploader = relationship("User", back_populates="assets")
    violations = relationship("Violation", back_populates="asset", cascade="all, delete-orphan")
    scan_jobs = relationship("ScanJob", back_populates="asset", cascade="all, delete-orphan")
