from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.db.init_db import init_db
from backend.routes.analytics import router as analytics_router
from backend.routes.detections import router as detections_router
from backend.routes.extensions import router as extensions_router
from backend.routes.uploads import router as uploads_router
from backend.routes.verification import router as verification_router
from backend.routes.videos import router as videos_router


def create_application() -> FastAPI:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.processed_dir.mkdir(parents=True, exist_ok=True)
    init_db()

    app = FastAPI(
        title=settings.app_name,
        description="Sports media piracy detection platform powered by perceptual hashing and similarity analytics.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    uploads_root = settings.upload_dir
    if Path(uploads_root).exists():
        app.mount("/media", StaticFiles(directory=uploads_root), name="media")

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    app.include_router(uploads_router, prefix=settings.api_prefix)
    app.include_router(detections_router, prefix=settings.api_prefix)
    app.include_router(verification_router, prefix=settings.api_prefix)
    app.include_router(analytics_router, prefix=settings.api_prefix)
    app.include_router(extensions_router, prefix=settings.api_prefix)
    app.include_router(videos_router, prefix=settings.api_prefix)
    return app


app = create_application()
