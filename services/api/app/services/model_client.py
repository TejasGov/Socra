"""Client for the self-hosted vLLM model server.

Only the backend may call the model server. Credentials come from settings
and must never be exposed to the frontend.
"""

from __future__ import annotations

import httpx

from app.core.config import get_settings


def _auth_headers() -> dict[str, str]:
    settings = get_settings()
    if settings.MODEL_SERVER_API_KEY:
        return {"Authorization": f"Bearer {settings.MODEL_SERVER_API_KEY}"}
    return {}


async def health() -> bool:
    """Return True if the model server is reachable."""
    settings = get_settings()
    url = f"{settings.MODEL_SERVER_URL.rstrip('/')}/health"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=_auth_headers())
            return resp.status_code == 200
    except httpx.HTTPError:
        return False
