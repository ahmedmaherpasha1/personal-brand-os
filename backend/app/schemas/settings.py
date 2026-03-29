from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    full_name: str | None = None
    email: str
    linkedin_url: str | None = None
    posting_frequency: str | None = None
    brand_voice: str | None = None
    email_analytics_enabled: bool = False
    content_queue_alerts_enabled: bool = False
    password_updated_days_ago: int | None = None

    model_config = {"from_attributes": True}


class SettingsUpdateRequest(BaseModel):
    full_name: str | None = None
    linkedin_url: str | None = None
    posting_frequency: str | None = None
    brand_voice: str | None = None
    email_analytics_enabled: bool | None = None
    content_queue_alerts_enabled: bool | None = None
    current_password: str | None = None
    new_password: str | None = Field(None, min_length=8)
