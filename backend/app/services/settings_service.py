import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import hash_password, verify_password
from app.repositories.auth_repository import AuthRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.settings import SettingsResponse, SettingsUpdateRequest

logger = logging.getLogger(__name__)


class SettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._auth_repository = AuthRepository(db)
        self._profile_repository = ProfileRepository(db)

    async def get_settings(self, user_id: uuid.UUID) -> SettingsResponse:
        user = await self._auth_repository.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")

        profile = await self._profile_repository.get_or_create_profile(user_id)

        password_updated_days_ago = self._compute_password_age(user.updated_at)

        return SettingsResponse(
            full_name=user.full_name,
            email=user.email,
            linkedin_url=profile.linkedin_url,
            posting_frequency=profile.posting_frequency,
            brand_voice=profile.brand_voice,
            email_analytics_enabled=profile.email_analytics_enabled,
            content_queue_alerts_enabled=profile.content_queue_alerts_enabled,
            password_updated_days_ago=password_updated_days_ago,
        )

    async def update_settings(
        self, user_id: uuid.UUID, data: SettingsUpdateRequest
    ) -> SettingsResponse:
        user = await self._auth_repository.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")

        profile = await self._profile_repository.get_or_create_profile(user_id)

        # Handle password change
        if data.new_password is not None:
            if data.current_password is None:
                raise ValidationError(
                    "Current password is required to set a new password"
                )
            if not verify_password(data.current_password, user.hashed_password):
                raise ValidationError("Current password is incorrect")
            user.hashed_password = hash_password(data.new_password)

        # Update user fields
        if data.full_name is not None:
            user.full_name = data.full_name

        self._db.add(user)
        await self._db.flush()

        # Update profile fields
        profile_updates: dict = {}
        if data.linkedin_url is not None:
            profile_updates["linkedin_url"] = data.linkedin_url
        if data.posting_frequency is not None:
            profile_updates["posting_frequency"] = data.posting_frequency
        if data.brand_voice is not None:
            profile_updates["brand_voice"] = data.brand_voice
        if data.email_analytics_enabled is not None:
            profile_updates["email_analytics_enabled"] = data.email_analytics_enabled
        if data.content_queue_alerts_enabled is not None:
            profile_updates["content_queue_alerts_enabled"] = (
                data.content_queue_alerts_enabled
            )

        if profile_updates:
            profile = await self._profile_repository.update_profile(
                profile, **profile_updates
            )

        await self._db.flush()
        await self._db.refresh(user)

        password_updated_days_ago = self._compute_password_age(user.updated_at)

        return SettingsResponse(
            full_name=user.full_name,
            email=user.email,
            linkedin_url=profile.linkedin_url,
            posting_frequency=profile.posting_frequency,
            brand_voice=profile.brand_voice,
            email_analytics_enabled=profile.email_analytics_enabled,
            content_queue_alerts_enabled=profile.content_queue_alerts_enabled,
            password_updated_days_ago=password_updated_days_ago,
        )

    @staticmethod
    def _compute_password_age(updated_at: datetime) -> int:
        now = datetime.now(timezone.utc)
        # Handle timezone-naive datetimes (e.g. from SQLite in tests)
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        delta = now - updated_at
        return delta.days
