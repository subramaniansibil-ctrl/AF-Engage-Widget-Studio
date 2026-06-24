# AF Engage Widget Studio

AF Engage Widget Studio is a full-stack foundation for financial advisors to build personalized client journeys with reusable interactive widgets.

Phase 1 establishes the project structure, application shell, routing, state management, API plumbing, backend health/status endpoints, and Docker support.

Phase 2 adds mock authentication, role-aware frontend routing, JWT-ready backend middleware, and Redux-managed auth state.

Phase 3 adds the Advisor Portal with dashboard metrics, client search/filtering, and client profile views backed by mock portfolio and retirement data.

Phase 4 adds the reusable widget library, widget configuration, advisor assignment workflow, assigned widget lists, and client dashboard publishing.

Phase 5 adds the Client Portal with personalized dashboards, published widget rendering, recommendations, and saved simulation history.

Phase 8 adds PostgreSQL-ready persistence, SQL migrations, seed data, and `APP_DATA_MODE` switching between mock and Postgres repositories.

## Tech Stack

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Redux Toolkit
- RTK Query
- Recharts
- Framer Motion

Backend:

- Go
- Gin framework
- Clean Architecture-inspired package layout

Infrastructure:

- Docker
- Docker Compose
- PostgreSQL
- Nginx for serving the production frontend image

## Folder Structure

```text
.
├── backend
│   ├── cmd/server/main.go
│   ├── internal/config
│   ├── internal/database
│   ├── internal/handlers
│   ├── internal/middleware
│   ├── internal/models
│   ├── internal/repositories
│   ├── internal/routes
│   ├── internal/services
│   └── internal/utils
│   └── migrations
├── frontend
│   ├── src/app
│   ├── src/components
│   ├── src/features
│   ├── src/pages
│   └── src/styles
└── docker-compose.yml
```

## Backend API

- `GET /health`
- `GET /api/v1/status`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/advisor/dashboard`
- `GET /api/v1/advisor/clients`
- `GET /api/v1/advisor/clients/:id`
- `GET /api/v1/widgets`
- `GET /api/v1/widgets/:id`
- `POST /api/v1/advisor/clients/:clientId/widgets/configure`
- `POST /api/v1/advisor/clients/:clientId/widgets/assign`
- `GET /api/v1/advisor/clients/:clientId/assigned-widgets`
- `POST /api/v1/advisor/clients/:clientId/publish-dashboard`
- `GET /api/v1/client/dashboard`
- `GET /api/v1/client/widgets`
- `GET /api/v1/client/recommendations`
- `POST /api/v1/client/simulations`
- `GET /api/v1/analytics/advisor`
- `GET /api/v1/analytics/widgets`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/audit-logs`

## Mock Accounts

```text
advisor@afengage.com / password123 / ADVISOR
client@afengage.com / password123 / CLIENT
admin@afengage.com / password123 / ADMIN
```

## Local Setup

Install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Run the backend:

```bash
cd backend
go run ./cmd/server
```

The backend defaults to mock repositories:

```bash
APP_DATA_MODE=mock go run ./cmd/server
```

Run with PostgreSQL repositories:

```bash
APP_DATA_MODE=postgres \
DATABASE_URL="postgres://af_engage:af_engage_password@localhost:5433/af_engage?sslmode=disable" \
MIGRATIONS_PATH=migrations \
go run ./cmd/server
```

Migrations run automatically in Postgres mode and seed demo users, clients, widgets, dashboard assignments, notifications, audit logs, and simulation history.

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Health: `http://localhost:8080/health`

## Docker Setup

Build and run both services:

```bash
docker compose up --build
```

Docker Compose starts:

- `postgres` on `localhost:5433`
- `backend` on `localhost:8080`
- `frontend` on `localhost:5173`

By default Compose runs the backend in Postgres mode. To use mock repositories while still starting the Compose stack:

```bash
APP_DATA_MODE=mock docker compose up --build
```

Docker URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Verification

```bash
cd frontend
npm run build
npm audit

cd ../backend
go test ./...
APP_DATA_MODE=mock go run ./cmd/server
```
