"""SportShield AI — Main FastAPI application."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limit import limiter
from app.api.router import api_router
from app.websocket.manager import socket_app

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup: ensure upload directory exists
    Path(settings.LOCAL_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
    Path(settings.FAISS_INDEX_PATH).parent.mkdir(parents=True, exist_ok=True)
    
    # Initialize Redis caching
    redis = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    
    print("SportShield AI started with Redis caching initialized")
    yield
    # Shutdown
    await redis.close()
    print("SportShield AI shutting down")

app = FastAPI(
    title="SportShield AI",
    description="AI-powered sports media fingerprinting and IP protection platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# Include API routes
app.include_router(api_router)

# Mount Socket.IO
app.mount("/ws", socket_app)

# Serve uploaded files in dev mode
if settings.STORAGE_BACKEND == "local":
    uploads_path = Path(settings.LOCAL_STORAGE_PATH)
    uploads_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "SportShield AI"}
