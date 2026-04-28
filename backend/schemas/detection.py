from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from backend.schemas.common import VideoSummary


class DetectionAlert(BaseModel):
    id: str
    original_id: str
    suspect_id: str
    score: float
    confidence: float
    result: str
    severity_rank: int
    created_at: datetime
    original_title: str
    suspect_title: str


class DetectionDetail(BaseModel):
    id: str
    score: float
    confidence: float
    result: str
    severity_rank: int
    created_at: datetime
    original_video: VideoSummary
    suspect_video: VideoSummary
    matched_frames: list[dict] = Field(default_factory=list)
    evidence_summary: dict = Field(default_factory=dict)
    dmca_notice: str

