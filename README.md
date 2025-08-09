# FarmPilot

Modern poultry farm management platform covering daily activities, employee management, inventory, health monitoring, reporting and KPIs.

## Features

-   Authentication (JWT access + refresh cookies) with transparent token refresh
-   Role model: admin (full) and staff (operational). Granular permissions table scaffolded for future RBAC
-   Activities module: egg collection, feed distribution, mortality, medication, water consumption, sales, maintenance
-   Specialized forms (egg collection, mortality, feed distribution) with validation (zod) and contextual analytics (mortality alerting)
-   Employee management: create/edit employees, auto ID generation, platform user creation (admin only)
-   Inventory tracking & adjustments (with tests for thresholds)
-   KPI & dashboard widgets
-   Alert system & notification scaffolding
-   Reporting engine (inventory report generator etc.)
-   Responsive UI (React + Tailwind + Radix UI + shadcn patterns) with mobile sidebar handling
-   Data fetching & caching via TanStack Query, single-flight refresh handling
-   Postgres + Drizzle ORM schema sharing (server & client type safety)
-   Cypress E2E & component tests; Jest backend tests

## Tech Stack

| Layer    | Tech                                                             |
| -------- | ---------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Wouter, TanStack Query, Tailwind, Radix UI |
| Backend  | Node.js + Express (ESM), Drizzle ORM, PostgreSQL                 |
| Auth     | JWT (access/refresh), bcrypt                                     |
| Tooling  | Vite, esbuild, tsx, Cypress, Jest, Zod                           |

## Project Structure

```text
client/            # Frontend React app
server/            # Express server, routes, auth, KPI engine
shared/            # Shared types & Drizzle schema
database/          # SQL migrations
cypress/           # E2E & component tests
server/scripts/    # Utility scripts (e.g., create-admin)
```

## Getting Started

### Prerequisites

-   Node 18+
-   PostgreSQL instance (local or cloud)

### Install

```bash
npm install
```

### Environment

Create `.env` (never commit) based on example below:

```env
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_SECRET=change_me
REFRESH_TOKEN_SECRET=change_me_too
PORT=3000
```

### Database

Push schema (Drizzle):

```bash
npm run db:push
```

(Or apply existing SQL migrations in `database/` manually.)

### Development

Run server + client (Vite dev server embedded):

```bash
npm run dev
```

### Create Admin User

```bash
npm run create-admin -- admin@example.com StrongPass123 Admin User
```

Re-run to upsert / ensure admin.

### Testing

Cypress E2E:

```bash
npm run test:e2e
```

Component tests:

```bash
npm run test:component
```

Backend (Jest):

```bash
npm run test:backend
```

### Production Build

```bash
npm run build
npm start
```

Outputs go to `dist/` (bundled server) + client build.

## Auth Flow

-   Access token short-lived; refresh token httpOnly cookie.
-   `fetchWithRefresh` transparently retries once on 401 via `/api/refresh` (single-flight promise to prevent stampede).
-   Logout clears cookies server-side.

## Roles & Permissions

Current persisted roles: `admin`, `staff`.

A permissions and user_permissions table exist (not yet enforced). To extend:

1. Insert permission codes in `permissions`.
2. Link via `user_permissions`.
3. Add middleware to check required codes per route/UI action.

## Activities Module

Supports structured records. Mortality form calculates rate and dynamic alert level (warning/critical) via thresholds. Extend thresholds via `mortalityThresholds` prop or shared alert engine.

## Scripts

| Script       | Purpose                      |
| ------------ | ---------------------------- |
| dev          | Start dev server             |
| build        | Build client + bundle server |
| start        | Run production build         |
| db:push      | Apply Drizzle schema to DB   |
| create-admin | Ensure an admin user exists  |
| test:\*      | Cypress & Jest test variants |

## Testing Notes

-   Cypress specs under `cypress/e2e/` and component tests under `cypress/component/`.
-   Backend Jest tests in `server/__tests__/` (e.g., inventory threshold logic).

## Future Enhancements

-   Reinstate granular roles (supervisor, manager, CEO) mapped onto permissions
-   Implement per-permission UI gating + route middleware
-   Add reporting exports (CSV/PDF)
-   Real-time notifications via WebSocket
-   Advanced analytics & KPI trend charts

## Contributing

1. Create a feature branch
2. Commit with clear messages
3. Open PR referencing any related requirements
4. Ensure tests pass (CI) & add new tests where relevant

## License

MIT
