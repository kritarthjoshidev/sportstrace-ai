from __future__ import annotations

import hashlib
from dataclasses import asdict, dataclass
from typing import Any

import cv2
import imagehash
import numpy as np
from PIL import Image

from backend.services.video_processing import FrameSample, VideoMetadata

try:
    from videohash import VideoHash
except Exception:  # pragma: no cover - optional dependency
    VideoHash = None


@dataclass(slots=True)
class FrameHashBundle:
    timestamp: float
    phash: str
    edge_hash: str
    crop_hashes: list[str]


@dataclass(slots=True)
class VideoFingerprint:
    aggregate_hash: str
    external_video_hash: str | None
    method: str
    frames: list[FrameHashBundle]
    feature_summary: dict[str, Any]
    proof_digest: str

    def serialize_frames(self) -> list[dict[str, Any]]:
        return [asdict(frame) for frame in self.frames]


class HashingService:
    def fingerprint_video(
        self,
        video_path: str,
        samples: list[FrameSample],
        metadata: VideoMetadata,
    ) -> VideoFingerprint:
        frame_bundles = [self._build_frame_bundle(sample) for sample in samples]
        aggregate_hash = self._aggregate_hash(frame_bundles)
        external_hash = self._compute_external_video_hash(video_path)
        proof_digest = self._build_proof_digest(aggregate_hash, frame_bundles, external_hash)
        feature_summary = {
            "sampled_frames": len(frame_bundles),
            "duration_seconds": round(metadata.duration_seconds, 2),
            "fps": round(metadata.fps, 2),
            "frame_size": [metadata.width, metadata.height],
            "hash_size_bits": 64,
        }
        method = "phash+crop+edge"
        if external_hash:
            method += "+videohash"

        return VideoFingerprint(
            aggregate_hash=aggregate_hash,
            external_video_hash=external_hash,
            method=method,
            frames=frame_bundles,
            feature_summary=feature_summary,
            proof_digest=proof_digest,
        )

    def _build_frame_bundle(self, sample: FrameSample) -> FrameHashBundle:
        image = Image.fromarray(sample.frame)
        phash = str(imagehash.phash(image))

        gray = cv2.cvtColor(sample.frame, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        edge_hash = str(imagehash.phash(Image.fromarray(edges)))

        crop_hashes = [str(imagehash.phash(Image.fromarray(crop))) for crop in self._crop_variants(sample.frame)]
        return FrameHashBundle(
            timestamp=round(sample.timestamp, 3),
            phash=phash,
            edge_hash=edge_hash,
            crop_hashes=crop_hashes,
        )

    def _crop_variants(self, frame: np.ndarray) -> list[np.ndarray]:
        height, width, _ = frame.shape
        center_margin_y = max(1, int(height * 0.1))
        center_margin_x = max(1, int(width * 0.1))

        center = frame[center_margin_y : height - center_margin_y, center_margin_x : width - center_margin_x]
        top = frame[: int(height * 0.85), :]
        bottom = frame[int(height * 0.15) :, :]
        left = frame[:, : int(width * 0.85)]
        right = frame[:, int(width * 0.15) :]
        return [center, top, bottom, left, right]

    def _aggregate_hash(self, frames: list[FrameHashBundle]) -> str:
        bit_arrays = [self._hex_hash_to_bits(frame.phash) for frame in frames]
        mean_bits = np.mean(bit_arrays, axis=0)
        aggregate_bits = ["1" if value >= 0.5 else "0" for value in mean_bits]
        return f"{int(''.join(aggregate_bits), 2):016x}"

    def _build_proof_digest(
        self,
        aggregate_hash: str,
        frames: list[FrameHashBundle],
        external_hash: str | None,
    ) -> str:
        digest = hashlib.sha256()
        digest.update(aggregate_hash.encode("utf-8"))
        if external_hash:
            digest.update(external_hash.encode("utf-8"))
        for frame in frames:
            digest.update(frame.phash.encode("utf-8"))
            digest.update(frame.edge_hash.encode("utf-8"))
            for crop_hash in frame.crop_hashes:
                digest.update(crop_hash.encode("utf-8"))
        return digest.hexdigest()

    def _compute_external_video_hash(self, video_path: str) -> str | None:
        if VideoHash is None:
            return None

        try:
            video_hash = VideoHash(path=video_path)
            return getattr(video_hash, "hash", None) or getattr(video_hash, "value", None) or str(video_hash)
        except Exception:
            return None

    @staticmethod
    def _hex_hash_to_bits(value: str) -> np.ndarray:
        return np.array(list(f"{int(value, 16):064b}"), dtype=np.uint8)

