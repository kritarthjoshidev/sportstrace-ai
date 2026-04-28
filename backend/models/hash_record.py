from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base


class HashRecord(Base):
    __tablename__ = "hashes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[str] = mapped_column(String(36), ForeignKey("videos.id"), unique=True, nullable=False)
    aggregate_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    external_video_hash: Mapped[str | None] = mapped_column(String(255))
    hash_method: Mapped[str] = mapped_column(String(255), nullable=False)
    hash_values: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    feature_summary: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    proof_digest: Mapped[str] = mapped_column(Text, nullable=False)

    video = relationship("Video", back_populates="hash_record")

