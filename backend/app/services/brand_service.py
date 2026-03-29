import json
import logging
import re
import uuid
from pathlib import Path

import anthropic
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.repositories.brand_repository import BrandRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.brand import BrandAnalysisResponse

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE_PATH = Path(__file__).parent.parent / "prompts" / "brand_analysis.txt"

MOCK_BRAND_ANALYSIS = {
    "archetype_name": "The Sage",
    "archetype_description": (
        "The Sage archetype represents a trusted source of knowledge and wisdom. "
        "You are driven by a desire to understand the world and share insights that "
        "help others grow professionally."
    ),
    "positioning_statement": (
        "Helping professionals navigate complex technical landscapes with clear, "
        "actionable insights that bridge the gap between strategy and execution."
    ),
    "pillars": [
        {
            "name": "Technical Leadership",
            "icon": "architecture",
            "description": (
                "Sharing insights on technical decision-making, system design, "
                "and engineering best practices."
            ),
        },
        {
            "name": "Industry Trends",
            "icon": "trending_up",
            "description": (
                "Analyzing emerging technologies and their impact on businesses "
                "and careers."
            ),
        },
        {
            "name": "Career Growth",
            "icon": "school",
            "description": (
                "Practical advice on professional development, skill building, "
                "and navigating career transitions."
            ),
        },
    ],
    "tone_tags": [
        "Insightful",
        "Approachable",
        "Strategic",
        "Clear",
        "Empowering",
    ],
    "tone_weights": {
        "Authoritative": 30,
        "Conversational": 20,
        "Inspirational": 15,
        "Educational": 25,
        "Analytical": 10,
    },
}


def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences from a string if present."""
    stripped = text.strip()
    pattern = r"^```(?:json)?\s*\n?(.*?)\n?\s*```$"
    match = re.match(pattern, stripped, re.DOTALL)
    if match:
        return match.group(1).strip()
    return stripped


def _format_linkedin_posts(linkedin_data: dict | None) -> str:
    """Format LinkedIn posts for the prompt."""
    if not linkedin_data:
        return "No LinkedIn content available."

    posts = linkedin_data.get("posts", [])
    if not posts:
        return "No LinkedIn posts available."

    formatted_posts = []
    for index, post in enumerate(posts[:10], start=1):
        text = post.get("text", "")
        likes = post.get("likes", 0)
        comments = post.get("comments", 0)
        formatted_posts.append(
            f"Post {index} (Likes: {likes}, Comments: {comments}):\n{text}"
        )

    return "\n\n".join(formatted_posts)


class BrandService:
    def __init__(self, db: AsyncSession) -> None:
        self._brand_repository = BrandRepository(db)
        self._profile_repository = ProfileRepository(db)

    async def generate_brand_analysis(
        self,
        user_id: uuid.UUID,
        anthropic_api_key: str,
    ) -> BrandAnalysisResponse:
        profile = await self._profile_repository.get_profile_by_user_id(user_id)

        if profile is None or not profile.onboarding_completed:
            raise ValidationError(
                "Onboarding must be completed before generating brand analysis"
            )

        if not anthropic_api_key:
            logger.info("No Anthropic API key set, returning mock brand analysis")
            return await self._save_analysis(user_id, MOCK_BRAND_ANALYSIS)

        prompt_template = PROMPT_TEMPLATE_PATH.read_text()

        goals_str = ", ".join(profile.goals) if profile.goals else "Not specified"
        topics_str = ", ".join(profile.topics) if profile.topics else "Not specified"
        linkedin_posts_str = _format_linkedin_posts(profile.linkedin_data)

        prompt = prompt_template.format(
            industry=profile.industry or "Not specified",
            primary_role=profile.primary_role or "Not specified",
            target_audience=profile.target_audience or "Not specified",
            topics=topics_str,
            brand_voice=profile.brand_voice or "Not specified",
            goals=goals_str,
            linkedin_posts=linkedin_posts_str,
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
            analysis_data = json.loads(cleaned_json)

        except (json.JSONDecodeError, IndexError, KeyError) as exc:
            logger.error("Failed to parse Claude response: %s", exc)
            logger.info("Falling back to mock brand analysis")
            analysis_data = MOCK_BRAND_ANALYSIS

        except anthropic.APIError as exc:
            logger.error("Anthropic API error: %s", exc)
            logger.info("Falling back to mock brand analysis")
            analysis_data = MOCK_BRAND_ANALYSIS

        return await self._save_analysis(user_id, analysis_data)

    async def get_brand_analysis(
        self, user_id: uuid.UUID
    ) -> BrandAnalysisResponse | None:
        analysis = await self._brand_repository.get_by_user_id(user_id)
        if analysis is None:
            return None
        return BrandAnalysisResponse.model_validate(analysis)

    async def _save_analysis(
        self, user_id: uuid.UUID, data: dict
    ) -> BrandAnalysisResponse:
        existing = await self._brand_repository.get_by_user_id(user_id)

        save_data = {
            "archetype_name": data["archetype_name"],
            "archetype_description": data["archetype_description"],
            "positioning_statement": data["positioning_statement"],
            "pillars": data["pillars"],
            "tone_tags": data["tone_tags"],
            "tone_weights": data["tone_weights"],
            "raw_response": data,
        }

        if existing:
            analysis = await self._brand_repository.update(existing, **save_data)
        else:
            analysis = await self._brand_repository.create(user_id, **save_data)

        return BrandAnalysisResponse.model_validate(analysis)
