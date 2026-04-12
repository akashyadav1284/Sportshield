"""SportShield AI — API Keys endpoints."""

import uuid
import secrets
import hashlib
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.models.api_key import ApiKey

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


class ApiKeyCreate(BaseModel):
    name: str

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    status: str
    created_at: datetime
    last_used_at: datetime | None

class ApiKeyCreateResponse(ApiKeyResponse):
    key: str  # Only returned once!


@router.get("", response_model=List[ApiKeyResponse])
async def list_api_keys(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for the user's organization."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    keys_result = await db.execute(
        select(ApiKey).where(ApiKey.org_id == user.org_id).order_by(ApiKey.created_at.desc())
    )
    keys = keys_result.scalars().all()
    
    return [
        {
            "id": str(k.id),
            "name": k.name,
            "key_prefix": k.key_prefix,
            "status": k.status,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at,
        }
        for k in keys
    ]


@router.post("", response_model=ApiKeyCreateResponse)
async def create_api_key(
    data: ApiKeyCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to create API keys")

    # Generate a secure key
    raw_key = f"ss_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12] + "..."

    db_key = ApiKey(
        org_id=user.org_id,
        name=data.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
    )
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)

    return {
        "id": str(db_key.id),
        "name": db_key.name,
        "key_prefix": db_key.key_prefix,
        "status": db_key.status,
        "created_at": db_key.created_at,
        "last_used_at": db_key.last_used_at,
        "key": raw_key,
    }


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an API key."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to revoke API keys")

    key_result = await db.execute(
        select(ApiKey).where(ApiKey.id == uuid.UUID(key_id), ApiKey.org_id == user.org_id)
    )
    db_key = key_result.scalar_one_or_none()
    
    if not db_key:
        raise HTTPException(status_code=404, detail="API key not found")

    await db.delete(db_key)
    await db.commit()
    return {"detail": "API key revoked"}
