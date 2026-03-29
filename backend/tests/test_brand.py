import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


async def _get_auth_header(client: AsyncClient) -> dict:
    """Sign up a user and return the Authorization header."""
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": "brand@example.com", "password": "securepassword123"},
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
                {"text": "Excited about AI trends in 2026", "likes": 42, "comments": 5},
                {"text": "System design tip: start with requirements", "likes": 30, "comments": 3},
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


MOCK_CLAUDE_RESPONSE = {
    "archetype_name": "The Sage",
    "archetype_description": "The Sage archetype represents wisdom and knowledge sharing.",
    "positioning_statement": "Helping engineers build better systems through practical insights.",
    "pillars": [
        {
            "name": "Technical Excellence",
            "icon": "architecture",
            "description": "Deep dives into system design and engineering best practices.",
        },
        {
            "name": "AI Innovation",
            "icon": "psychology",
            "description": "Exploring the intersection of AI and software engineering.",
        },
        {
            "name": "Career Growth",
            "icon": "trending_up",
            "description": "Actionable advice for professional development in tech.",
        },
    ],
    "tone_tags": ["Insightful", "Clear", "Practical", "Strategic", "Approachable"],
    "tone_weights": {
        "Authoritative": 30,
        "Conversational": 20,
        "Inspirational": 15,
        "Educational": 25,
        "Analytical": 10,
    },
}


def _build_mock_anthropic_client() -> AsyncMock:
    """Build a mock Anthropic AsyncAnthropic client."""
    mock_response = MagicMock()
    mock_content_block = MagicMock()
    mock_content_block.text = json.dumps(MOCK_CLAUDE_RESPONSE)
    mock_response.content = [mock_content_block]

    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=mock_response)
    return mock_client


# -- Analyze Tests --


@pytest.mark.asyncio
async def test_analyze_brand_success(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)

    mock_client = _build_mock_anthropic_client()

    with patch(
        "app.services.brand_service.anthropic.AsyncAnthropic",
        return_value=mock_client,
    ):
        response = await client.post(
            "/api/v1/brand/analyze",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["archetype_name"] == "The Sage"
    assert data["archetype_description"] is not None
    assert data["positioning_statement"] is not None
    assert len(data["pillars"]) == 3
    assert len(data["tone_tags"]) == 5
    assert isinstance(data["tone_weights"], dict)
    assert data["user_id"] is not None
    assert data["id"] is not None
    assert data["created_at"] is not None
    assert data["updated_at"] is not None


@pytest.mark.asyncio
async def test_analyze_brand_without_onboarding(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.post(
        "/api/v1/brand/analyze",
        headers=headers,
    )

    assert response.status_code == 422
    data = response.json()
    assert "onboarding" in data["detail"].lower()


@pytest.mark.asyncio
async def test_analyze_brand_unauthenticated(client: AsyncClient):
    response = await client.post("/api/v1/brand/analyze")
    assert response.status_code == 422


# -- Get Analysis Tests --


@pytest.mark.asyncio
async def test_get_analysis_not_found(client: AsyncClient):
    headers = await _get_auth_header(client)

    response = await client.get(
        "/api/v1/brand/analysis",
        headers=headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_analysis_exists(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)

    mock_client = _build_mock_anthropic_client()

    with patch(
        "app.services.brand_service.anthropic.AsyncAnthropic",
        return_value=mock_client,
    ):
        await client.post("/api/v1/brand/analyze", headers=headers)

    response = await client.get(
        "/api/v1/brand/analysis",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["archetype_name"] == "The Sage"


# -- Structure Tests --


@pytest.mark.asyncio
async def test_tone_weights_structure(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)

    mock_client = _build_mock_anthropic_client()

    with patch(
        "app.services.brand_service.anthropic.AsyncAnthropic",
        return_value=mock_client,
    ):
        response = await client.post(
            "/api/v1/brand/analyze",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    tone_weights = data["tone_weights"]

    assert isinstance(tone_weights, dict)
    assert len(tone_weights) > 0

    total = sum(tone_weights.values())
    assert 95 <= total <= 105, f"Tone weights sum to {total}, expected ~100"

    for key, value in tone_weights.items():
        assert isinstance(key, str)
        assert isinstance(value, int)


@pytest.mark.asyncio
async def test_pillars_structure(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)

    mock_client = _build_mock_anthropic_client()

    with patch(
        "app.services.brand_service.anthropic.AsyncAnthropic",
        return_value=mock_client,
    ):
        response = await client.post(
            "/api/v1/brand/analyze",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    pillars = data["pillars"]

    assert len(pillars) == 3

    for pillar in pillars:
        assert "name" in pillar
        assert "icon" in pillar
        assert "description" in pillar
        assert isinstance(pillar["name"], str)
        assert isinstance(pillar["icon"], str)
        assert isinstance(pillar["description"], str)
        assert len(pillar["name"]) > 0
        assert len(pillar["icon"]) > 0
        assert len(pillar["description"]) > 0


# -- Mock Fallback Test --


@pytest.mark.asyncio
async def test_analyze_brand_mock_fallback_when_no_api_key(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)

    with patch("app.routers.brand.settings") as mock_settings:
        mock_settings.ANTHROPIC_API_KEY = ""
        response = await client.post(
            "/api/v1/brand/analyze",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["archetype_name"] == "The Sage"
    assert len(data["pillars"]) == 3
    assert len(data["tone_tags"]) == 5


# -- Code Fence Stripping Test --


@pytest.mark.asyncio
async def test_analyze_brand_strips_code_fences(client: AsyncClient):
    headers = await _get_auth_header(client)
    await _complete_onboarding(client, headers)

    mock_response = MagicMock()
    mock_content_block = MagicMock()
    mock_content_block.text = f"```json\n{json.dumps(MOCK_CLAUDE_RESPONSE)}\n```"
    mock_response.content = [mock_content_block]

    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=mock_response)

    with patch(
        "app.services.brand_service.anthropic.AsyncAnthropic",
        return_value=mock_client,
    ):
        response = await client.post(
            "/api/v1/brand/analyze",
            headers=headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["archetype_name"] == "The Sage"
