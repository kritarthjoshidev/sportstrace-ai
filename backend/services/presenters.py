from __future__ import annotations

from pathlib import Path

from backend.core.config import settings
from backend.models.video import Video
from backend.schemas.common import VideoSummary


def build_media_url(file_path: str | None) -> str | None:
    if not file_path:
        return None
    try:
        relative = Path(file_path).resolve().relative_to(settings.upload_dir.resolve())
        return f"/media/{relative.as_posix()}"
    except Exception:
        return None


def build_video_summary(video: Video) -> VideoSummary:
    return VideoSummary(
        id=video.id,
        title=video.title,
        owner=video.owner,
        source_type=video.source_type,
        upload_time=video.upload_time,
        duration_seconds=video.duration_seconds,
        league=video.league,
        media_url=build_media_url(video.file_path),
        source_url=video.preview_path,
    )
