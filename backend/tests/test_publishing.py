import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


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


async def _get_auth_header(client: AsyncClient) -> dict:
    """Sign up a user and return the Authorization header."""
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": "publishing@example.com", "password": "securepassword123"},
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


async def _setup_with_approved_posts(
    client: AsyncClient,
) -> tuple[dict, list[dict]]:
    """Set up user with plan and approve some posts."""
    headers, plan_data = await _setup_with_plan(client)

    approved_posts = []
    for post in plan_data["posts"][:3]:
        response = await client.post(
            f"/api/v1/content/posts/{post['id']}/approve",
            headers=headers,
        )
        approved_posts.append(response.json())

    return headers, approved_posts


# -- Queue Tests --


@pytest.mark.asyncio
async def test_get_queue_success(client: AsyncClient):
    headers, approved_posts = await _setup_with_approved_posts(client)

    response = await client.get(
        "/api/v1/publishing/queue",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    for item in data["items"]:
        assert item["status"] in ("approved", "scheduled", "copied")
        assert item["hook"] is not None
        assert item["body"] is not None
        assert item["cta"] is not None


@pytest.mark.asyncio
async def test_get_queue_empty(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)

    response = await client.get(
        "/api/v1/publishing/queue",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_queue_ordered(client: AsyncClient):
    headers, approved_posts = await _setup_with_approved_posts(client)

    # Reschedule first post to a later date so ordering changes
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    await client.put(
        f"/api/v1/publishing/queue/{approved_posts[0]['id']}/reschedule",
        json={"scheduled_at": future_date},
        headers=headers,
    )

    response = await client.get(
        "/api/v1/publishing/queue",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    items = data["items"]

    # The rescheduled post should now be last (latest scheduled_at)
    assert items[-1]["id"] == approved_posts[0]["id"]

    # Verify all scheduled_at values are in ascending order
    scheduled_dates = [
        item["scheduled_at"] for item in items if item["scheduled_at"] is not None
    ]
    assert scheduled_dates == sorted(scheduled_dates)


# -- Reschedule Tests --


@pytest.mark.asyncio
async def test_reschedule_success(client: AsyncClient):
    headers, approved_posts = await _setup_with_approved_posts(client)

    new_date = datetime.now(timezone.utc) + timedelta(days=14)
    response = await client.put(
        f"/api/v1/publishing/queue/{approved_posts[0]['id']}/reschedule",
        json={"scheduled_at": new_date.isoformat()},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "scheduled"
    assert data["scheduled_at"] is not None


@pytest.mark.asyncio
async def test_reschedule_not_found(client: AsyncClient):
    headers, _ = await _setup_with_approved_posts(client)

    response = await client.put(
        "/api/v1/publishing/queue/00000000-0000-0000-0000-000000000000/reschedule",
        json={"scheduled_at": datetime.now(timezone.utc).isoformat()},
        headers=headers,
    )

    assert response.status_code == 404


# -- Mark Copied Tests --


@pytest.mark.asyncio
async def test_mark_copied_success(client: AsyncClient):
    headers, approved_posts = await _setup_with_approved_posts(client)

    response = await client.put(
        f"/api/v1/publishing/queue/{approved_posts[0]['id']}/copied",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "copied"
    assert data["copied_at"] is not None

    # Verify it still appears in the queue
    queue_response = await client.get(
        "/api/v1/publishing/queue",
        headers=headers,
    )
    queue_data = queue_response.json()
    queue_ids = [item["id"] for item in queue_data["items"]]
    assert data["id"] in queue_ids


# -- Full Flow Test --


@pytest.mark.asyncio
async def test_full_flow(client: AsyncClient):
    headers, plan_data = await _setup_with_plan(client)
    post = plan_data["posts"][0]

    # Step 1: Approve the post
    approve_response = await client.post(
        f"/api/v1/content/posts/{post['id']}/approve",
        headers=headers,
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()
    assert approved["status"] == "approved"
    assert approved["scheduled_at"] is not None

    # Step 2: Verify it appears in the queue
    queue_response = await client.get(
        "/api/v1/publishing/queue",
        headers=headers,
    )
    assert queue_response.status_code == 200
    queue_data = queue_response.json()
    assert queue_data["total"] == 1
    assert queue_data["items"][0]["id"] == post["id"]

    # Step 3: Reschedule
    new_date = datetime.now(timezone.utc) + timedelta(days=7)
    reschedule_response = await client.put(
        f"/api/v1/publishing/queue/{post['id']}/reschedule",
        json={"scheduled_at": new_date.isoformat()},
        headers=headers,
    )
    assert reschedule_response.status_code == 200
    rescheduled = reschedule_response.json()
    assert rescheduled["status"] == "scheduled"

    # Step 4: Mark as copied
    copied_response = await client.put(
        f"/api/v1/publishing/queue/{post['id']}/copied",
        headers=headers,
    )
    assert copied_response.status_code == 200
    copied = copied_response.json()
    assert copied["status"] == "copied"
    assert copied["copied_at"] is not None

    # Step 5: Still in the queue
    final_queue = await client.get(
        "/api/v1/publishing/queue",
        headers=headers,
    )
    assert final_queue.status_code == 200
    assert final_queue.json()["total"] == 1


# -- Auth Tests --


@pytest.mark.asyncio
async def test_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/publishing/queue")
    assert response.status_code == 422

    response = await client.put(
        "/api/v1/publishing/queue/00000000-0000-0000-0000-000000000000/reschedule",
        json={"scheduled_at": datetime.now(timezone.utc).isoformat()},
    )
    assert response.status_code == 422

    response = await client.put(
        "/api/v1/publishing/queue/00000000-0000-0000-0000-000000000000/copied",
    )
    assert response.status_code == 422
