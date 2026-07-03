# AF Engage Widget Studio

AF Engage Widget Studio is a full-stack foundation for financial advisors to build personalized client journeys with reusable interactive widgets.

Phase 1 establishes the project structure, application shell, routing, state management, API plumbing, backend health/status endpoints, and Docker support.

Phase 2 adds mock authentication, role-aware frontend routing, JWT-ready backend middleware, and Redux-managed auth state.

Phase 3 adds the Advisor Portal with dashboard metrics, client search/filtering, and client profile views backed by mock portfolio and retirement data.

Phase 4 adds the reusable widget library, widget configuration, advisor assignment workflow, assigned widget lists, and client dashboard publishing.

Phase 5 adds the Client Portal with personalized dashboards, published widget rendering, recommendations, and saved simulation history.

Phase 8 adds PostgreSQL-ready persistence, SQL migrations, seed data, and `APP_DATA_MODE` switching between mock and Postgres repositories.

Phase 9 makes the app demo-ready with loading skeletons, error boundaries, toast notifications, dark mode, structured backend logging, validation, CORS/rate limiting, graceful shutdown, tests, and expanded documentation.

Client Management adds an admin-only client directory with manual create/edit/deactivate workflows, CSV bulk import, duplicate protection, and advisor assignment visibility rules.

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
- Vitest and Testing Library

Backend:

- Go
- Gin framework
- Clean Architecture-inspired package layout
- Structured logging, validation, rate limiting, CORS, graceful shutdown

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
├── docs
│   ├── API.md
│   └── ARCHITECTURE.md
├── frontend
│   ├── src/app
│   ├── src/components
│   ├── src/features
│   ├── src/pages
│   └── src/styles
└── docker-compose.yml
```

## Backend API

See [docs/API.md](docs/API.md) for routes, auth notes, and example requests.

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

## Dashboard publish emails

Dashboard publishing supports any SMTP provider, including Brevo SMTP and Gmail SMTP. Email delivery is disabled by default, so local publishing works without credentials. To enable it:

```bash
EMAIL_PROVIDER=smtp \
SMTP_HOST=smtp-relay.brevo.com \
SMTP_PORT=587 \
SMTP_USERNAME="your-smtp-username" \
SMTP_PASSWORD="your-smtp-key" \
SMTP_FROM_EMAIL="verified-sender@example.com" \
SMTP_FROM_NAME="Alexforbes Widget Studio" \
SMTP_TLS_MODE=starttls \
FRONTEND_URL="http://localhost:5173" \
go run ./cmd/server
```

Use `SMTP_TLS_MODE=implicit` for providers requiring implicit TLS (commonly port 465), or `none` only for a trusted local development mail server. Never commit SMTP credentials. Publishing remains successful if email delivery is disabled or fails; the backend records a structured warning and returns `emailNotification` as `sent`, `failed`, or `skipped`.

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
npm test
npm audit

cd ../backend
go test ./...
APP_DATA_MODE=mock go run ./cmd/server
```

## Demo Notes

- Demo credentials are listed above and seeded in both mock and Postgres modes.
- Admins manage client records at `/admin/clients`; advisors only see active clients assigned to their account.
- The UI supports light/dark mode, responsive advisor/client/admin portals, loading skeletons, empty states, error boundaries, and toast feedback.
- Screenshots can be added under `docs/screenshots/` for the final hackathon deck.

## Additional Documentation

- [API documentation](docs/API.md)
- [Architecture overview](docs/ARCHITECTURE.md)
