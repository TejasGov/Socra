"""Tests for health/status endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "socra-api"


def test_status_reports_model_version():
    resp = client.get("/api/v1/status")
    assert resp.status_code == 200
    body = resp.json()
    assert "model_version" in body
    assert "env" in body
