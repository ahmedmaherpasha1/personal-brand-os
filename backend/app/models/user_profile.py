import uuid
from datetime import datetime, timezone

from sqlalchemy import ARRAY, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    goals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linkedin_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    primary_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    topics: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    brand_voice: Mapped[str | None] = mapped_column(Text, nullable=True)
    posting_frequency: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email_analytics_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    content_queue_alerts_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")
