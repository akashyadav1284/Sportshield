"""SportShield AI — Auth API endpoints."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
import httpx
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
from app.core.config import settings

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
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Please contact an administrator to create an account.",
    )


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

    # Force everyone into the demo org as an admin
    demo_user_result = await db.execute(select(User).where(User.email == "demo@sportshield.ai"))
    demo_user = demo_user_result.scalar_one_or_none()
    if demo_user and user.org_id != demo_user.org_id:
        user.org_id = demo_user.org_id
        user.role = "admin"
        await db.commit()

    # Create tokens with user ID and org ID in payload
    token_data = {"sub": str(user.id), "org_id": str(user.org_id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    _set_auth_cookies(response, access_token, refresh_token)

    return MessageResponse(message="Successfully logged in")


@router.get("/google/url")
async def google_auth_url():
    """Get the Google OAuth 2.0 authorization URL."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Auth is not configured")
        
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        "response_type=code&"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        "scope=openid%20email%20profile&"
        "access_type=offline"
    )
    return {"url": url}

@router.get("/google/callback")
async def google_auth_callback(code: str, response: Response, db: AsyncSession = Depends(get_db)):
    """Exchange authorization code for access token and authenticate user."""
    # 1. Exchange code for Google access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=token_data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google token")
        google_access_token = token_res.json().get("access_token")

        # 2. Get user info
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_info_res = await client.get(
            user_info_url, headers={"Authorization": f"Bearer {google_access_token}"}
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")
        
        user_data = user_info_res.json()

    email = user_data.get("email")
    full_name = user_data.get("name", "Google User")

    if not email:
        raise HTTPException(status_code=400, detail="No email provided by Google")

    # 3. Find or Create User
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Find demo org
        demo_user_result = await db.execute(select(User).where(User.email == "demo@sportshield.ai"))
        demo_user = demo_user_result.scalar_one_or_none()
        
        if demo_user:
            org_id = demo_user.org_id
        else:
            org = Organization(
                name="Premier FC",
                email_domain="sportshield.ai",
                plan="pro",
            )
            db.add(org)
            await db.flush()
            org_id = org.id

        # Create user with a dummy unusable password
        import secrets
        dummy_password = secrets.token_urlsafe(32)
        user = User(
            org_id=org_id,
            email=email,
            hashed_password=hash_password(dummy_password),
            full_name=full_name,
            role="admin",
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Force everyone into the demo org as an admin
    demo_user_result = await db.execute(select(User).where(User.email == "demo@sportshield.ai"))
    demo_user = demo_user_result.scalar_one_or_none()
    if demo_user and user.org_id != demo_user.org_id:
        user.org_id = demo_user.org_id
        user.role = "admin"
        await db.commit()

    # 4. Issue standard JWTs
    token_payload = {"sub": str(user.id), "org_id": str(user.org_id)}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    # 5. Create redirect response and set cookies on it
    redirect_res = RedirectResponse(url="http://localhost:5173/")
    _set_auth_cookies(redirect_res, access_token, refresh_token)

    return redirect_res



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
