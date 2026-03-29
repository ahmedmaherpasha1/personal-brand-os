import uuid
from datetime import datetime

from pydantic import BaseModel


class QueueItemResponse(BaseModel):
    id: uuid.UUID
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

    model_config = {"from_attributes": True}


class QueueResponse(BaseModel):
    items: list[QueueItemResponse]
    total: int


class RescheduleRequest(BaseModel):
    scheduled_at: datetime
