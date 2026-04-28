from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.config import settings
from backend.services.hashing import HashingService
from backend.services.similarity import SimilarityService
from backend.services.video_processing import VideoProcessingService
from backend.tests.utils import create_sports_clip


def main() -> None:
    scratch = Path("backend/storage/processed/demo")
    scratch.mkdir(parents=True, exist_ok=True)

    original_path = create_sports_clip(scratch / "original.mp4", "original")
    edited_path = create_sports_clip(scratch / "edited.mp4", "edited")
    unrelated_path = create_sports_clip(scratch / "unrelated.mp4", "unrelated")

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

    metrics = {
        "edited_score": edited_result.score,
        "edited_classification": edited_result.classification,
        "unrelated_score": unrelated_result.score,
        "unrelated_classification": unrelated_result.classification,
        "binary_accuracy": round(
            float((edited_result.classification != "safe") + (unrelated_result.classification == "safe")) / 2.0,
            2,
        ),
    }

    print("SportsTrace AI accuracy demo")
    for key, value in metrics.items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    main()
