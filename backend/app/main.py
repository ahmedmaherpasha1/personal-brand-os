import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.database import Base, engine
from app.core.exceptions import register_exception_handlers
from app.models.brand_analysis import BrandAnalysis  # noqa: F401
from app.models.content_plan import ContentPlan  # noqa: F401
from app.models.post import Post  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_profile import UserProfile  # noqa: F401
from app.routers import auth, brand, content, onboarding, publishing
from app.routers.settings import router as settings_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up - creating database tables")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Shutting down - disposing engine")
    await engine.dispose()


app = FastAPI(
    title="Personal Brand OS",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(brand.router)
app.include_router(content.router)
app.include_router(publishing.router)
app.include_router(settings_router)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
