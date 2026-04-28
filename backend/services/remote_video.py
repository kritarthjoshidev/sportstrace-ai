from __future__ import annotations

import mimetypes
import shutil
import subprocess
import uuid
from pathlib import Path
from urllib.parse import urlparse

import httpx

from backend.core.config import settings
from backend.core.errors import InvalidVideoError


class RemoteVideoService:
    def fetch(self, source_url: str, bucket: str = "suspects") -> Path:
        normalized_url = (source_url or "").strip()
        if not normalized_url:
            raise InvalidVideoError("Provide a public video link or upload a video file.")

        parsed = urlparse(normalized_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise InvalidVideoError("Please enter a valid public HTTP or HTTPS video link.")

        if self._requires_extractor(parsed.netloc):
            return self._download_with_extractor(normalized_url, bucket)
        return self._download_direct(normalized_url, bucket)

    def _download_direct(self, source_url: str, bucket: str) -> Path:
        target_dir = settings.upload_dir / bucket
        target_dir.mkdir(parents=True, exist_ok=True)

        with httpx.stream(
            "GET",
            source_url,
            follow_redirects=True,
            timeout=60.0,
            headers={"User-Agent": "SportsTraceAI/1.0"},
        ) as response:
            try:
                response.raise_for_status()
            except httpx.HTTPError as exc:
                raise InvalidVideoError("Unable to access the provided video link. Make sure the URL is public.") from exc

            content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
            if content_type.startswith("text/"):
                raise InvalidVideoError(
                    "This link points to a webpage, not a downloadable video file. "
                    "For YouTube or Google Drive links, install yt-dlp on the backend or upload the video file directly."
                )

            suffix = self._guess_suffix(source_url, content_type)
            target_path = target_dir / f"{uuid.uuid4()}{suffix}"

            with target_path.open("wb") as output:
                for chunk in response.iter_bytes():
                    if chunk:
                        output.write(chunk)

        if target_path.stat().st_size == 0:
            target_path.unlink(missing_ok=True)
            raise InvalidVideoError("The linked video downloaded as an empty file. Please verify the public URL.")
        return target_path

    def _download_with_extractor(self, source_url: str, bucket: str) -> Path:
        extractor = shutil.which("yt-dlp")
        if not extractor:
            raise InvalidVideoError(
                "YouTube and Google Drive links require yt-dlp on the backend. "
                "Install yt-dlp or upload the video file directly."
            )

        target_dir = settings.upload_dir / bucket
        target_dir.mkdir(parents=True, exist_ok=True)
        stem = str(uuid.uuid4())
        output_template = target_dir / f"{stem}.%(ext)s"

        try:
            result = subprocess.run(
                [
                    extractor,
                    "--no-playlist",
                    "--restrict-filenames",
                    "--no-progress",
                    "--no-warnings",
                    "-o",
                    str(output_template),
                    source_url,
                ],
                capture_output=True,
                text=True,
                timeout=300,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            self._cleanup_downloads(target_dir, stem)
            raise InvalidVideoError("Timed out while downloading the provided video link.") from exc

        if result.returncode != 0:
            self._cleanup_downloads(target_dir, stem)
            detail = (result.stderr or result.stdout).strip()
            raise InvalidVideoError(
                "Unable to download the provided video link. "
                f"{detail or 'Make sure the link is public and downloadable.'}"
            )

        matches = sorted(target_dir.glob(f"{stem}.*"), key=lambda path: path.stat().st_mtime, reverse=True)
        if not matches:
            raise InvalidVideoError("The video link did not produce a downloadable file.")
        return matches[0]

    def _requires_extractor(self, host: str) -> bool:
        normalized = host.lower()
        return any(
            domain in normalized
            for domain in (
                "youtube.com",
                "youtu.be",
                "drive.google.com",
            )
        )

    def _guess_suffix(self, source_url: str, content_type: str) -> str:
        suffix = Path(urlparse(source_url).path).suffix
        if suffix:
            return suffix
        guessed = mimetypes.guess_extension(content_type) if content_type else None
        return guessed or ".mp4"

    def _cleanup_downloads(self, target_dir: Path, stem: str) -> None:
        for match in target_dir.glob(f"{stem}.*"):
            match.unlink(missing_ok=True)
