"""Repository for ACP (bring-your-own-subscription) sessions and messages.

The data layer (SQLAlchemy engine / Supabase client) is not wired up yet —
see ``app/database/session.py``. Until it lands this repository keeps state
in an in-process store, matching the rest of the scaffold: import-light,
boots without a database in dev. Swap the storage in ``AcpRepository`` for a
real Supabase-backed implementation once the data layer exists; the public
methods are written so that swap does not ripple into the routes.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.schemas.acp import AcpMessageCreate, AcpMessageOut, AcpSessionCreate, AcpSessionOut


class AcpRepository:
    """In-memory store for ACP sessions/messages."""

    def __init__(self) -> None:
        self._sessions: dict[UUID, AcpSessionOut] = {}
        self._messages: dict[UUID, list[AcpMessageOut]] = {}

    def create_session(self, user_id: UUID, payload: AcpSessionCreate) -> AcpSessionOut:
        session = AcpSessionOut(
            id=uuid4(),
            user_id=user_id,
            provider=payload.provider,
            course_id=payload.course_id,
            data_collection_consent=payload.data_collection_consent,
            created_at=datetime.now(UTC),
        )
        self._sessions[session.id] = session
        self._messages[session.id] = []
        return session

    def get_session(self, session_id: UUID) -> AcpSessionOut | None:
        return self._sessions.get(session_id)

    def list_sessions_for_user(self, user_id: UUID) -> list[AcpSessionOut]:
        return [s for s in self._sessions.values() if s.user_id == user_id]

    def add_message(self, session_id: UUID, payload: AcpMessageCreate) -> AcpMessageOut:
        message = AcpMessageOut(
            id=uuid4(),
            session_id=session_id,
            role=payload.role,
            content=payload.content,
            created_at=payload.created_at or datetime.now(UTC),
        )
        self._messages.setdefault(session_id, []).append(message)
        return message

    def list_messages(self, session_id: UUID) -> list[AcpMessageOut]:
        return list(self._messages.get(session_id, []))


_repository = AcpRepository()


def get_acp_repository() -> AcpRepository:
    """Return the process-wide ACP repository instance.

    A FastAPI dependency so routes/tests can override it (e.g. with a fresh
    instance per test) without needing a real database connection.
    """
    return _repository
