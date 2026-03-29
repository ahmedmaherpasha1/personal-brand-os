import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class AuthRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_user(self, email: str, hashed_password: str) -> User:
        user = User(email=email, hashed_password=hashed_password)
        self._db.add(user)
        await self._db.flush()
        await self._db.refresh(user)
        return user

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str | uuid.UUID) -> User | None:
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        stmt = select(User).where(User.id == user_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()
