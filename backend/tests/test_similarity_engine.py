from __future__ import annotations

from backend.core.config import settings
from backend.services.hashing import HashingService
from backend.services.similarity import SimilarityService
from backend.services.video_processing import VideoProcessingService
from backend.tests.utils import create_sports_clip


def test_similarity_distinguishes_edited_and_unrelated(tmp_path):
    original_path = create_sports_clip(tmp_path / "original.mp4", "original")
    edited_path = create_sports_clip(tmp_path / "edited.mp4", "edited")
    unrelated_path = create_sports_clip(tmp_path / "unrelated.mp4", "unrelated")

    processor = VideoProcessingService(settings.frame_width, settings.frame_height, settings.sample_interval_seconds)
    hashing = HashingService()
    similarity = SimilarityService()

    original_samples, original_metadata = processor.sample_frames(original_path)
    edited_samples, edited_metadata = processor.sample_frames(edited_path)
    unrelated_samples, unrelated_metadata = processor.sample_frames(unrelated_path)

    original_fingerprint = hashing.fingerprint_video(str(original_path), original_samples, original_metadata)
    edited_fingerprint = hashing.fingerprint_video(str(edited_path), edited_samples, edited_metadata)
    unrelated_fingerprint = hashing.fingerprint_video(str(unrelated_path), unrelated_samples, unrelated_metadata)

    edited_result = similarity.compare(original_fingerprint, edited_fingerprint, original_samples, edited_samples)
    unrelated_result = similarity.compare(original_fingerprint, unrelated_fingerprint, original_samples, unrelated_samples)

    assert edited_result.score > 0.65
    assert edited_result.classification in {"pirated", "suspicious"}
    assert unrelated_result.score < 0.45
    assert unrelated_result.classification == "safe"

