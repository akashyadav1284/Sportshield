"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthCheck:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "SportShield AI"


class TestAuthEndpoints:
    def test_login_missing_credentials(self):
        response = client.post("/api/v1/auth/login", json={})
        assert response.status_code == 422

    def test_login_invalid_credentials(self):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@test.com", "password": "wrong"},
        )
        assert response.status_code == 401

    def test_protected_endpoint_without_token(self):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403

    def test_register_missing_fields(self):
        response = client.post("/api/v1/auth/register", json={"email": "test@test.com"})
        assert response.status_code == 422


class TestAssetEndpoints:
    def test_list_assets_requires_auth(self):
        response = client.get("/api/v1/assets/")
        assert response.status_code == 403

    def test_upload_requires_auth(self):
        response = client.post("/api/v1/assets/upload")
        assert response.status_code == 403


class TestViolationEndpoints:
    def test_list_violations_requires_auth(self):
        response = client.get("/api/v1/violations/")
        assert response.status_code == 403


class TestAnalyticsEndpoints:
    def test_stats_requires_auth(self):
        response = client.get("/api/v1/analytics/stats")
        assert response.status_code == 403
