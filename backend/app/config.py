from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://brandos:brandos_secret@db:5432/brandos"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET_KEY: str = "super-secret-jwt-key-change-in-production"
    ANTHROPIC_API_KEY: str = ""
    APIFY_API_TOKEN: str = ""
    ENVIRONMENT: str = "development"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
