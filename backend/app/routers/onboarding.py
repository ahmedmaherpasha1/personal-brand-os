from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.onboarding import (
    GoalsRequest,
    LinkedInManualRequest,
    LinkedInRequest,
    OnboardingStatusResponse,
    ProfileResponse,
    QuestionnaireRequest,
)
from app.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OnboardingStatusResponse:
    service = OnboardingService(db)
    return await service.get_onboarding_status(current_user.id)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    service = OnboardingService(db)
    return await service.get_profile(current_user.id)


@router.post("/goals", response_model=ProfileResponse)
async def save_goals(
    body: GoalsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    service = OnboardingService(db)
    return await service.save_goals(current_user.id, body.goals)


@router.post("/linkedin", response_model=ProfileResponse)
async def process_linkedin(
    body: LinkedInRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    service = OnboardingService(db)
    return await service.process_linkedin(
        current_user.id,
        str(body.linkedin_url),
        settings.APIFY_API_TOKEN,
    )


@router.post("/linkedin/manual", response_model=ProfileResponse)
async def save_linkedin_manual(
    body: LinkedInManualRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    posts = [post.model_dump() for post in body.posts]
    service = OnboardingService(db)
    return await service.save_linkedin_manual(
        current_user.id,
        body.headline,
        body.summary,
        posts,
    )


@router.post("/questionnaire", response_model=ProfileResponse)
async def save_questionnaire(
    body: QuestionnaireRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    service = OnboardingService(db)
    return await service.save_questionnaire(
        current_user.id,
        body.industry,
        body.primary_role,
        body.target_audience,
        body.topics,
        body.brand_voice,
    )
