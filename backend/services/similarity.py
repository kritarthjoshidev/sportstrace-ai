from __future__ import annotations

from dataclasses import asdict, dataclass

import cv2
import imagehash
import numpy as np
from skimage.metrics import structural_similarity

from backend.core.config import settings
from backend.services.hashing import FrameHashBundle, VideoFingerprint
from backend.services.video_processing import FrameSample


@dataclass(slots=True)
class FrameMatch:
    original_timestamp: float
    suspect_timestamp: float
    similarity: float
    phash_similarity: float
    crop_similarity: float
    edge_similarity: float
    ssim_similarity: float


@dataclass(slots=True)
class SimilarityResult:
    score: float
    confidence: float
    classification: str
    severity_rank: int
    matched_frames: list[FrameMatch]
    evidence_summary: dict

    def serialize_matches(self) -> list[dict]:
        return [asdict(match) for match in self.matched_frames]


class SimilarityService:
    def compare(
        self,
        original_fingerprint: VideoFingerprint,
        suspect_fingerprint: VideoFingerprint,
        original_samples: list[FrameSample],
        suspect_samples: list[FrameSample],
    ) -> SimilarityResult:
        original_lookup = {round(sample.timestamp, 3): sample.frame for sample in original_samples}
        suspect_lookup = {round(sample.timestamp, 3): sample.frame for sample in suspect_samples}

        frame_matches: list[FrameMatch] = []
        for suspect_frame in suspect_fingerprint.frames:
            best_match = self._best_match_for_frame(
                suspect_frame,
                original_fingerprint.frames,
                original_lookup,
                suspect_lookup,
            )
            frame_matches.append(best_match)

        ordered = sorted(frame_matches, key=lambda match: match.similarity, reverse=True)
        window = max(1, int(len(ordered) * 0.6))
        top_matches = ordered[:window]
        average_score = float(np.mean([match.similarity for match in top_matches]))
        aggregate_hash_similarity = float(
            self._hash_similarity(original_fingerprint.aggregate_hash, suspect_fingerprint.aggregate_hash)
        )
        sequence_consistency = self._sequence_consistency(top_matches)
        coverage_ratio = self._coverage_ratio(top_matches)
        score = round(
            ((average_score * sequence_consistency * 0.85) + (aggregate_hash_similarity * 0.15)) * coverage_ratio,
            4,
        )
        confidence = round(
            self._confidence_from_matches(top_matches) * ((coverage_ratio * 0.6) + (sequence_consistency * 0.4)),
            4,
        )
        classification, severity_rank = self._classify(score)

        evidence_summary = {
            "evaluated_frames": len(frame_matches),
            "top_match_ratio": round(len(top_matches) / max(1, len(frame_matches)), 3),
            "average_ssim": round(float(np.mean([match.ssim_similarity for match in top_matches])), 4),
            "aggregate_hash_similarity": round(aggregate_hash_similarity, 4),
            "sequence_consistency": round(sequence_consistency, 4),
            "coverage_ratio": round(coverage_ratio, 4),
            "external_video_hash_match": (
                original_fingerprint.external_video_hash == suspect_fingerprint.external_video_hash
                if original_fingerprint.external_video_hash and suspect_fingerprint.external_video_hash
                else False
            ),
            "heatmap": [
                {
                    "original": match.original_timestamp,
                    "suspect": match.suspect_timestamp,
                    "score": float(round(match.similarity, 4)),
                }
                for match in ordered[: min(12, len(ordered))]
            ],
        }

        return SimilarityResult(
            score=score,
            confidence=confidence,
            classification=classification,
            severity_rank=severity_rank,
            matched_frames=ordered[: min(10, len(ordered))],
            evidence_summary=evidence_summary,
        )

    def _best_match_for_frame(
        self,
        suspect_frame: FrameHashBundle,
        original_frames: list[FrameHashBundle],
        original_lookup: dict[float, np.ndarray],
        suspect_lookup: dict[float, np.ndarray],
    ) -> FrameMatch:
        best: FrameMatch | None = None

        for original_frame in original_frames:
            phash_similarity = self._hash_similarity(suspect_frame.phash, original_frame.phash)
            crop_similarity = self._cross_crop_similarity(suspect_frame, original_frame)
            edge_similarity = self._hash_similarity(suspect_frame.edge_hash, original_frame.edge_hash)

            combined = (phash_similarity * 0.45) + (crop_similarity * 0.35) + (edge_similarity * 0.20)
            ssim_similarity = 0.0
            if combined >= 0.4:
                original_image = original_lookup.get(round(original_frame.timestamp, 3))
                suspect_image = suspect_lookup.get(round(suspect_frame.timestamp, 3))
                if original_image is not None and suspect_image is not None:
                    ssim_similarity = self._ssim_similarity(original_image, suspect_image)
                    combined = (combined * 0.8) + (ssim_similarity * 0.2)

            candidate = FrameMatch(
                original_timestamp=original_frame.timestamp,
                suspect_timestamp=suspect_frame.timestamp,
                similarity=round(combined, 4),
                phash_similarity=round(phash_similarity, 4),
                crop_similarity=round(crop_similarity, 4),
                edge_similarity=round(edge_similarity, 4),
                ssim_similarity=round(ssim_similarity, 4),
            )

            if best is None or candidate.similarity > best.similarity:
                best = candidate

        if best is None:
            raise ValueError("No frame comparison could be produced.")
        return best

    def _cross_crop_similarity(self, suspect_frame: FrameHashBundle, original_frame: FrameHashBundle) -> float:
        candidates = [self._hash_similarity(suspect_frame.phash, original_frame.phash)]
        candidates.extend(
            self._hash_similarity(suspect_frame.phash, crop_hash) for crop_hash in original_frame.crop_hashes
        )
        candidates.extend(
            self._hash_similarity(original_frame.phash, crop_hash) for crop_hash in suspect_frame.crop_hashes
        )
        for suspect_crop in suspect_frame.crop_hashes:
            candidates.extend(
                self._hash_similarity(suspect_crop, original_crop) for original_crop in original_frame.crop_hashes
            )
        return float(max(candidates))

    def _ssim_similarity(self, original: np.ndarray, suspect: np.ndarray) -> float:
        original_gray = cv2.cvtColor(original, cv2.COLOR_RGB2GRAY)
        suspect_gray = cv2.cvtColor(suspect, cv2.COLOR_RGB2GRAY)
        return float(structural_similarity(original_gray, suspect_gray))

    def _hash_similarity(self, left: str, right: str) -> float:
        hash_left = imagehash.hex_to_hash(left)
        hash_right = imagehash.hex_to_hash(right)
        max_distance = hash_left.hash.size
        return 1.0 - (hash_left - hash_right) / max_distance

    def _confidence_from_matches(self, matches: list[FrameMatch]) -> float:
        score_mean = float(np.mean([match.similarity for match in matches]))
        score_variance = float(np.var([match.similarity for match in matches]))
        confidence = max(0.1, min(0.99, score_mean - (score_variance * 0.25)))
        return confidence

    def _coverage_ratio(self, matches: list[FrameMatch]) -> float:
        if not matches:
            return 0.0
        unique_originals = len({match.original_timestamp for match in matches})
        return unique_originals / len(matches)

    def _sequence_consistency(self, matches: list[FrameMatch]) -> float:
        if len(matches) <= 1:
            return 1.0

        ordered = sorted(matches, key=lambda match: match.suspect_timestamp)
        suspect = np.array([match.suspect_timestamp for match in ordered], dtype=float)
        original = np.array([match.original_timestamp for match in ordered], dtype=float)

        uniqueness = len(set(original.tolist())) / len(original)
        max_timestamp = max(float(np.max(original)), float(np.max(suspect)), 1.0)
        alignment = max(0.0, 1.0 - float(np.mean(np.abs(original - suspect))) / max_timestamp)

        correlation = 0.0
        if len(np.unique(suspect)) > 1 and len(np.unique(original)) > 1:
            correlation = float(np.corrcoef(suspect, original)[0, 1])
            if np.isnan(correlation):
                correlation = 0.0
            correlation = max(0.0, correlation)

        return float((uniqueness * 0.5) + (correlation * 0.3) + (alignment * 0.2))

    def _classify(self, score: float) -> tuple[str, int]:
        if score > settings.piracy_threshold:
            return "pirated", 3
        if score >= settings.suspicious_threshold:
            return "suspicious", 2
        return "safe", 1
