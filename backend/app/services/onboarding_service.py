import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.profile_repository import ProfileRepository
from app.schemas.onboarding import OnboardingStatusResponse, ProfileResponse
from app.services.linkedin_service import (
    get_mock_linkedin_data,
    scrape_posts_via_apify,
    scrape_public_profile,
)

logger = logging.getLogger(__name__)


class OnboardingService:
    def __init__(self, db: AsyncSession) -> None:
        self._repository = ProfileRepository(db)

    async def save_goals(
        self, user_id: uuid.UUID, goals: list[str]
    ) -> ProfileResponse:
        profile = await self._repository.get_or_create_profile(user_id)
        profile = await self._repository.update_profile(profile, goals=goals)
        return ProfileResponse.model_validate(profile)

    async def process_linkedin(
        self,
        user_id: uuid.UUID,
        linkedin_url: str,
        apify_token: str,
    ) -> ProfileResponse:
        profile_data = await scrape_public_profile(linkedin_url)
        posts = await scrape_posts_via_apify(linkedin_url, apify_token)

        linkedin_data = {
            "headline": profile_data.get("headline", ""),
            "summary": profile_data.get("summary", ""),
            "posts": posts,
        }

        profile = await self._repository.get_or_create_profile(user_id)
        profile = await self._repository.update_profile(
            profile,
            linkedin_url=str(linkedin_url),
            linkedin_data=linkedin_data,
        )
        return ProfileResponse.model_validate(profile)

    async def save_linkedin_manual(
        self,
        user_id: uuid.UUID,
        headline: str,
        summary: str,
        posts: list[dict],
    ) -> ProfileResponse:
        linkedin_data = {
            "headline": headline,
            "summary": summary,
            "posts": posts,
        }

        profile = await self._repository.get_or_create_profile(user_id)
        profile = await self._repository.update_profile(
            profile,
            linkedin_data=linkedin_data,
        )
        return ProfileResponse.model_validate(profile)

    async def save_questionnaire(
        self,
        user_id: uuid.UUID,
        industry: str,
        primary_role: str,
        target_audience: str,
        topics: list[str],
        brand_voice: str,
    ) -> ProfileResponse:
        profile = await self._repository.get_or_create_profile(user_id)
        profile = await self._repository.update_profile(
            profile,
            industry=industry,
            primary_role=primary_role,
            target_audience=target_audience,
            topics=topics,
            brand_voice=brand_voice,
            onboarding_completed=True,
        )
        return ProfileResponse.model_validate(profile)

    async def get_onboarding_status(
        self, user_id: uuid.UUID
    ) -> OnboardingStatusResponse:
        profile = await self._repository.get_profile_by_user_id(user_id)

        if profile is None:
            return OnboardingStatusResponse(
                goals_completed=False,
                linkedin_completed=False,
                questionnaire_completed=False,
                is_complete=False,
            )

        goals_completed = profile.goals is not None and len(profile.goals) > 0
        linkedin_completed = profile.linkedin_data is not None
        questionnaire_completed = profile.industry is not None
        is_complete = profile.onboarding_completed

        return OnboardingStatusResponse(
            goals_completed=goals_completed,
            linkedin_completed=linkedin_completed,
            questionnaire_completed=questionnaire_completed,
            is_complete=is_complete,
        )

    async def get_profile(self, user_id: uuid.UUID) -> ProfileResponse:
        profile = await self._repository.get_or_create_profile(user_id)
        return ProfileResponse.model_validate(profile)
