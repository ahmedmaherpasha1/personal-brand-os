import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, field_validator


class GoalsRequest(BaseModel):
    goals: list[str] = Field(..., min_length=1, max_length=3)

    @field_validator("goals")
    @classmethod
    def validate_goals_not_empty(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("At least one goal is required")
        for goal in value:
            if not goal.strip():
                raise ValueError("Goals cannot be empty strings")
        return value


class LinkedInRequest(BaseModel):
    linkedin_url: HttpUrl


class LinkedInPostData(BaseModel):
    text: str
    likes: int | None = None
    comments: int | None = None


class LinkedInManualRequest(BaseModel):
    headline: str = Field(..., min_length=1)
    summary: str = Field(..., min_length=1)
    posts: list[LinkedInPostData] = Field(default_factory=list)


class QuestionnaireRequest(BaseModel):
    industry: str = Field(..., min_length=1)
    primary_role: str = Field(..., min_length=1)
    target_audience: str = Field(..., min_length=1)
    topics: list[str] = Field(..., min_length=1)
    brand_voice: str = Field(..., min_length=1)

    @field_validator("topics")
    @classmethod
    def validate_topics_not_empty(cls, value: list[str]) -> list[str]:
        for topic in value:
            if not topic.strip():
                raise ValueError("Topics cannot be empty strings")
        return value


class OnboardingStatusResponse(BaseModel):
    goals_completed: bool
    linkedin_completed: bool
    questionnaire_completed: bool
    is_complete: bool


class ProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    goals: list[str] | None = None
    linkedin_url: str | None = None
    linkedin_data: dict | None = None
    industry: str | None = None
    primary_role: str | None = None
    target_audience: str | None = None
    topics: list[str] | None = None
    brand_voice: str | None = None
    posting_frequency: str | None = None
    onboarding_completed: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
