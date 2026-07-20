"""ACP (Agent Client Protocol) bring-your-own-subscription transcript ingestion.

Students run their own Claude Code / Codex agent locally via
``packages/acp-bridge`` and this backend mirrors the resulting transcript
here, gated on per-session consent. See docs/acp-integration.md.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user_id
from app.repositories.acp import AcpRepository, get_acp_repository
from app.schemas.acp import (
    AcpMessageCreate,
    AcpMessageOut,
    AcpSessionCreate,
    AcpSessionOut,
)

router = APIRouter()


@router.post("/sessions", response_model=AcpSessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: AcpSessionCreate,
    user_id: str = Depends(get_current_user_id),
    repo: AcpRepository = Depends(get_acp_repository),
) -> AcpSessionOut:
    """Create a new ACP session for the authenticated student."""
    return repo.create_session(user_id=UUID(user_id), payload=payload)


@router.get("/sessions", response_model=list[AcpSessionOut])
def list_sessions(
    user_id: str = Depends(get_current_user_id),
    repo: AcpRepository = Depends(get_acp_repository),
) -> list[AcpSessionOut]:
    """List the authenticated student's own ACP sessions."""
    return repo.list_sessions_for_user(user_id=UUID(user_id))


@router.post(
    "/sessions/{session_id}/messages",
    response_model=AcpMessageOut,
    status_code=status.HTTP_201_CREATED,
)
def add_message(
    session_id: UUID,
    payload: AcpMessageCreate,
    user_id: str = Depends(get_current_user_id),
    repo: AcpRepository = Depends(get_acp_repository),
) -> AcpMessageOut:
    """Append a transcript message to an ACP session owned by the caller."""
    session = repo.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if str(session.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session belongs to another user",
        )
    if not session.data_collection_consent:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Session does not have data collection consent",
        )
    return repo.add_message(session_id=session_id, payload=payload)
