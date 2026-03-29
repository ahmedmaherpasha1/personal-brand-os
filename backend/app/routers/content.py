import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.content import (
    ContentPlanResponse,
    PostResponse,
    PostUpdateRequest,
)
from app.services.content_service import ContentService

router = APIRouter(prefix="/api/v1/content", tags=["Content Plan"])


@router.get("/plan", response_model=ContentPlanResponse)
async def get_content_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContentPlanResponse:
    service = ContentService(db)
    result = await service.get_content_plan(current_user.id)
    if result is None:
        raise NotFoundError("Content plan not found")
    return result


@router.post("/generate-plan", response_model=ContentPlanResponse)
async def generate_content_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContentPlanResponse:
    service = ContentService(db)
    return await service.generate_content_plan(
        current_user.id,
        settings.ANTHROPIC_API_KEY,
    )


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    service = ContentService(db)
    return await service.get_post(post_id)


@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: uuid.UUID,
    data: PostUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    service = ContentService(db)
    return await service.update_post(post_id, current_user.id, data)


@router.post("/posts/{post_id}/approve", response_model=PostResponse)
async def approve_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    service = ContentService(db)
    return await service.approve_post(post_id, current_user.id)


@router.post("/posts/{post_id}/regenerate", response_model=PostResponse)
async def regenerate_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    service = ContentService(db)
    return await service.regenerate_post(
        post_id,
        current_user.id,
        settings.ANTHROPIC_API_KEY,
    )
