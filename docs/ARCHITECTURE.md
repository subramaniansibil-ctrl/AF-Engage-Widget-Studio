# Architecture Overview

AF Engage Widget Studio is a full-stack demo platform for advisor-authored, client-facing financial journey widgets.

## Frontend

- React, TypeScript, Vite, Tailwind CSS
- React Router for advisor, client, and admin route trees
- Redux Toolkit for auth and UI state
- RTK Query for typed API access and cache invalidation
- Recharts for financial visualizations
- Framer Motion for page-level transitions
- Reusable UI primitives for buttons, cards, skeletons, empty states, toasts, and error recovery

The frontend keeps API contracts in TypeScript interfaces and does not use Zod. Protected route wrappers enforce role-based access before rendering portal layouts.

## Backend

- Go and Gin
- Clean Architecture-inspired packages:
  - `models` define API/domain shapes
  - `repositories` isolate mock and PostgreSQL persistence
  - `services` hold business and simulation logic
  - `handlers` translate HTTP requests into service calls
  - `middleware` handles auth, roles, CORS, rate limits, and logging
  - `routes` owns route registration

The backend is JWT-ready. Current authentication uses mock bearer tokens so the demo stays easy to run locally.

## Persistence Modes

`APP_DATA_MODE=mock` uses in-memory repositories.

`APP_DATA_MODE=postgres` connects to PostgreSQL, runs SQL migrations, and seeds demo users, clients, widgets, dashboard assignments, notifications, audit logs, and simulation history.

## Runtime Concerns

- Structured JSON logs via Go `slog`
- Centralized JSON error responses
- Request validation using Go struct tags and Gin binding
- Configurable CORS with `CORS_ALLOWED_ORIGINS`
- Per-IP rate limiting with `RATE_LIMIT_RPM`
- Graceful shutdown on `SIGINT` and `SIGTERM`

## Demo Flow

1. Sign in as an advisor.
2. Review dashboard metrics and client list.
3. Open a client profile.
4. Configure and assign widgets.
5. Publish the client dashboard.
6. Sign in as the client to view assigned widgets and run simulations.
7. Use analytics, notifications, and admin views for the hackathon story.

## Screenshot Placeholders

Add final screenshots under `docs/screenshots/`:

- `login.png`
- `advisor-dashboard.png`
- `client-detail.png`
- `widget-simulation.png`
- `client-dashboard.png`
- `admin-dashboard.png`
