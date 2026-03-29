from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    InvalidTokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._repository = AuthRepository(db)

    async def signup(self, email: str, password: str) -> TokenResponse:
        existing_user = await self._repository.get_by_email(email)
        if existing_user is not None:
            raise ConflictError("A user with this email already exists")

        hashed_pw = hash_password(password)
        user = await self._repository.create_user(email=email, hashed_password=hashed_pw)

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self._repository.get_by_email(email)
        if user is None:
            raise AuthenticationError("Invalid email or password")

        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("User account is deactivated")

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh(self, refresh_token_str: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token_str)
        except InvalidTokenError:
            raise AuthenticationError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        user_id = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("Invalid token payload")

        user = await self._repository.get_by_id(user_id)
        if user is None:
            raise AuthenticationError("User not found")

        if not user.is_active:
            raise AuthenticationError("User account is deactivated")

        access_token = create_access_token(user.id)
        new_refresh_token = create_refresh_token(user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    @staticmethod
    def build_user_response(user: User) -> dict:
        has_completed = False
        if user.profile is not None:
            has_completed = user.profile.onboarding_completed
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "has_completed_onboarding": has_completed,
        }
