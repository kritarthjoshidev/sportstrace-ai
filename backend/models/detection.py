from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.base import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_id: Mapped[str] = mapped_column(String(36), ForeignKey("videos.id"), nullable=False)
    suspect_id: Mapped[str] = mapped_column(String(36), ForeignKey("videos.id"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    result: Mapped[str] = mapped_column(String(32), nullable=False)
    severity_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_frames: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    evidence_summary: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    dmca_notice: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC).replace(tzinfo=None),
        nullable=False,
    )
