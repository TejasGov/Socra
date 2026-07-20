"""Socra FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("socra")

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Validate configuration before serving traffic.
    settings.validate_required()
    logger.info("Socra API starting in %s mode", settings.APP_ENV)
    yield
    logger.info("Socra API shutting down")


app = FastAPI(
    title="Socra API",
    version="0.1.0",
    description="Backend for the Socra Socratic tutoring platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Liveness probe used by the frontend and orchestration."""
    return {"status": "ok", "service": "socra-api", "version": app.version}


app.include_router(api_router, prefix="/api/v1")
