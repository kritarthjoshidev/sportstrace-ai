from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base


class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[str] = mapped_column(String(36), ForeignKey("videos.id"), unique=True, nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC).replace(tzinfo=None),
        nullable=False,
    )
    previous_hash: Mapped[str] = mapped_column(String(128), default="GENESIS", nullable=False)
    chain_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    verification_signature: Mapped[str] = mapped_column(Text, nullable=False)

    video = relationship("Video", back_populates="blockchain_record")
