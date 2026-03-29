# Personal Brand OS - Frontend

## Overview
React SPA for the Personal Brand OS platform. Phase 1 covers auth UI (login/signup) and the authenticated app shell with sidebar navigation.

## Tech Stack
- React 18 (Vite)
- Tailwind CSS v3 with custom "Digital Curator" design system
- React Router DOM v6
- Axios with JWT token management

## How to Run
```bash
# Standalone
cd frontend
npm install
npm run dev

# Via Docker Compose (from project root)
docker-compose up frontend
```
Runs on http://localhost:5173. Backend expected at http://localhost:8000.

## Project Structure
```
frontend/
  src/
    components/
      layout/            # AppLayout, ProtectedRoute, OnboardingGuard
      onboarding/        # StepGoals, StepLinkedIn, StepQuestionnaire
    context/             # AuthContext (user state, login/signup/logout, onboarding status)
    pages/               # LoginPage, SignupPage, OnboardingPage, 4 dashboard pages
    services/            # Axios instance with interceptors + refresh token queue
    App.jsx              # Route definitions
    main.jsx             # Entry point
    index.css            # Tailwind directives + custom component classes
  tailwind.config.js     # Design system tokens (colors, fonts, shadows)
  vite.config.js         # Dev server config
  Dockerfile             # node:20-alpine container
```

## Design System
- "The Digital Curator" - tonal surface layering, no hard borders
- Fonts: Manrope (display) + Inter (body)
- Primary gradient: #001674 to #1a2e94
- Ghost borders: outline-variant at 20% opacity
- Glassmorphism for AI feature cards

## Key Decisions
- Refresh token queue pattern in api.js to handle concurrent 401s without duplicate refreshes
- AuthContext checks /auth/me on mount to validate stored tokens
- Sidebar navigation uses NavLink with isActive for route highlighting
- Left panel on login/signup is shared visual branding; right panel is the form
