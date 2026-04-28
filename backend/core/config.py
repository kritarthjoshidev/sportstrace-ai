from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = BASE_DIR / "backend"


class Settings(BaseSettings):
    app_name: str = "SportsTrace AI"
    environment: str = "development"
    api_prefix: str = "/api"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    database_url: str = Field(
        default=f"sqlite:///{(BACKEND_DIR / 'sportstrace.db').as_posix()}"
    )
    upload_dir: Path = BACKEND_DIR / "storage" / "uploads"
    processed_dir: Path = BACKEND_DIR / "storage" / "processed"
    sample_interval_seconds: float = 1.0
    frame_width: int = 256
    frame_height: int = 256
    piracy_threshold: float = 0.7
    suspicious_threshold: float = 0.4
    max_candidate_alerts: int = 20
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
