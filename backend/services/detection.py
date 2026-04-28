from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.errors import InvalidVideoError
from backend.models.detection import Detection
from backend.models.hash_record import HashRecord
from backend.models.video import Video
from backend.schemas.common import NoticeDeliveryStatus, UploadOriginalResponse, UploadSuspectedResponse, VideoSummary
from backend.services.blockchain import BlockchainService
from backend.services.dmca import DMCAGenerator
from backend.services.hashing import HashingService
from backend.services.notifications import NoticeEmailService
from backend.services.presenters import build_video_summary
from backend.services.remote_video import RemoteVideoService
from backend.services.similarity import SimilarityService
from backend.services.video_processing import VideoProcessingService


class DetectionService:
    def __init__(self) -> None:
        self.video_processing = VideoProcessingService(
            frame_width=settings.frame_width,
            frame_height=settings.frame_height,
            sample_interval_seconds=settings.sample_interval_seconds,
        )
        self.hashing = HashingService()
        self.similarity = SimilarityService()
        self.blockchain = BlockchainService()
        self.dmca = DMCAGenerator()
        self.remote_video = RemoteVideoService()
        self.notice_email = NoticeEmailService()

    def ingest_original(
        self,
        db: Session,
        upload: UploadFile,
        title: str,
        owner: str,
        owner_contact: str | None = None,
        league: str | None = None,
    ) -> UploadOriginalResponse:
        stored_path = self._store_upload(upload, "originals")
        try:
            samples, metadata = self.video_processing.sample_frames(stored_path)
            fingerprint = self.hashing.fingerprint_video(stored_path, samples, metadata)
        except InvalidVideoError:
            self._delete_file_quietly(stored_path)
            raise

        video = Video(
            title=title,
            owner=owner,
            owner_contact=owner_contact,
            league=league,
            source_type="original",
            file_path=str(stored_path),
            duration_seconds=metadata.duration_seconds,
        )
        db.add(video)
        db.flush()

        hash_record = HashRecord(
            video_id=video.id,
            aggregate_hash=fingerprint.aggregate_hash,
            external_video_hash=fingerprint.external_video_hash,
            hash_method=fingerprint.method,
            hash_values=fingerprint.serialize_frames(),
            feature_summary=fingerprint.feature_summary,
            proof_digest=fingerprint.proof_digest,
        )
        db.add(hash_record)
        blockchain_record = self.blockchain.register_video(db, video, hash_record)
        db.commit()
        db.refresh(video)

        return UploadOriginalResponse(
            video=build_video_summary(video),
            aggregate_hash=hash_record.aggregate_hash,
            verification_hash=blockchain_record.chain_hash,
            sampled_frames=len(fingerprint.frames),
            method=fingerprint.method,
        )

    def ingest_suspect(
        self,
        db: Session,
        upload: UploadFile | None,
        title: str,
        owner: str = "External Source",
        owner_contact: str | None = None,
        league: str | None = None,
        original_id: str | None = None,
        suspect_url: str | None = None,
        notice_recipient_email: str | None = None,
        send_notice_on_match: bool = False,
    ) -> UploadSuspectedResponse:
        normalized_source_url = (suspect_url or "").strip() or None
        stored_path = self._resolve_suspect_source(upload, normalized_source_url)
        try:
            samples, metadata = self.video_processing.sample_frames(stored_path)
            fingerprint = self.hashing.fingerprint_video(stored_path, samples, metadata)
        except InvalidVideoError:
            self._delete_file_quietly(stored_path)
            raise

        suspect_video = Video(
            title=title,
            owner=owner,
            owner_contact=notice_recipient_email or owner_contact,
            league=league,
            source_type="suspect",
            file_path=str(stored_path),
            preview_path=normalized_source_url,
            duration_seconds=metadata.duration_seconds,
        )
        db.add(suspect_video)
        db.flush()

        suspect_hash_record = HashRecord(
            video_id=suspect_video.id,
            aggregate_hash=fingerprint.aggregate_hash,
            external_video_hash=fingerprint.external_video_hash,
            hash_method=fingerprint.method,
            hash_values=fingerprint.serialize_frames(),
            feature_summary=fingerprint.feature_summary,
            proof_digest=fingerprint.proof_digest,
        )
        db.add(suspect_hash_record)

        originals = self._load_originals(db, original_id=original_id)
        if not originals:
            db.commit()
            return UploadSuspectedResponse(
                suspect_video=build_video_summary(suspect_video),
                best_match=None,
                all_matches=[],
                source_url=normalized_source_url,
                notice_delivery=self.notice_email.skipped(
                    "No protected originals were available for comparison, so no notice was sent.",
                    recipient_email=notice_recipient_email,
                    requested=send_notice_on_match,
                ),
            )

        match_candidates: list[tuple[dict, str]] = []
        for original_video, original_hash in originals:
            original_samples, _ = self.video_processing.sample_frames(original_video.file_path)
            original_fingerprint = self.hashing.fingerprint_video(
                original_video.file_path,
                original_samples,
                self.video_processing.extract_metadata(original_video.file_path),
            )
            result = self.similarity.compare(original_fingerprint, fingerprint, original_samples, samples)
            blockchain_record = original_video.blockchain_record or self.blockchain.register_video(db, original_video, original_hash)
            dmca_notice = self.dmca.generate_notice(original_video, suspect_video, blockchain_record, result)

            detection = Detection(
                original_id=original_video.id,
                suspect_id=suspect_video.id,
                score=result.score,
                confidence=result.confidence,
                result=result.classification,
                severity_rank=result.severity_rank,
                matched_frames=result.serialize_matches(),
                evidence_summary=result.evidence_summary,
                dmca_notice=dmca_notice,
            )
            db.add(detection)
            db.flush()

            match_candidates.append(
                (
                    {
                    "detection_id": detection.id,
                    "original_id": original_video.id,
                    "original_title": original_video.title,
                    "score": result.score,
                    "confidence": result.confidence,
                    "classification": result.classification,
                    "severity_rank": result.severity_rank,
                    "proof_chain_hash": blockchain_record.chain_hash,
                    },
                    dmca_notice,
                )
            )

        db.commit()

        match_candidates.sort(key=lambda item: (item[0]["severity_rank"], item[0]["score"]), reverse=True)
        matches = [item[0] for item in match_candidates]
        best_candidate = match_candidates[0] if match_candidates else None
        notice_delivery = self._handle_notice_delivery(
            best_candidate=best_candidate,
            notice_recipient_email=notice_recipient_email,
            send_notice_on_match=send_notice_on_match,
            suspect_source_url=normalized_source_url,
        )
        return UploadSuspectedResponse(
            suspect_video=build_video_summary(suspect_video),
            best_match=matches[0] if matches else None,
            all_matches=matches,
            source_url=normalized_source_url,
            notice_delivery=notice_delivery,
        )

    def _store_upload(self, upload: UploadFile, bucket: str) -> Path:
        suffix = Path(upload.filename or "video.mp4").suffix or ".mp4"
        target_dir = settings.upload_dir / bucket
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / f"{uuid.uuid4()}{suffix}"

        with target_path.open("wb") as output:
            shutil.copyfileobj(upload.file, output)
        upload.file.close()

        if target_path.stat().st_size == 0:
            self._delete_file_quietly(target_path)
            raise InvalidVideoError("The uploaded file is empty. Please choose a real video file.")
        return target_path

    def _load_originals(self, db: Session, original_id: str | None = None) -> list[tuple[Video, HashRecord]]:
        stmt = (
            select(Video, HashRecord)
            .join(HashRecord, HashRecord.video_id == Video.id)
            .where(Video.source_type == "original")
        )
        if original_id:
            stmt = stmt.where(Video.id == original_id)
        return list(db.execute(stmt).all())

    def _resolve_suspect_source(self, upload: UploadFile | None, suspect_url: str | None) -> Path:
        if upload is not None and suspect_url:
            raise InvalidVideoError("Provide either a suspect video file or a public video link, not both.")
        if upload is not None:
            return self._store_upload(upload, "suspects")
        if suspect_url:
            return self.remote_video.fetch(suspect_url, bucket="suspects")
        raise InvalidVideoError("Upload a suspect video file or provide a public video link to analyze.")

    def _handle_notice_delivery(
        self,
        best_candidate: tuple[dict, str] | None,
        notice_recipient_email: str | None,
        send_notice_on_match: bool,
        suspect_source_url: str | None,
    ) -> NoticeDeliveryStatus:
        if not send_notice_on_match:
            return self.notice_email.skipped("Automatic copyright email is turned off.", requested=False)

        if best_candidate is None:
            return self.notice_email.skipped(
                "No copyright match was found, so no automatic notice was sent.",
                recipient_email=notice_recipient_email,
                requested=True,
            )

        best_match, dmca_notice = best_candidate
        if best_match["classification"] == "safe":
            return self.notice_email.skipped(
                "The analyzed video was classified as safe, so no copyright notice was sent.",
                recipient_email=notice_recipient_email,
                requested=True,
            )

        return self.notice_email.send_notice(
            recipient_email=notice_recipient_email,
            dmca_notice=dmca_notice,
            suspect_source_url=suspect_source_url,
        )

    def _delete_file_quietly(self, path: Path) -> None:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
