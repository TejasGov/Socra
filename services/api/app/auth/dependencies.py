"""Auth dependencies.

Placeholder for Supabase access-token verification. Real implementation will
validate the bearer token (JWT) against Supabase and load the current user.
Never log raw access tokens.
"""

from __future__ import annotations

from fastapi import Header, HTTPException, status


async def require_bearer_token(
    authorization: str | None = Header(default=None),
) -> str:
    """Extract a bearer token from the Authorization header.

    Verification against Supabase is added with the auth feature; for now this
    only enforces the header shape.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    return authorization.split(" ", 1)[1]
