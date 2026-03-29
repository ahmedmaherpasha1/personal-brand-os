# Personal Brand OS

## Overview
AI-powered personal branding platform that analyzes LinkedIn profiles, generates brand archetypes, and creates content plans with scheduled posts.

## Tech Stack
- **Backend**: Python 3.11 + FastAPI, async SQLAlchemy 2.0, PostgreSQL 16, Redis 7
- **Frontend**: React (Vite) on port 5173
- **AI**: Anthropic Claude API for brand analysis and content generation
- **Scraping**: Apify for LinkedIn profile data
- **Auth**: JWT (access 30min, refresh 7d), bcrypt password hashing
- **Migrations**: Alembic (async)
- **Infrastructure**: Docker Compose (PostgreSQL, Redis, backend, frontend)

## How to Run
```bash
# Start all services
docker-compose up --build

# Backend only (dev)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Run tests
cd backend
pip install -r requirements-test.txt
pytest

# Run migrations
cd backend
alembic upgrade head
```

## Project Structure
```
personal-brand-os/
  docker-compose.yml
  .env
  backend/
    app/
      main.py              # FastAPI app, CORS, lifespan
      config.py             # pydantic-settings
      core/
        database.py         # Async engine, session, Base
        security.py         # JWT + bcrypt
        dependencies.py     # get_current_user
        exceptions.py       # Custom exceptions + handlers
      models/               # SQLAlchemy models
      schemas/              # Pydantic request/response
      repositories/         # Data access layer
      services/             # Business logic
      routers/              # API endpoints
    alembic/                # Database migrations
    tests/                  # pytest async tests
  frontend/
```

## Key Decisions
- **bcrypt pinned to 4.1.3**: passlib crashes with bcrypt>=5.0
- **Login returns tokens only**: No user object; frontend calls GET /me after login
- **Signup accepts only email + password**: No full_name field in signup
- **Onboarding field**: `onboarding_completed` on UserProfile, exposed as `has_completed_onboarding` in API
- **UUID primary keys**: All models use UUID PKs with TIMESTAMPTZ timestamps
- **Repository pattern**: Data access separated from business logic via repositories
- **SQLite for tests**: Tests use aiosqlite with type adapters for PG-specific types (UUID, JSONB, ARRAY)

## API Endpoints (Phase 1)
- `GET /health` - Health check
- `POST /api/v1/auth/signup` - Register (email + password) -> tokens
- `POST /api/v1/auth/login` - Login -> tokens
- `POST /api/v1/auth/refresh` - Refresh tokens
- `GET /api/v1/auth/me` - Get current user (requires auth)
