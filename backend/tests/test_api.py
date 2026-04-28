from __future__ import annotations

from pathlib import Path

from backend.routes.uploads import service as upload_service
from backend.schemas.common import NoticeDeliveryStatus
from backend.tests.utils import create_sports_clip


def _multipart_file(path: Path) -> tuple[str, bytes, str]:
    return path.name, path.read_bytes(), "video/mp4"


def test_upload_and_detect_flow(client, tmp_path):
    original_video = create_sports_clip(tmp_path / "original.mp4", "original")
    suspect_video = create_sports_clip(tmp_path / "suspect.mp4", "edited")

    original_response = client.post(
        "/api/upload-original",
        data={
            "title": "Premier Matchday Feed",
            "owner": "SportsTrace League",
            "owner_contact": "rights@sportstrace.ai",
            "league": "Premier League",
        },
        files={"file": _multipart_file(original_video)},
    )

    assert original_response.status_code == 200
    original_payload = original_response.json()
    assert original_payload["video"]["source_type"] == "original"

    originals_response = client.get("/api/videos?source_type=original")
    assert originals_response.status_code == 200
    originals_payload = originals_response.json()
    assert len(originals_payload) == 1
    assert originals_payload[0]["id"] == original_payload["video"]["id"]

    suspect_response = client.post(
        "/api/upload-suspected",
        data={
            "title": "Mirrored Social Clip",
            "owner": "Unknown Mirror",
            "original_id": original_payload["video"]["id"],
        },
        files={"file": _multipart_file(suspect_video)},
    )

    assert suspect_response.status_code == 200
    suspect_payload = suspect_response.json()
    assert suspect_payload["best_match"] is not None

    detection_id = suspect_payload["best_match"]["detection_id"]
    detection_response = client.get(f"/api/detect/{detection_id}")
    assert detection_response.status_code == 200
    detection_payload = detection_response.json()
    assert detection_payload["score"] >= 0.4
    assert "Ownership proof chain hash" in detection_payload["dmca_notice"]


def test_invalid_suspect_upload_returns_400(client, tmp_path):
    original_video = create_sports_clip(tmp_path / "original.mp4", "original")

    original_response = client.post(
        "/api/upload-original",
        data={
            "title": "Premier Matchday Feed",
            "owner": "SportsTrace League",
        },
        files={"file": _multipart_file(original_video)},
    )
    assert original_response.status_code == 200

    invalid_video = tmp_path / "invalid.mp4"
    invalid_video.write_bytes(b"this is not a real video file")

    suspect_response = client.post(
        "/api/upload-suspected",
        data={
            "title": "Broken Upload",
            "owner": "Unknown Mirror",
        },
        files={"file": _multipart_file(invalid_video)},
    )

    assert suspect_response.status_code == 400
    assert "not a valid playable video" in suspect_response.json()["detail"]


def test_suspect_url_can_trigger_automatic_notice(client, tmp_path, monkeypatch):
    original_video = create_sports_clip(tmp_path / "original.mp4", "original")
    suspect_video = create_sports_clip(tmp_path / "suspect-from-url.mp4", "edited")

    original_response = client.post(
        "/api/upload-original",
        data={
            "title": "Premier Matchday Feed",
            "owner": "SportsTrace League",
            "owner_contact": "rights@sportstrace.ai",
        },
        files={"file": _multipart_file(original_video)},
    )
    assert original_response.status_code == 200

    requested_urls: list[str] = []

    def fake_fetch(source_url: str, bucket: str = "suspects") -> Path:
        requested_urls.append(source_url)
        return suspect_video

    def fake_send_notice(
        recipient_email: str | None,
        dmca_notice: str,
        suspect_source_url: str | None = None,
    ) -> NoticeDeliveryStatus:
        assert recipient_email == "piracy@mirror.example"
        assert suspect_source_url == "https://youtu.be/example-video"
        assert "Ownership proof chain hash" in dmca_notice
        return NoticeDeliveryStatus(
            requested=True,
            status="sent",
            message="Automatic copyright notice sent to piracy@mirror.example.",
            recipient_email=recipient_email,
        )

    monkeypatch.setattr(upload_service.remote_video, "fetch", fake_fetch)
    monkeypatch.setattr(upload_service.notice_email, "send_notice", fake_send_notice)

    suspect_response = client.post(
        "/api/upload-suspected",
        data={
            "title": "Mirrored Social Clip",
            "owner": "Unknown Mirror",
            "suspect_url": "https://youtu.be/example-video",
            "notice_recipient_email": "piracy@mirror.example",
            "send_notice_on_match": "true",
        },
    )

    assert suspect_response.status_code == 200
    suspect_payload = suspect_response.json()
    assert suspect_payload["best_match"] is not None
    assert suspect_payload["source_url"] == "https://youtu.be/example-video"
    assert suspect_payload["notice_delivery"]["status"] == "sent"
    assert requested_urls == ["https://youtu.be/example-video"]
