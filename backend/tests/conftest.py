import asyncio
import json
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import String, Text, TypeDecorator
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

from app.core.database import Base, get_db
from app.main import app
from app.models.brand_analysis import BrandAnalysis
from app.models.user_profile import UserProfile

TEST_DATABASE_URL = "sqlite+aiosqlite://"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
async_test_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


# Teach SQLite compiler how to render PostgreSQL-specific column types.
@compiles(PG_UUID, "sqlite")
def compile_pg_uuid_sqlite(type_, compiler, **kw):
    return "VARCHAR(36)"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


def _visit_array(self, type_, **kw):
    return "JSON"


SQLiteTypeCompiler.visit_ARRAY = _visit_array


# Replace the ARRAY(String) column on UserProfile.topics with a JSONB column for SQLite.
# This avoids the "list type not supported" error when binding parameters.
UserProfile.__table__.c.topics.type = JSONB()
BrandAnalysis.__table__.c.tone_tags.type = JSONB()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_test_session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def signup_payload() -> dict:
    return {
        "email": "test@example.com",
        "password": "securepassword123",
    }


@pytest.fixture
def login_payload() -> dict:
    return {
        "email": "test@example.com",
        "password": "securepassword123",
    }
