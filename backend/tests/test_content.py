import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


async def _get_auth_header(client: AsyncClient) -> dict:
    """Sign up a user and return the Authorization header."""
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": "content@example.com", "password": "securepassword123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def _complete_onboarding(client: AsyncClient, headers: dict) -> None:
    """Complete all onboarding steps for a user."""
    await client.post(
        "/api/v1/onboarding/goals",
        json={"goals": ["Build authority", "Generate leads"]},
        headers=headers,
    )
    await client.post(
        "/api/v1/onboarding/linkedin/manual",
        json={
            "headline": "Senior Software Engineer",
            "summary": "Building scalable systems",
            "posts": [
                {"text": "Excited about AI trends", "likes": 42, "comments": 5},
            ],
        },
        headers=headers,
    )
    await client.post(
        "/api/v1/onboarding/questionnaire",
        json={
            "industry": "Technology",
            "primary_role": "Software Engineer",
            "target_audience": "Tech professionals",
            "topics": ["AI", "System Design"],
            "brand_voice": "Professional and insightful",
        },
        headers=headers,
    )


async def _create_brand_analysis(client: AsyncClient, headers: dict) -> None:
    """Generate a brand analysis (mock fallback, no API key)."""
    with patch("app.routers.brand.settings") as mock_settings:
        mock_settings.ANTHROPIC_API_KEY = ""
        await client.post("/api/v1/brand/analyze", headers=headers)


MOCK_CONTENT_PLAN_RESPONSE = {
    "posts": [
        {
            "hook": f"Hook for post {i + 1}.",
            "body": f"Body for post {i + 1} with detailed insights.",
            "cta": f"CTA for post {i + 1}.",
            "pillar": ["Technical Leadership", "Industry Trends", "Career Growth"][
                i % 3
            ],
            "platform": ["LinkedIn", "Twitter", "Instagram"][i % 3],
            "format": [
                "LinkedIn Post",
                "Twitter Thread",
                "Instagram Carousel",
                "LinkedIn Article",
            ][i % 4],
            "week_number": (i // 3) + 1,
        }
        for i in range(12)
    ]
}


MOCK_REGENERATED_POST = {
    "hook": "A completely fresh hook with new angle.",
    "body": "A completely fresh body with new perspective and insights.",
    "cta": "A completely fresh CTA to drive engagement.",
}


def _build_mock_anthropic_client(response_data: dict) -> AsyncMock:
    """Build a mock Anthropic AsyncAnthropic client."""
    mock_response = MagicMock()
    mock_content_block = MagicMock()
    mock_content_block.text = json.dumps(response_data)
    mock_response.content = [mock_content_block]

    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=mock_response)
    return mock_client


async def _setup_with_plan(client: AsyncClient) -> tuple[dict, dict]:
    """Set up a user with onboarding, brand analysis, and content plan."""
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)
    await _create_brand_analysis(client, headers)

    mock_client = _build_mock_anthropic_client(MOCK_CONTENT_PLAN_RESPONSE)

    with (
        patch(
            "app.services.content_service.anthropic.AsyncAnthropic",
            return_value=mock_client,
        ),
        patch("app.routers.content.settings") as mock_settings,
    ):
        mock_settings.ANTHROPIC_API_KEY = "test-key"
        response = await client.post(
            "/api/v1/content/generate-plan",
            headers=headers,
        )

    return headers, response.json()


# -- Generate Plan Tests --


@pytest.mark.asyncio
async def test_generate_plan_success(client: AsyncClient):
    headers, data = await _setup_with_plan(client)

    assert "posts" in data
    assert len(data["posts"]) == 12
    assert data["week_count"] == 4
    assert data["posts_per_week"] == 3
    assert data["title"] is not None
    assert data["id"] is not None
    assert data["user_id"] is not None

    # Verify distribution across weeks
    week_counts = {}
    for post in data["posts"]:
        week = post["week_number"]
        week_counts[week] = week_counts.get(week, 0) + 1
        assert post["hook"] is not None
        assert post["body"] is not None
        assert post["cta"] is not None
        assert post["pillar"] is not None
        assert post["platform"] is not None
        assert post["format"] is not None
        assert post["status"] == "draft"
        assert post["scheduled_at"] is None

    for week_num in range(1, 5):
        assert week_counts.get(week_num, 0) == 3, (
            f"Week {week_num} should have 3 posts"
        )


@pytest.mark.asyncio
async def test_generate_plan_without_brand(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/content/generate-plan",
        headers=headers,
    )

    assert response.status_code == 422
    data = response.json()
    assert "brand analysis" in data["detail"].lower()


# -- Get Plan Tests --


@pytest.mark.asyncio
async def test_get_plan_exists(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)

    response = await client.get(
        "/api/v1/content/plan",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == plan_data["id"]
    assert len(data["posts"]) == 12


@pytest.mark.asyncio
async def test_get_plan_not_found(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.get(
        "/api/v1/content/plan",
        headers=headers,
    )

    assert response.status_code == 404


# -- Post Tests --


@pytest.mark.asyncio
async def test_get_post(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)

    post_id = plan_data["posts"][0]["id"]
    response = await client.get(
        f"/api/v1/content/posts/{post_id}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == post_id
    assert data["hook"] is not None
    assert data["body"] is not None
    assert data["cta"] is not None


@pytest.mark.asyncio
async def test_update_post(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)

    post_id = plan_data["posts"][0]["id"]
    response = await client.put(
        f"/api/v1/content/posts/{post_id}",
        json={
            "hook": "Updated hook text",
            "body": "Updated body text",
            "cta": "Updated CTA text",
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["hook"] == "Updated hook text"
    assert data["body"] == "Updated body text"
    assert data["cta"] == "Updated CTA text"


@pytest.mark.asyncio
async def test_approve_post(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)

    post_id = plan_data["posts"][0]["id"]
    response = await client.post(
        f"/api/v1/content/posts/{post_id}/approve",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["scheduled_at"] is not None


@pytest.mark.asyncio
async def test_regenerate_post(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)

    post_id = plan_data["posts"][0]["id"]
    mock_client = _build_mock_anthropic_client(MOCK_REGENERATED_POST)

    with (
        patch(
            "app.services.content_service.anthropic.AsyncAnthropic",
            return_value=mock_client,
        ),
        patch("app.routers.content.settings") as mock_settings,
    ):
        mock_settings.ANTHROPIC_API_KEY = "test-key"
        response = await client.post(
            f"/api/v1/content/posts/{post_id}/regenerate",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["hook"] == MOCK_REGENERATED_POST["hook"]
    assert data["body"] == MOCK_REGENERATED_POST["body"]
    assert data["cta"] == MOCK_REGENERATED_POST["cta"]


# -- Auth Tests --


@pytest.mark.asyncio
async def test_unauthenticated_plan(client: AsyncClient):
    response = await client.get("/api/v1/content/plan")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_unauthenticated_generate(client: AsyncClient):
    response = await client.post("/api/v1/content/generate-plan")
    assert response.status_code == 422


# -- Mock Fallback Test --


@pytest.mark.asyncio
async def test_generate_plan_mock_fallback_when_no_api_key(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)
    await _create_brand_analysis(client, headers)

    with patch("app.routers.content.settings") as mock_settings:
        mock_settings.ANTHROPIC_API_KEY = ""
        response = await client.post(
            "/api/v1/content/generate-plan",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["posts"]) == 12
    assert data["week_count"] == 4
