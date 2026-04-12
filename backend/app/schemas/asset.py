"""SportShield AI — Asset Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class AssetCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tags: Optional[List[str]] = []


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class AssetResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    uploaded_by: uuid.UUID
    name: str
    description: Optional[str]
    tags: List[str]
    file_type: str
    mime_type: str
    file_size_bytes: int
    storage_url: str
    phash: Optional[str]
    dhash: Optional[str]
    faiss_index_id: Optional[int]
    fingerprint_status: str
    last_scan_at: Optional[datetime]
    scan_count: int
    violation_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    limit: int
