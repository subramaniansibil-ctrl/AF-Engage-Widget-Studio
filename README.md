# AF Engage Widget Studio

AF Engage Widget Studio is a full-stack foundation for financial advisors to build personalized client journeys with reusable interactive widgets.

Phase 1 establishes the project structure, application shell, routing, state management, API plumbing, backend health/status endpoints, and Docker support.

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
- Nginx for serving the production frontend image

## Folder Structure

```text
.
├── backend
│   ├── cmd/server/main.go
│   ├── internal/config
│   ├── internal/handlers
│   ├── internal/middleware
│   ├── internal/models
│   ├── internal/repositories
│   ├── internal/routes
│   ├── internal/services
│   └── internal/utils
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

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Health: `http://localhost:8080/health`

## Docker Setup

Build and run both services:

```bash
docker compose up --build
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
```
