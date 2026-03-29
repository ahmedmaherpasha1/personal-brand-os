import uuid
from datetime import datetime

from pydantic import BaseModel


class PillarSchema(BaseModel):
    name: str
    icon: str
    description: str


class BrandAnalysisResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    archetype_name: str
    archetype_description: str
    positioning_statement: str
    pillars: list[PillarSchema]
    tone_tags: list[str]
    tone_weights: dict[str, int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrandAnalyzeRequest(BaseModel):
    pass
