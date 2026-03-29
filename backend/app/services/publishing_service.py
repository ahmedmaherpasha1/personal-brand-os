import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.content_repository import ContentRepository
from app.repositories.publishing_repository import PublishingRepository
from app.schemas.publishing import QueueItemResponse, QueueResponse


class PublishingService:
    def __init__(self, db: AsyncSession) -> None:
        self._publishing_repository = PublishingRepository(db)
        self._content_repository = ContentRepository(db)

    async def get_queue(self, user_id: uuid.UUID) -> QueueResponse:
        posts = await self._publishing_repository.get_queue(user_id)
        items = [QueueItemResponse.model_validate(post) for post in posts]
        return QueueResponse(items=items, total=len(items))

    async def reschedule_post(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
        scheduled_at: datetime,
    ) -> QueueItemResponse:
        post = await self._content_repository.get_post_by_id(post_id)
        if post is None:
            raise NotFoundError("Post not found")
        if post.user_id != user_id:
            raise NotFoundError("Post not found")

        post = await self._publishing_repository.reschedule(post, scheduled_at)
        return QueueItemResponse.model_validate(post)

    async def mark_copied(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> QueueItemResponse:
        post = await self._content_repository.get_post_by_id(post_id)
        if post is None:
            raise NotFoundError("Post not found")
        if post.user_id != user_id:
            raise NotFoundError("Post not found")

        post = await self._publishing_repository.mark_copied(post)
        return QueueItemResponse.model_validate(post)
