"""Application configuration and environment validation.

Settings are loaded from the process environment and an optional
``services/api/.env`` file. Required variables are validated at startup:
missing values raise in staging/production and warn (but allow boot) in
development, so the backend can start locally before real credentials exist.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("socra.config")

AppEnv = Literal["development", "staging", "production"]

# Variables that must be present for the backend to operate correctly.
REQUIRED_VARS: tuple[str, ...] = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "MODEL_SERVER_URL",
    "MODEL_NAME",
    "MODEL_VERSION",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_ENV: AppEnv = "development"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Database
    DATABASE_URL: str = ""

    # Model server / vLLM
    MODEL_SERVER_URL: str = "http://localhost:8001"
    MODEL_SERVER_API_KEY: str = ""
    MODEL_NAME: str = "google/gemma-4-E4B-it"
    MODEL_VERSION: str = "socra-gemma-4-E4B-v1"

    # Embeddings
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384

    # Hugging Face (training/backend only)
    HUGGINGFACE_TOKEN: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    def missing_required(self) -> list[str]:
        """Return the names of required variables that are unset/empty."""
        return [name for name in REQUIRED_VARS if not getattr(self, name, "")]

    def validate_required(self) -> None:
        """Fail fast in staging/production; warn in development."""
        missing = self.missing_required()
        if not missing:
            logger.info("All required environment variables are set.")
            return

        message = (
            "Missing required environment variables: " + ", ".join(missing)
        )
        if self.APP_ENV == "development":
            logger.warning("%s (allowed in development)", message)
        else:
            raise RuntimeError(message)


@lru_cache
def get_settings() -> Settings:
    return Settings()
