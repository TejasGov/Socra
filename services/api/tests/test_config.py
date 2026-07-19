"""Tests for environment validation."""

import pytest

from app.core.config import Settings


def test_missing_required_detected():
    settings = Settings(APP_ENV="development")
    missing = settings.missing_required()
    # In a bare environment the Supabase/DB values are unset.
    assert "SUPABASE_URL" in missing


def test_production_missing_required_raises():
    settings = Settings(APP_ENV="production")
    with pytest.raises(RuntimeError):
        settings.validate_required()


def test_development_missing_required_allows_boot():
    settings = Settings(APP_ENV="development")
    # Should not raise, only warn.
    settings.validate_required()
