"""Database session management.

Placeholder for the async SQLAlchemy engine/session. Wired up once the data
layer lands; kept import-light so the app boots without a database in dev.
"""

from __future__ import annotations

from app.core.config import get_settings


def database_url() -> str:
    """Return the configured database URL (empty in a fresh dev env)."""
    return get_settings().DATABASE_URL

# Example (enable when SQLAlchemy is added to requirements):
#
# from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
#
# engine = create_async_engine(database_url(), pool_pre_ping=True)
# SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
