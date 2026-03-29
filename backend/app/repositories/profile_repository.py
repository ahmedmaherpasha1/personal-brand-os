import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile


class ProfileRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_profile(self, user_id: uuid.UUID) -> UserProfile:
        profile = UserProfile(user_id=user_id)
        self._db.add(profile)
        await self._db.flush()
        await self._db.refresh(profile)
        return profile

    async def get_profile_by_user_id(self, user_id: uuid.UUID) -> UserProfile | None:
        stmt = select(UserProfile).where(UserProfile.user_id == user_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_profile(self, profile: UserProfile, **kwargs: Any) -> UserProfile:
        for key, value in kwargs.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        self._db.add(profile)
        await self._db.flush()
        await self._db.refresh(profile)
        return profile

    async def get_or_create_profile(self, user_id: uuid.UUID) -> UserProfile:
        profile = await self.get_profile_by_user_id(user_id)
        if profile is None:
            profile = await self.create_profile(user_id)
        return profile
