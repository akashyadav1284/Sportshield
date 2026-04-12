"""SportShield AI — Violation ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID

from app.core.database import Base


class Violation(Base):
    __tablename__ = "violations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media_assets.id"), nullable=False
    )
    detected_url: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(
        String(20), default="unknown", nullable=False
    )  # google / bing / twitter / youtube / web / unknown
    thumbnail_url: Mapped[str] = mapped_column(Text, nullable=True)
    screenshot_url: Mapped[str] = mapped_column(Text, nullable=True)

    # Match metrics
    phash_distance: Mapped[int] = mapped_column(Integer, nullable=True)
    cnn_similarity: Mapped[float] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # low / medium / high

    # Status tracking
    status: Mapped[str] = mapped_column(
        String(20), default="new", nullable=False
    )  # new / reviewed / flagged / dismissed
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    organization = relationship("Organization", back_populates="violations")
    asset = relationship("MediaAsset", back_populates="violations")
    reviewer = relationship("User", back_populates="reviewed_violations")
    alerts = relationship("Alert", back_populates="violation", cascade="all, delete-orphan")
