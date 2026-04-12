"""SportShield AI — Auth API endpoints."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user_id,
)
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenRefresh,
    TokenResponse,
    UserResponse,
)

from pydantic import BaseModel

class MessageResponse(BaseModel):
    message: str

router = APIRouter(prefix="/auth", tags=["auth"])

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Helper to set secure HTTP-only cookies for auth tokens."""
    # Access token: expires in 15 mins (match ACCESS_TOKEN_EXPIRE_MINUTES)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="lax",
        max_age=15 * 60,
    )
    # Refresh token: expires in 7 days
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and create their organization."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create organization
    org = Organization(
        name=data.org_name,
        email_domain=data.email.split("@")[1],
        plan="starter",
    )
    db.add(org)
    await db.flush()

    # Create user
    user = User(
        org_id=org.id,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="admin",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return user


from app.core.rate_limit import limiter

@router.post("/login", response_model=MessageResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate user and set HTTP-only cookies for JWT session."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Create tokens with user ID and org ID in payload
    token_data = {"sub": str(user.id), "org_id": str(user.org_id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    _set_auth_cookies(response, access_token, refresh_token)

    return MessageResponse(message="Successfully logged in")


@router.post("/refresh", response_model=MessageResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Refresh expired access token using http-only refresh cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token found",
        )
        
    payload = decode_token(refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    org_id = payload.get("org_id")

    # Verify user still exists and is active
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    # Issue new tokens
    token_data = {"sub": str(user.id), "org_id": str(user.org_id)}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    _set_auth_cookies(response, access_token, new_refresh_token)

    return MessageResponse(message="Session refreshed")


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Clear http-only secure cookies to logout."""
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    response.delete_cookie(key="refresh_token", httponly=True, samesite="lax")
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user's profile."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user
