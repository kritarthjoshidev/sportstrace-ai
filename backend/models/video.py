from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_contact: Mapped[str | None] = mapped_column(String(255))
    league: Mapped[str | None] = mapped_column(String(255))
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    preview_path: Mapped[str | None] = mapped_column(Text)
    upload_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC).replace(tzinfo=None),
        nullable=False,
    )
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="processed", nullable=False)

    hash_record = relationship("HashRecord", back_populates="video", uselist=False, cascade="all, delete-orphan")
    blockchain_record = relationship(
        "BlockchainRecord",
        back_populates="video",
        uselist=False,
        cascade="all, delete-orphan",
    )
