import pytest
from httpx import AsyncClient

SETTINGS_URL = "/api/v1/settings"
SIGNUP_URL = "/api/v1/auth/signup"
ONBOARDING_QUESTIONNAIRE_URL = "/api/v1/onboarding/questionnaire"


async def _create_user_and_get_token(client: AsyncClient) -> str:
    response = await client.post(
        SIGNUP_URL,
        json={"email": "settings@example.com", "password": "securepassword123"},
    )
    return response.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# -- GET Settings Tests --


@pytest.mark.asyncio
async def test_get_settings_defaults(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    response = await client.get(SETTINGS_URL, headers=_auth_headers(token))

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "settings@example.com"
    assert data["full_name"] is None
    assert data["linkedin_url"] is None
    assert data["posting_frequency"] is None
    assert data["brand_voice"] is None
    assert data["email_analytics_enabled"] is False
    assert data["content_queue_alerts_enabled"] is False
    assert data["password_updated_days_ago"] is not None


@pytest.mark.asyncio
async def test_get_settings_with_profile(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    await client.post(
        ONBOARDING_QUESTIONNAIRE_URL,
        headers=_auth_headers(token),
        json={
            "industry": "Technology",
            "primary_role": "Engineer",
            "target_audience": "Developers",
            "topics": ["AI", "Python"],
            "brand_voice": "Professional and insightful",
        },
    )

    response = await client.get(SETTINGS_URL, headers=_auth_headers(token))

    assert response.status_code == 200
    data = response.json()
    assert data["brand_voice"] == "Professional and insightful"


# -- PUT Settings Tests --


@pytest.mark.asyncio
async def test_update_name(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    response = await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={"full_name": "John Doe"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "John Doe"


@pytest.mark.asyncio
async def test_update_profile_fields(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    response = await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={
            "posting_frequency": "daily",
            "brand_voice": "Casual and friendly",
            "email_analytics_enabled": True,
            "content_queue_alerts_enabled": True,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["posting_frequency"] == "daily"
    assert data["brand_voice"] == "Casual and friendly"
    assert data["email_analytics_enabled"] is True
    assert data["content_queue_alerts_enabled"] is True


@pytest.mark.asyncio
async def test_update_password_success(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    response = await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={
            "current_password": "securepassword123",
            "new_password": "newsecurepassword456",
        },
    )

    assert response.status_code == 200

    # Verify new password works by logging in
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "settings@example.com", "password": "newsecurepassword456"},
    )
    assert login_response.status_code == 200


@pytest.mark.asyncio
async def test_update_password_wrong_current(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    response = await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={
            "current_password": "wrongpassword",
            "new_password": "newsecurepassword456",
        },
    )

    assert response.status_code == 422
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_password_missing_current(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    response = await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={"new_password": "newsecurepassword456"},
    )

    assert response.status_code == 422
    assert "current password is required" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_field_preservation(client: AsyncClient):
    token = await _create_user_and_get_token(client)

    # Set multiple fields first
    await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={
            "full_name": "Jane Smith",
            "posting_frequency": "weekly",
            "brand_voice": "Bold and direct",
        },
    )

    # Update only one field
    response = await client.put(
        SETTINGS_URL,
        headers=_auth_headers(token),
        json={"full_name": "Jane Updated"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Jane Updated"
    assert data["posting_frequency"] == "weekly"
    assert data["brand_voice"] == "Bold and direct"


@pytest.mark.asyncio
async def test_unauthenticated(client: AsyncClient):
    get_response = await client.get(SETTINGS_URL)
    put_response = await client.put(
        SETTINGS_URL,
        json={"full_name": "Hacker"},
    )

    # Missing Authorization header returns 422 (missing required header)
    assert get_response.status_code == 422
    assert put_response.status_code == 422
