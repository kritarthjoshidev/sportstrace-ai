from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from backend.core.errors import InvalidVideoError


@dataclass(slots=True)
class FrameSample:
    timestamp: float
    frame: np.ndarray


@dataclass(slots=True)
class VideoMetadata:
    width: int
    height: int
    fps: float
    frame_count: int
    duration_seconds: float


class VideoProcessingService:
    def __init__(self, frame_width: int, frame_height: int, sample_interval_seconds: float) -> None:
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.sample_interval_seconds = sample_interval_seconds

    def extract_metadata(self, video_path: str | Path) -> VideoMetadata:
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise InvalidVideoError(
                "The uploaded file is not a valid playable video. "
                "It may be incomplete, corrupted, or missing MP4 metadata such as the moov atom."
            )

        fps = capture.get(cv2.CAP_PROP_FPS) or 0.0
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        capture.release()

        fps = fps if fps > 0 else 25.0
        duration_seconds = frame_count / fps if frame_count else 0.0
        return VideoMetadata(
            width=width,
            height=height,
            fps=fps,
            frame_count=frame_count,
            duration_seconds=duration_seconds,
        )

    def sample_frames(self, video_path: str | Path) -> tuple[list[FrameSample], VideoMetadata]:
        metadata = self.extract_metadata(video_path)
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise InvalidVideoError(
                "The uploaded file could not be decoded for frame sampling. "
                "Please upload a fully downloaded MP4, MOV, AVI, or MPEG video."
            )

        frames: list[FrameSample] = []
        if metadata.frame_count == 0:
            capture.release()
            return frames, metadata

        sample_step = max(1, int(round(metadata.fps * self.sample_interval_seconds)))

        for frame_index in range(0, metadata.frame_count, sample_step):
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if not ok or frame is None:
                continue

            normalized = self._normalize_frame(frame)
            frames.append(FrameSample(timestamp=frame_index / metadata.fps, frame=normalized))

        capture.release()

        if not frames:
            raise InvalidVideoError(
                "The uploaded video did not contain decodable frames. "
                "Please upload a standard playable sports video file."
            )
        return frames, metadata

    def _normalize_frame(self, frame_bgr: np.ndarray) -> np.ndarray:
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(frame_rgb, (self.frame_width, self.frame_height), interpolation=cv2.INTER_AREA)
        yuv = cv2.cvtColor(resized, cv2.COLOR_RGB2YUV)
        yuv[:, :, 0] = cv2.equalizeHist(yuv[:, :, 0])
        return cv2.cvtColor(yuv, cv2.COLOR_YUV2RGB)
