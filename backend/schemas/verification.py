from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class VerificationResponse(BaseModel):
    video_id: str
    owner: str
    recorded_at: datetime
    chain_hash: str
    previous_hash: str
    verification_signature: str
    payload: dict = Field(default_factory=dict)
    verified: bool

