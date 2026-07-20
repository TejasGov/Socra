"""Tests for ACP session/message ingestion endpoints."""

from __future__ import annotations

import base64
import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.acp import AcpRepository, get_acp_repository


def _b64url(data: dict) -> str:
    raw = json.dumps(data).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _fake_jwt(sub: str) -> str:
    header = _b64url({"alg": "none", "typ": "JWT"})
    payload = _b64url({"sub": sub})
    return f"{header}.{payload}.signature"


def _auth_headers(user_id: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {_fake_jwt(user_id)}"}


USER_A = "00000000-0000-0000-0000-0000000000a1"
USER_B = "00000000-0000-0000-0000-0000000000b2"


@pytest.fixture
def client():
    repo = AcpRepository()
    app.dependency_overrides[get_acp_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_acp_repository, None)


def test_create_session(client: TestClient):
    resp = client.post(
        "/api/v1/acp/sessions",
        json={"provider": "claude", "data_collection_consent": True},
        headers=_auth_headers(USER_A),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["provider"] == "claude"
    assert body["data_collection_consent"] is True
    assert body["user_id"] == USER_A


def test_list_sessions_returns_only_own(client: TestClient):
    client.post(
        "/api/v1/acp/sessions",
        json={"provider": "claude", "data_collection_consent": True},
        headers=_auth_headers(USER_A),
    )
    client.post(
        "/api/v1/acp/sessions",
        json={"provider": "codex", "data_collection_consent": True},
        headers=_auth_headers(USER_B),
    )

    resp = client.get("/api/v1/acp/sessions", headers=_auth_headers(USER_A))
    assert resp.status_code == 200
    sessions = resp.json()
    assert len(sessions) == 1
    assert sessions[0]["user_id"] == USER_A


def test_add_message_to_own_session(client: TestClient):
    create_resp = client.post(
        "/api/v1/acp/sessions",
        json={"provider": "claude", "data_collection_consent": True},
        headers=_auth_headers(USER_A),
    )
    session_id = create_resp.json()["id"]

    resp = client.post(
        f"/api/v1/acp/sessions/{session_id}/messages",
        json={"role": "user", "content": "Hello"},
        headers=_auth_headers(USER_A),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["role"] == "user"
    assert body["content"] == "Hello"
    assert body["session_id"] == session_id


def test_add_message_without_consent_is_rejected(client: TestClient):
    create_resp = client.post(
        "/api/v1/acp/sessions",
        json={"provider": "claude", "data_collection_consent": False},
        headers=_auth_headers(USER_A),
    )
    session_id = create_resp.json()["id"]

    resp = client.post(
        f"/api/v1/acp/sessions/{session_id}/messages",
        json={"role": "user", "content": "Hello"},
        headers=_auth_headers(USER_A),
    )
    assert resp.status_code == 422


def test_add_message_to_other_users_session_is_forbidden(client: TestClient):
    create_resp = client.post(
        "/api/v1/acp/sessions",
        json={"provider": "claude", "data_collection_consent": True},
        headers=_auth_headers(USER_A),
    )
    session_id = create_resp.json()["id"]

    resp = client.post(
        f"/api/v1/acp/sessions/{session_id}/messages",
        json={"role": "user", "content": "Hello"},
        headers=_auth_headers(USER_B),
    )
    assert resp.status_code == 403


def test_add_message_to_missing_session_is_not_found(client: TestClient):
    missing_id = "00000000-0000-0000-0000-000000000000"
    resp = client.post(
        f"/api/v1/acp/sessions/{missing_id}/messages",
        json={"role": "user", "content": "Hello"},
        headers=_auth_headers(USER_A),
    )
    assert resp.status_code == 404


def test_missing_auth_header_is_unauthorized(client: TestClient):
    resp = client.post(
        "/api/v1/acp/sessions",
        json={"provider": "claude", "data_collection_consent": True},
    )
    assert resp.status_code == 401
