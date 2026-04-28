from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.video import Video
from backend.schemas.common import VideoSummary
from backend.services.presenters import build_video_summary


router = APIRouter(tags=["videos"])


@router.get("/videos", response_model=list[VideoSummary])
def list_videos(
    source_type: str | None = Query(default=None, pattern="^(original|suspect)?$"),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[VideoSummary]:
    stmt = select(Video).order_by(desc(Video.upload_time)).limit(limit)
    if source_type:
        stmt = stmt.where(Video.source_type == source_type)

    videos = db.execute(stmt).scalars().all()
    return [build_video_summary(video) for video in videos]
