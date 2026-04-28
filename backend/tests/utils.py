from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


def create_sports_clip(
    output_path: Path,
    variant: str = "original",
    frame_count: int = 60,
    width: int = 320,
    height: int = 180,
    fps: int = 12,
) -> Path:
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    for frame_index in range(frame_count):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:, :] = (12, 46, 92)
        x = 20 + (frame_index * 3) % (width - 70)
        y = 70 + int(15 * np.sin(frame_index / 5))

        cv2.rectangle(frame, (x, y), (x + 46, y + 26), (0, 220, 120), -1)
        cv2.circle(frame, (x + 60, y + 10), 10, (255, 255, 255), -1)
        cv2.putText(frame, "LEAGUE-TV", (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, f"Q4 {frame_index:02d}", (width - 110, height - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (60, 210, 255), 2)

        if variant == "edited":
            cropped = frame[6 : height - 6, 12 : width - 12]
            resized = cv2.resize(cropped, (width, height))
            hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.82, 0, 255).astype(np.uint8)
            frame = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        elif variant == "unrelated":
            frame[:, :] = (70, 16, 32)
            cv2.line(frame, (20, 20 + frame_index), (width - 20, height - 20), (30, 120, 255), 4)
            cv2.putText(frame, "OTHER FEED", (50, 90), cv2.FONT_HERSHEY_DUPLEX, 1.0, (255, 255, 255), 2)

        writer.write(frame)

    writer.release()
    return output_path

