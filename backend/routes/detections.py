from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, aliased

from backend.db.session import get_db
from backend.models.detection import Detection
from backend.models.video import Video
from backend.schemas.detection import DetectionAlert, DetectionDetail
from backend.services.presenters import build_video_summary


router = APIRouter(tags=["detections"])


@router.get("/detect/{detection_id}", response_model=DetectionDetail)
def get_detection(detection_id: str, db: Session = Depends(get_db)) -> DetectionDetail:
    original_video = aliased(Video)
    suspect_video = aliased(Video)

    row = db.execute(
        select(Detection, original_video, suspect_video)
        .join(original_video, original_video.id == Detection.original_id)
        .join(suspect_video, suspect_video.id == Detection.suspect_id)
        .where(Detection.id == detection_id)
    ).one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Detection not found")

    detection, original, suspect = row
    return DetectionDetail(
        id=detection.id,
        score=detection.score,
        confidence=detection.confidence,
        result=detection.result,
        severity_rank=detection.severity_rank,
        created_at=detection.created_at,
        original_video=build_video_summary(original),
        suspect_video=build_video_summary(suspect),
        matched_frames=detection.matched_frames,
        evidence_summary=detection.evidence_summary,
        dmca_notice=detection.dmca_notice,
    )


@router.get("/alerts", response_model=list[DetectionAlert])
def get_alerts(
    severity: str | None = Query(default=None, pattern="^(pirated|suspicious|safe)?$"),
    db: Session = Depends(get_db),
) -> list[DetectionAlert]:
    original_video = aliased(Video)
    suspect_video = aliased(Video)

    stmt = (
        select(Detection, original_video, suspect_video)
        .join(original_video, original_video.id == Detection.original_id)
        .join(suspect_video, suspect_video.id == Detection.suspect_id)
        .order_by(desc(Detection.created_at))
    )
    if severity:
        stmt = stmt.where(Detection.result == severity)

    rows = db.execute(stmt).all()
    return [
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
        for detection, original, suspect in rows
    ]
