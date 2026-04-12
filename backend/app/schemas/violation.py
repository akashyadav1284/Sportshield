"""SportShield AI — Violation Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class ViolationResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    asset_id: uuid.UUID
    detected_url: str
    platform: str
    thumbnail_url: Optional[str]
    screenshot_url: Optional[str]
    phash_distance: Optional[int]
    cnn_similarity: Optional[float]
    confidence_score: float
    severity: str
    status: str
    detected_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[uuid.UUID]
    asset_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ViolationListResponse(BaseModel):
    items: List[ViolationResponse]
    total: int
    page: int
    limit: int


class ViolationStatusUpdate(BaseModel):
    status: str  # reviewed / flagged / dismissed

class ViolationBulkStatusUpdate(BaseModel):
    violation_ids: List[uuid.UUID]
    status: str
