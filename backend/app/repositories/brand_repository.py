import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand_analysis import BrandAnalysis


class BrandRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, user_id: uuid.UUID, **data: Any) -> BrandAnalysis:
        analysis = BrandAnalysis(user_id=user_id, **data)
        self._db.add(analysis)
        await self._db.flush()
        await self._db.refresh(analysis)
        return analysis

    async def get_by_user_id(self, user_id: uuid.UUID) -> BrandAnalysis | None:
        stmt = (
            select(BrandAnalysis)
            .where(BrandAnalysis.user_id == user_id)
            .order_by(BrandAnalysis.created_at.desc())
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, analysis: BrandAnalysis, **data: Any) -> BrandAnalysis:
        for key, value in data.items():
            if hasattr(analysis, key):
                setattr(analysis, key, value)
        self._db.add(analysis)
        await self._db.flush()
        await self._db.refresh(analysis)
        return analysis
