import pytest
from httpx import AsyncClient


# -- Signup Tests --


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient, signup_payload: dict):
    response = await client.post("/api/v1/auth/signup", json=signup_payload)

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient, signup_payload: dict):
    await client.post("/api/v1/auth/signup", json=signup_payload)

    response = await client.post("/api/v1/auth/signup", json=signup_payload)

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_signup_invalid_email(client: AsyncClient):
    payload = {"email": "not-an-email", "password": "securepassword123"}
    response = await client.post("/api/v1/auth/signup", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_signup_short_password(client: AsyncClient):
    payload = {"email": "test@example.com", "password": "short"}
    response = await client.post("/api/v1/auth/signup", json=payload)

    assert response.status_code == 422


# -- Login Tests --


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, signup_payload: dict, login_payload: dict):
    await client.post("/api/v1/auth/signup", json=signup_payload)

    response = await client.post("/api/v1/auth/login", json=login_payload)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, signup_payload: dict):
    await client.post("/api/v1/auth/signup", json=signup_payload)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": signup_payload["email"], "password": "wrongpassword123"},
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "securepassword123"},
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


# -- Refresh Tests --


@pytest.mark.asyncio
async def test_refresh_success(client: AsyncClient, signup_payload: dict):
    signup_response = await client.post("/api/v1/auth/signup", json=signup_payload)
    refresh_token = signup_response.json()["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid.token.here"},
    )

    assert response.status_code == 401


# -- Me Tests --


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, signup_payload: dict):
    signup_response = await client.post("/api/v1/auth/signup", json=signup_payload)
    access_token = signup_response.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == signup_payload["email"]
    assert data["is_active"] is True
    assert data["has_completed_onboarding"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 422  # Missing required header


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"},
    )

    assert response.status_code == 401
