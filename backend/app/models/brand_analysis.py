import uuid
from datetime import datetime, timezone

from sqlalchemy import ARRAY, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BrandAnalysis(Base):
    __tablename__ = "brand_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    archetype_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    archetype_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    positioning_statement: Mapped[str | None] = mapped_column(Text, nullable=True)
    pillars: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tone_tags: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    tone_weights: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
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
