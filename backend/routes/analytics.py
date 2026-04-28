from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from backend.db.session import get_db
from backend.models.detection import Detection
from backend.models.video import Video
from backend.schemas.analytics import DashboardStats
from backend.schemas.detection import DetectionAlert


router = APIRouter(tags=["analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)) -> DashboardStats:
    total_videos = db.scalar(select(func.count(Video.id))) or 0
    total_originals = db.scalar(select(func.count(Video.id)).where(Video.source_type == "original")) or 0
    total_suspects = db.scalar(select(func.count(Video.id)).where(Video.source_type == "suspect")) or 0
    piracy_alerts = db.scalar(select(func.count(Detection.id)).where(Detection.result == "pirated")) or 0
    suspicious_cases = db.scalar(select(func.count(Detection.id)).where(Detection.result == "suspicious")) or 0
    safe_cases = db.scalar(select(func.count(Detection.id)).where(Detection.result == "safe")) or 0
    average_score = db.scalar(select(func.avg(Detection.score))) or 0.0

    original_video = aliased(Video)
    suspect_video = aliased(Video)
    recent_rows = db.execute(
        select(Detection, original_video, suspect_video)
        .join(original_video, original_video.id == Detection.original_id)
        .join(suspect_video, suspect_video.id == Detection.suspect_id)
        .order_by(Detection.created_at.desc())
        .limit(5)
    ).all()

    recent_alerts = [
        DetectionAlert(
            id=detection.id,
            original_id=detection.original_id,
            suspect_id=detection.suspect_id,
            score=detection.score,
            confidence=detection.confidence,
            result=detection.result,
            severity_rank=detection.severity_rank,
            created_at=detection.created_at,
            original_title=original.title,
            suspect_title=suspect.title,
        )
        for detection, original, suspect in recent_rows
    ]

    daily_rows = db.execute(
        select(func.date(Detection.created_at), Detection.result)
    ).all()
    grouped = Counter((str(day), result) for day, result in daily_rows)
    trend = []
    for day in sorted({str(day) for day, _ in grouped.keys()}):
        trend.append(
            {
                "day": day,
                "pirated": grouped.get((day, "pirated"), 0),
                "suspicious": grouped.get((day, "suspicious"), 0),
                "safe": grouped.get((day, "safe"), 0),
            }
        )

    return DashboardStats(
        total_videos=total_videos,
        total_originals=total_originals,
        total_suspects=total_suspects,
        piracy_alerts=piracy_alerts,
        suspicious_cases=suspicious_cases,
        safe_cases=safe_cases,
        average_score=round(float(average_score), 4),
        recent_alerts=recent_alerts,
        trend=trend,
    )

