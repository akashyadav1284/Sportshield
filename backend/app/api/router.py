"""SportShield AI — API v1 router aggregating all endpoint groups."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.assets import router as assets_router
from app.api.v1.violations import router as violations_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.scan import router as scan_router
from app.api.v1.api_keys import router as api_keys_router
from app.api.v1.reports import router as reports_router
from app.api.v1.shield_ai import router as shield_ai_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(assets_router)
api_router.include_router(violations_router)
api_router.include_router(alerts_router)
api_router.include_router(analytics_router)
api_router.include_router(scan_router)
api_router.include_router(api_keys_router)
api_router.include_router(reports_router)
api_router.include_router(shield_ai_router)
