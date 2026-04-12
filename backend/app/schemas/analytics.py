"""SportShield AI — Analytics Pydantic schemas."""

from typing import List

from pydantic import BaseModel


class StatsResponse(BaseModel):
    total_assets: int
    total_violations: int
    active_violations: int
    resolved_this_week: int
    scans_today: int


class TrendPoint(BaseModel):
    date: str
    count: int


class TrendsResponse(BaseModel):
    data: List[TrendPoint]


class PlatformBreakdown(BaseModel):
    platform: str
    count: int


class PlatformResponse(BaseModel):
    data: List[PlatformBreakdown]


class SeverityBreakdown(BaseModel):
    severity: str
    count: int


class SeverityResponse(BaseModel):
    data: List[SeverityBreakdown]
