from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.blockchain import BlockchainRecord
from backend.models.hash_record import HashRecord
from backend.models.video import Video


class BlockchainService:
    def register_video(self, db: Session, video: Video, hash_record: HashRecord) -> BlockchainRecord:
        previous_record = db.execute(
            select(BlockchainRecord).order_by(BlockchainRecord.id.desc()).limit(1)
        ).scalar_one_or_none()
        previous_hash = previous_record.chain_hash if previous_record else "GENESIS"

        timestamp = datetime.now(UTC).replace(tzinfo=None)
        payload = {
            "video_id": video.id,
            "owner": video.owner,
            "title": video.title,
            "aggregate_hash": hash_record.aggregate_hash,
            "proof_digest": hash_record.proof_digest,
            "timestamp": timestamp.isoformat(),
        }
        chain_hash = self._chain_hash(payload, previous_hash)
        verification_signature = hashlib.sha256(f"{chain_hash}:{video.owner}".encode("utf-8")).hexdigest()

        record = BlockchainRecord(
            video_id=video.id,
            owner=video.owner,
            timestamp=timestamp,
            previous_hash=previous_hash,
            chain_hash=chain_hash,
            payload=payload,
            verification_signature=verification_signature,
        )
        db.add(record)
        db.flush()
        return record

    def verify(self, record: BlockchainRecord) -> bool:
        expected_hash = self._chain_hash(record.payload, record.previous_hash)
        expected_signature = hashlib.sha256(f"{expected_hash}:{record.owner}".encode("utf-8")).hexdigest()
        return expected_hash == record.chain_hash and expected_signature == record.verification_signature

    def _chain_hash(self, payload: dict, previous_hash: str) -> str:
        digest = hashlib.sha256()
        digest.update(previous_hash.encode("utf-8"))
        digest.update(repr(sorted(payload.items())).encode("utf-8"))
        return digest.hexdigest()
