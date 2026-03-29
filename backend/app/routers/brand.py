from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.brand import BrandAnalysisResponse
from app.services.brand_service import BrandService

router = APIRouter(prefix="/api/v1/brand", tags=["Brand Analysis"])


@router.get("/analysis", response_model=BrandAnalysisResponse)
async def get_brand_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BrandAnalysisResponse:
    service = BrandService(db)
    result = await service.get_brand_analysis(current_user.id)
    if result is None:
        raise NotFoundError("Brand analysis not found")
    return result


@router.post("/analyze", response_model=BrandAnalysisResponse)
async def analyze_brand(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BrandAnalysisResponse:
    service = BrandService(db)
    return await service.generate_brand_analysis(
        current_user.id,
        settings.ANTHROPIC_API_KEY,
    )
