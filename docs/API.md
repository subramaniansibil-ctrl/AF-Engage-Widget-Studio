# API Documentation

Base URL: `http://localhost:8080`

Authenticated endpoints use:

```text
Authorization: Bearer <mock-token>
```

## Demo Credentials

```text
advisor@afengage.com / password123 / ADVISOR
client@afengage.com / password123 / CLIENT
admin@afengage.com / password123 / ADMIN
```

## Health and Status

- `GET /health` returns service liveness.
- `GET /api/v1/status` returns API environment and version metadata.

## Authentication

- `POST /api/v1/auth/login`

```json
{
  "email": "advisor@afengage.com",
  "password": "password123"
}
```

- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Advisor APIs

- `GET /api/v1/advisor/dashboard`
- `GET /api/v1/advisor/clients?search=&riskProfile=&retirementStage=`
- `GET /api/v1/advisor/clients/:clientId`
- `POST /api/v1/advisor/clients/:clientId/widgets/configure`
- `POST /api/v1/advisor/clients/:clientId/widgets/assign`
- `GET /api/v1/advisor/clients/:clientId/assigned-widgets`
- `POST /api/v1/advisor/clients/:clientId/publish-dashboard`

## Widget APIs

- `GET /api/v1/widgets`
- `GET /api/v1/widgets/:id`

## Client APIs

- `GET /api/v1/client/dashboard`
- `GET /api/v1/client/widgets`
- `GET /api/v1/client/recommendations`
- `POST /api/v1/client/simulations`

## Simulation APIs

- `POST /api/v1/simulations/two-pot`
- `POST /api/v1/simulations/onefee`
- `POST /api/v1/simulations/income-sustainability`

Simulation responses include an illustration disclaimer. Outputs are mock calculations for demo use and are not financial advice.

## Analytics and Admin APIs

- `GET /api/v1/analytics/advisor`
- `GET /api/v1/analytics/widgets`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/audit-logs`

## Error Format

```json
{
  "success": false,
  "error": "validation failed",
  "details": {
    "Email": "must be a valid email address"
  }
}
```

## Operational Headers

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
