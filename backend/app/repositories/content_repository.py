import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_plan import ContentPlan
from app.models.post import Post


class ContentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_plan(
        self,
        user_id: uuid.UUID,
        title: str,
        week_count: int,
        posts_per_week: int,
    ) -> ContentPlan:
        plan = ContentPlan(
            user_id=user_id,
            title=title,
            week_count=week_count,
            posts_per_week=posts_per_week,
        )
        self._db.add(plan)
        await self._db.flush()
        await self._db.refresh(plan)
        return plan

    async def create_post(
        self,
        content_plan_id: uuid.UUID,
        user_id: uuid.UUID,
        **post_data: Any,
    ) -> Post:
        post = Post(
            content_plan_id=content_plan_id,
            user_id=user_id,
            **post_data,
        )
        self._db.add(post)
        await self._db.flush()
        await self._db.refresh(post)
        return post

    async def expire_plan(self, plan: ContentPlan) -> None:
        """Expire a plan so relationships are reloaded on next access."""
        self._db.expire(plan)

    async def get_plan_by_user_id(self, user_id: uuid.UUID) -> ContentPlan | None:
        stmt = (
            select(ContentPlan)
            .where(ContentPlan.user_id == user_id)
            .order_by(ContentPlan.created_at.desc())
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_post_by_id(self, post_id: uuid.UUID) -> Post | None:
        stmt = select(Post).where(Post.id == post_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_post(self, post: Post, **kwargs: Any) -> Post:
        for key, value in kwargs.items():
            if hasattr(post, key):
                setattr(post, key, value)
        self._db.add(post)
        await self._db.flush()
        await self._db.refresh(post)
        return post
