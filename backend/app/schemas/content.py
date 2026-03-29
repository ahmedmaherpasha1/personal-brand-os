import uuid
from datetime import datetime

from pydantic import BaseModel


class PostResponse(BaseModel):
    id: uuid.UUID
    content_plan_id: uuid.UUID
    user_id: uuid.UUID
    hook: str | None
    body: str | None
    cta: str | None
    pillar: str | None
    platform: str | None
    format: str | None
    status: str
    scheduled_at: datetime | None
    copied_at: datetime | None
    week_number: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostUpdateRequest(BaseModel):
    hook: str | None = None
    body: str | None = None
    cta: str | None = None


class ContentPlanResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    week_count: int
    posts_per_week: int
    posts: list[PostResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GeneratePlanRequest(BaseModel):
    pass
