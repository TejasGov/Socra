"""Schemas for ACP (Agent Client Protocol) bring-your-own-subscription ingestion.

See docs/acp-integration.md. These mirror the ``acp_sessions`` /
``acp_messages`` tables created in database/migrations/0002_acp_sessions.sql.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

AcpProvider = Literal["claude", "codex"]
AcpMessageRole = Literal["user", "assistant", "system"]


class AcpSessionCreate(BaseModel):
    provider: AcpProvider
    course_id: UUID | None = None
    data_collection_consent: bool = False


class AcpSessionOut(BaseModel):
    id: UUID
    user_id: UUID
    provider: AcpProvider
    course_id: UUID | None = None
    data_collection_consent: bool
    created_at: datetime


class AcpMessageCreate(BaseModel):
    role: AcpMessageRole
    content: str
    created_at: datetime | None = None


class AcpMessageOut(BaseModel):
    id: UUID
    session_id: UUID
    role: AcpMessageRole
    content: str
    created_at: datetime
