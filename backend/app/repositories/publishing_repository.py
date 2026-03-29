import uuid
from datetime import datetime, timezone

from sqlalchemy import asc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post


class PublishingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_queue(self, user_id: uuid.UUID) -> list[Post]:
        stmt = (
            select(Post)
            .where(
                Post.user_id == user_id,
                Post.status.in_(("approved", "scheduled", "copied")),
            )
            .order_by(
                asc(Post.scheduled_at).nullslast(),
                asc(Post.created_at),
            )
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def reschedule(self, post: Post, scheduled_at: datetime) -> Post:
        post.scheduled_at = scheduled_at
        post.status = "scheduled"
        self._db.add(post)
        await self._db.flush()
        await self._db.refresh(post)
        return post

    async def mark_copied(self, post: Post) -> Post:
        post.copied_at = datetime.now(timezone.utc)
        post.status = "copied"
        self._db.add(post)
        await self._db.flush()
        await self._db.refresh(post)
        return post
