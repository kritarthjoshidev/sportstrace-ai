from __future__ import annotations

from pydantic import BaseModel, Field

from backend.schemas.detection import DetectionAlert


class DashboardStats(BaseModel):
    total_videos: int
    total_originals: int
    total_suspects: int
    piracy_alerts: int
    suspicious_cases: int
    safe_cases: int
    average_score: float
    recent_alerts: list[DetectionAlert] = Field(default_factory=list)
    trend: list[dict] = Field(default_factory=list)

