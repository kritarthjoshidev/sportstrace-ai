from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter
from pydantic import BaseModel, HttpUrl


router = APIRouter(tags=["extensions"])


class ExtensionHookRequest(BaseModel):
    page_url: HttpUrl
    suspected_title: str
    source_label: str
    notes: str | None = None


@router.post("/extension/hook")
def extension_hook(payload: ExtensionHookRequest) -> dict:
    return {
        "message": "Extension payload received. Upload the captured stream clip to complete similarity analysis.",
        "received_at": datetime.now(UTC).replace(tzinfo=None).isoformat(),
        "source_label": payload.source_label,
        "suspected_title": payload.suspected_title,
        "page_url": str(payload.page_url),
    }

