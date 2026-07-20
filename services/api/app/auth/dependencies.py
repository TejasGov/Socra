"""Auth dependencies.

Placeholder for Supabase access-token verification. Real implementation will
validate the bearer token (JWT) against Supabase and load the current user.
Never log raw access tokens.
"""

from __future__ import annotations

import base64
import binascii
import json

from fastapi import Depends, Header, HTTPException, status


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


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


async def get_current_user_id(token: str = Depends(require_bearer_token)) -> str:
    """Return the Supabase user id (``sub`` claim) carried by the JWT.

    This reads the token payload without verifying the signature — real
    signature/issuer verification against Supabase lands with the auth
    feature. Until then this only enforces that the token is a well-formed
    JWT carrying a ``sub`` claim, mirroring the placeholder nature of
    ``require_bearer_token`` above. Never log raw access tokens.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed access token",
        )
    try:
        payload = json.loads(_b64url_decode(parts[1]))
    except (ValueError, binascii.Error, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed access token",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token missing subject claim",
        )
    return str(user_id)
