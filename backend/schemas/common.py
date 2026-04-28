from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str


class VideoSummary(BaseModel):
    id: str
    title: str
    owner: str
    source_type: str
    upload_time: datetime
    duration_seconds: float | None = None
    league: str | None = None
    media_url: str | None = None
    source_url: str | None = None


class UploadOriginalResponse(BaseModel):
    video: VideoSummary
    aggregate_hash: str
    verification_hash: str
    sampled_frames: int
    method: str


class NoticeDeliveryStatus(BaseModel):
    requested: bool
    status: str
    message: str
    recipient_email: str | None = None


class UploadSuspectedResponse(BaseModel):
    suspect_video: VideoSummary
    best_match: dict | None = None
    all_matches: list[dict] = Field(default_factory=list)
    source_url: str | None = None
    notice_delivery: NoticeDeliveryStatus | None = None
