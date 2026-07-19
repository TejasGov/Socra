"""Aggregate router for API v1."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings

api_router = APIRouter()


@api_router.get("/status", tags=["meta"])
def status() -> dict[str, str]:
    """Report non-sensitive service configuration."""
    settings = get_settings()
    return {
        "env": settings.APP_ENV,
        "model_name": settings.MODEL_NAME,
        "model_version": settings.MODEL_VERSION,
    }


# Feature routers are added here as they are implemented, e.g.:
#   from app.api.v1 import tutor
#   api_router.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
