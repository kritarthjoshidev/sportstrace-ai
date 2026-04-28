from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.core.errors import InvalidVideoError
from backend.db.session import get_db
from backend.schemas.common import UploadOriginalResponse, UploadSuspectedResponse
from backend.services.detection import DetectionService


router = APIRouter(tags=["uploads"])
service = DetectionService()


@router.post("/upload-original", response_model=UploadOriginalResponse)
def upload_original(
    file: UploadFile = File(...),
    title: str = Form(...),
    owner: str = Form(...),
    owner_contact: str | None = Form(default=None),
    league: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> UploadOriginalResponse:
    try:
        return service.ingest_original(db, file, title, owner, owner_contact, league)
    except InvalidVideoError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/upload-suspected", response_model=UploadSuspectedResponse)
def upload_suspected(
    file: UploadFile | None = File(default=None),
    title: str = Form(...),
    owner: str = Form(default="External Source"),
    owner_contact: str | None = Form(default=None),
    league: str | None = Form(default=None),
    original_id: str | None = Form(default=None),
    suspect_url: str | None = Form(default=None),
    notice_recipient_email: str | None = Form(default=None),
    send_notice_on_match: bool = Form(default=False),
    db: Session = Depends(get_db),
) -> UploadSuspectedResponse:
    try:
        return service.ingest_suspect(
            db,
            file,
            title,
            owner,
            owner_contact,
            league,
            original_id,
            suspect_url,
            notice_recipient_email,
            send_notice_on_match,
        )
    except InvalidVideoError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
