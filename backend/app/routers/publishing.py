import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.publishing import QueueItemResponse, QueueResponse, RescheduleRequest
from app.services.publishing_service import PublishingService

router = APIRouter(prefix="/api/v1/publishing", tags=["Publishing Queue"])


@router.get("/queue", response_model=QueueResponse)
async def get_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QueueResponse:
    service = PublishingService(db)
    return await service.get_queue(current_user.id)


@router.put("/queue/{post_id}/reschedule", response_model=QueueItemResponse)
async def reschedule_post(
    post_id: uuid.UUID,
    data: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QueueItemResponse:
    service = PublishingService(db)
    return await service.reschedule_post(
        post_id, current_user.id, data.scheduled_at
    )


@router.put("/queue/{post_id}/copied", response_model=QueueItemResponse)
async def mark_copied(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QueueItemResponse:
    service = PublishingService(db)
    return await service.mark_copied(post_id, current_user.id)
