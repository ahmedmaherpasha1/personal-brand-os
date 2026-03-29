import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import anthropic
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.repositories.brand_repository import BrandRepository
from app.repositories.content_repository import ContentRepository
from app.schemas.content import ContentPlanResponse, PostResponse, PostUpdateRequest

logger = logging.getLogger(__name__)

CONTENT_PLAN_PROMPT_PATH = (
    Path(__file__).parent.parent / "prompts" / "content_plan.txt"
)
DRAFT_GENERATION_PROMPT_PATH = (
    Path(__file__).parent.parent / "prompts" / "draft_generation.txt"
)

MOCK_CONTENT_PLAN = {
    "posts": [
        {
            "hook": f"Hook for post {i + 1} in week {(i // 3) + 1}.",
            "body": f"Body content for post {i + 1}. This is a detailed post with actionable insights about the topic.",
            "cta": f"CTA for post {i + 1} - share your thoughts below!",
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


def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences from a string if present."""
    stripped = text.strip()
    pattern = r"^```(?:json)?\s*\n?(.*?)\n?\s*```$"
    match = re.match(pattern, stripped, re.DOTALL)
    if match:
        return match.group(1).strip()
    return stripped


def _format_pillars(pillars: list[dict]) -> str:
    """Format pillars list into a readable string for the prompt."""
    return ", ".join(pillar["name"] for pillar in pillars)


class ContentService:
    def __init__(self, db: AsyncSession) -> None:
        self._content_repository = ContentRepository(db)
        self._brand_repository = BrandRepository(db)

    async def generate_content_plan(
        self,
        user_id: uuid.UUID,
        anthropic_api_key: str,
    ) -> ContentPlanResponse:
        brand_analysis = await self._brand_repository.get_by_user_id(user_id)
        if brand_analysis is None:
            raise ValidationError(
                "Brand analysis must be completed before generating a content plan"
            )

        if not anthropic_api_key:
            logger.info("No Anthropic API key set, returning mock content plan")
            return await self._save_content_plan(
                user_id, brand_analysis, MOCK_CONTENT_PLAN
            )

        prompt_template = CONTENT_PLAN_PROMPT_PATH.read_text()
        prompt = prompt_template.format(
            archetype_name=brand_analysis.archetype_name,
            pillars=_format_pillars(brand_analysis.pillars),
            tone_tags=", ".join(brand_analysis.tone_tags),
            tone_weights=json.dumps(brand_analysis.tone_weights),
        )

        try:
            client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
            response = await client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_text = response.content[0].text
            cleaned_json = _strip_code_fences(raw_text)
            plan_data = json.loads(cleaned_json)

        except (json.JSONDecodeError, IndexError, KeyError) as exc:
            logger.error("Failed to parse Claude response: %s", exc)
            logger.info("Falling back to mock content plan")
            plan_data = MOCK_CONTENT_PLAN

        except anthropic.APIError as exc:
            logger.error("Anthropic API error: %s", exc)
            logger.info("Falling back to mock content plan")
            plan_data = MOCK_CONTENT_PLAN

        return await self._save_content_plan(user_id, brand_analysis, plan_data)

    async def get_content_plan(
        self, user_id: uuid.UUID
    ) -> ContentPlanResponse | None:
        plan = await self._content_repository.get_plan_by_user_id(user_id)
        if plan is None:
            return None
        return ContentPlanResponse.model_validate(plan)

    async def get_post(self, post_id: uuid.UUID) -> PostResponse:
        post = await self._content_repository.get_post_by_id(post_id)
        if post is None:
            raise NotFoundError("Post not found")
        return PostResponse.model_validate(post)

    async def update_post(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
        data: PostUpdateRequest,
    ) -> PostResponse:
        post = await self._content_repository.get_post_by_id(post_id)
        if post is None:
            raise NotFoundError("Post not found")
        if post.user_id != user_id:
            raise NotFoundError("Post not found")

        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            post = await self._content_repository.update_post(post, **update_data)

        return PostResponse.model_validate(post)

    async def approve_post(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> PostResponse:
        post = await self._content_repository.get_post_by_id(post_id)
        if post is None:
            raise NotFoundError("Post not found")
        if post.user_id != user_id:
            raise NotFoundError("Post not found")

        now = datetime.now(timezone.utc)
        scheduled_at = now + timedelta(days=(post.week_number - 1) * 7)

        post = await self._content_repository.update_post(
            post, status="approved", scheduled_at=scheduled_at
        )
        return PostResponse.model_validate(post)

    async def regenerate_post(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
        anthropic_api_key: str,
    ) -> PostResponse:
        post = await self._content_repository.get_post_by_id(post_id)
        if post is None:
            raise NotFoundError("Post not found")
        if post.user_id != user_id:
            raise NotFoundError("Post not found")

        brand_analysis = await self._brand_repository.get_by_user_id(user_id)
        if brand_analysis is None:
            raise ValidationError("Brand analysis not found")

        if not anthropic_api_key:
            logger.info("No Anthropic API key set, returning mock regenerated post")
            mock_data = {
                "hook": "Fresh hook for regenerated post.",
                "body": "Fresh body with a completely new angle and perspective.",
                "cta": "Fresh CTA - what do you think about this new take?",
            }
            post = await self._content_repository.update_post(post, **mock_data)
            return PostResponse.model_validate(post)

        prompt_template = DRAFT_GENERATION_PROMPT_PATH.read_text()
        prompt = prompt_template.format(
            archetype_name=brand_analysis.archetype_name,
            pillars=_format_pillars(brand_analysis.pillars),
            tone_tags=", ".join(brand_analysis.tone_tags),
            tone_weights=json.dumps(brand_analysis.tone_weights),
            pillar=post.pillar or "",
            platform=post.platform or "",
            format=post.format or "",
            hook=post.hook or "",
            body=post.body or "",
            cta=post.cta or "",
        )

        try:
            client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
            response = await client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_text = response.content[0].text
            cleaned_json = _strip_code_fences(raw_text)
            regenerated = json.loads(cleaned_json)

        except (json.JSONDecodeError, IndexError, KeyError) as exc:
            logger.error("Failed to parse Claude response: %s", exc)
            regenerated = {
                "hook": "Fresh hook for regenerated post.",
                "body": "Fresh body with a completely new angle and perspective.",
                "cta": "Fresh CTA - what do you think about this new take?",
            }

        except anthropic.APIError as exc:
            logger.error("Anthropic API error: %s", exc)
            regenerated = {
                "hook": "Fresh hook for regenerated post.",
                "body": "Fresh body with a completely new angle and perspective.",
                "cta": "Fresh CTA - what do you think about this new take?",
            }

        post = await self._content_repository.update_post(
            post,
            hook=regenerated["hook"],
            body=regenerated["body"],
            cta=regenerated["cta"],
        )
        return PostResponse.model_validate(post)

    async def _save_content_plan(
        self, user_id: uuid.UUID, brand_analysis, plan_data: dict
    ) -> ContentPlanResponse:
        title = f"{brand_analysis.archetype_name} Content Plan"
        plan = await self._content_repository.create_plan(
            user_id=user_id,
            title=title,
            week_count=4,
            posts_per_week=3,
        )

        posts_data = plan_data.get("posts", [])
        for post_data in posts_data:
            await self._content_repository.create_post(
                content_plan_id=plan.id,
                user_id=user_id,
                hook=post_data.get("hook", ""),
                body=post_data.get("body", ""),
                cta=post_data.get("cta", ""),
                pillar=post_data.get("pillar", ""),
                platform=post_data.get("platform", "LinkedIn"),
                format=post_data.get("format", "LinkedIn Post"),
                week_number=post_data.get("week_number", 1),
                status="draft",
            )

        # Expire the plan so selectin reloads the posts relationship
        await self._content_repository.expire_plan(plan)
        refreshed_plan = await self._content_repository.get_plan_by_user_id(user_id)
        return ContentPlanResponse.model_validate(refreshed_plan)
