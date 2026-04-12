"""SportShield AI — Alert Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    violation_id: uuid.UUID
    alert_type: str
    recipient: Optional[str]
    sent_at: datetime
    is_read: bool
    metadata_json: Optional[Dict[str, Any]]

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    limit: int
