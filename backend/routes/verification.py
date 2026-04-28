from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.blockchain import BlockchainRecord
from backend.schemas.verification import VerificationResponse
from backend.services.blockchain import BlockchainService


router = APIRouter(tags=["verification"])
service = BlockchainService()


@router.get("/verify/{video_id}", response_model=VerificationResponse)
def verify_video(video_id: str, db: Session = Depends(get_db)) -> VerificationResponse:
    record = db.execute(select(BlockchainRecord).where(BlockchainRecord.video_id == video_id)).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Verification record not found")

    return VerificationResponse(
        video_id=video_id,
        owner=record.owner,
        recorded_at=record.timestamp,
        chain_hash=record.chain_hash,
        previous_hash=record.previous_hash,
        verification_signature=record.verification_signature,
        payload=record.payload,
        verified=service.verify(record),
    )

