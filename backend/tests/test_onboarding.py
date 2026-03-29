from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


async def _get_auth_header(client: AsyncClient) -> dict:
    """Sign up a user and return the Authorization header."""
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": "onboard@example.com", "password": "securepassword123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# -- Status Tests --


@pytest.mark.asyncio
async def test_status_fresh_user(client: AsyncClient):
    headers = await _get_auth_header(client)
    response = await client.get("/api/v1/onboarding/status", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["goals_completed"] is False
    assert data["linkedin_completed"] is False
    assert data["questionnaire_completed"] is False
    assert data["is_complete"] is False


@pytest.mark.asyncio
async def test_status_after_goals_set(client: AsyncClient):
    headers = await _get_auth_header(client)

    await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["Build authority"]},
        headers=headers,
    )

    response = await client.get("/api/v1/onboarding/status", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["goals_completed"] is True
    assert data["linkedin_completed"] is False
    assert data["questionnaire_completed"] is False
    assert data["is_complete"] is False


@pytest.mark.asyncio
async def test_status_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/onboarding/status")
    assert response.status_code == 422


# -- Goals Tests --


@pytest.mark.asyncio
async def test_goals_success_single(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["Grow audience"]},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == ["Grow audience"]


@pytest.mark.asyncio
async def test_goals_success_three(client: AsyncClient):
    headers = await _get_auth_header(client)

    goals = ["Grow audience", "Generate leads", "Build authority"]
    response = await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": goals},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == goals


@pytest.mark.asyncio
async def test_goals_empty_list_rejected(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": []},
        headers=headers,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_goals_too_many_rejected(client: AsyncClient):
    headers = await _get_auth_header(client)

    goals = ["Goal 1", "Goal 2", "Goal 3", "Goal 4"]
    response = await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": goals},
        headers=headers,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_goals_update_existing(client: AsyncClient):
    headers = await _get_auth_header(client)

    await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["Old goal"]},
        headers=headers,
    )

    response = await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["New goal"]},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == ["New goal"]


# -- LinkedIn Tests --


@pytest.mark.asyncio
async def test_linkedin_scrape_with_url(client: AsyncClient):
    headers = await _get_auth_header(client)

    mock_profile = {"headline": "Test Headline", "summary": "Test Summary"}
    mock_posts = [
        {"text": "A great post", "likes": 10, "comments": 2},
    ]

    with (
        patch(
            "app.services.onboarding_service.scrape_public_profile",
            new_callable=AsyncMock,
            return_value=mock_profile,
        ),
        patch(
            "app.services.onboarding_service.scrape_posts_via_apify",
            new_callable=AsyncMock,
            return_value=mock_posts,
        ),
    ):
        response = await client.post(
            "/api/v1/onboarding/linkedin",
            json={"linkedin_url": "https://linkedin.com/in/testuser"},
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["linkedin_data"] is not None
    assert data["linkedin_data"]["headline"] == "Test Headline"
    assert data["linkedin_data"]["summary"] == "Test Summary"
    assert len(data["linkedin_data"]["posts"]) == 1


@pytest.mark.asyncio
async def test_linkedin_invalid_url(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/onboarding/linkedin",
        json={"linkedin_url": "not-a-valid-url"},
        headers=headers,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_linkedin_manual_entry(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/onboarding/linkedin/manual",
        json={
            "headline": "Manual Headline",
            "summary": "Manual Summary",
            "posts": [
                {"text": "My post", "likes": 5, "comments": 1},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["linkedin_data"]["headline"] == "Manual Headline"
    assert data["linkedin_data"]["summary"] == "Manual Summary"
    assert len(data["linkedin_data"]["posts"]) == 1


# -- Questionnaire Tests --


@pytest.mark.asyncio
async def test_questionnaire_success(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/onboarding/questionnaire",
        json={
            "industry": "Technology",
            "primary_role": "Software Engineer",
            "target_audience": "Tech professionals",
            "topics": ["AI", "Cloud"],
            "brand_voice": "Professional and insightful",
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["industry"] == "Technology"
    assert data["primary_role"] == "Software Engineer"
    assert data["target_audience"] == "Tech professionals"
    assert data["topics"] == ["AI", "Cloud"]
    assert data["brand_voice"] == "Professional and insightful"
    assert data["onboarding_completed"] is True


@pytest.mark.asyncio
async def test_questionnaire_missing_fields(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/onboarding/questionnaire",
        json={
            "industry": "Technology",
            "primary_role": "Engineer",
        },
        headers=headers,
    )

    assert response.status_code == 422


# -- Profile Tests --


@pytest.mark.asyncio
async def test_profile_empty(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.get("/api/v1/onboarding/profile", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["goals"] is None
    assert data["linkedin_data"] is None
    assert data["industry"] is None
    assert data["onboarding_completed"] is False


@pytest.mark.asyncio
async def test_profile_after_updates(client: AsyncClient):
    headers = await _get_auth_header(client)

    await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["Build authority"]},
        headers=headers,
    )

    response = await client.get("/api/v1/onboarding/profile", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == ["Build authority"]


# -- Full Flow Test --


@pytest.mark.asyncio
async def test_full_onboarding_flow(client: AsyncClient):
    headers = await _get_auth_header(client)

    # Step 1: Goals
    response = await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["Build authority", "Generate leads"]},
        headers=headers,
    )
    assert response.status_code == 200

    # Step 2: LinkedIn (manual)
    response = await client.post(
        "/api/v1/onboarding/linkedin/manual",
        json={
            "headline": "Tech Lead",
            "summary": "Building great products",
            "posts": [{"text": "My first post"}],
        },
        headers=headers,
    )
    assert response.status_code == 200

    # Step 3: Questionnaire
    response = await client.post(
        "/api/v1/onboarding/questionnaire",
        json={
            "industry": "Technology",
            "primary_role": "Tech Lead",
            "target_audience": "Engineering managers",
            "topics": ["Leadership", "Architecture"],
            "brand_voice": "Authoritative yet approachable",
        },
        headers=headers,
    )
    assert response.status_code == 200

    # Verify status shows complete
    response = await client.get("/api/v1/onboarding/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["goals_completed"] is True
    assert data["linkedin_completed"] is True
    assert data["questionnaire_completed"] is True
    assert data["is_complete"] is True

    # Verify profile has all data
    response = await client.get("/api/v1/onboarding/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == ["Build authority", "Generate leads"]
    assert data["linkedin_data"]["headline"] == "Tech Lead"
    assert data["industry"] == "Technology"
    assert data["onboarding_completed"] is True
