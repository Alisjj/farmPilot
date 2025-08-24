# Rebuild Decisions (design-v1)

Date: 2025-08-22

This file records the immediate technical choices for the rebuild aligned with `design.md`.

1. Migration/ORM

- Chosen: Drizzle ORM (TypeScript-first). Reason: repository contains `drizzle.config.ts` and the codebase is TypeScript; reusing Drizzle avoids adding a new toolchain.

2. Database

- PostgreSQL (managed/provisioned in production). Local dev will use Docker Compose Postgres.

3. Backend

- Node.js + Express (aligns with design). Use TypeScript, JWT for auth, Joi for request validation.

4. Frontend

- React + Material UI. PWA-ready via Vite (existing client uses Vite).
- File architecture and UI design: we will preserve the existing repository/file architecture and UI design. The archived `legacy/` folder contains the current `client/` and `server/` layouts — use that as the canonical reference for components, pages, and shared types. Reuse existing libraries, components, and styles from `legacy/client/src` unless a change is required to satisfy the design document.

5. Testing

- Unit: Vitest (backend + frontend where appropriate)
- E2E: Cypress (already present)

6. Dev infra

- Add `docker-compose.dev.yml` for Postgres and a placeholder app service
- Provide `.env.example` for required env vars

Notes:

- Preserve repo/file layout: scaffold and new code will match the existing layout (`client/`, `server/`, `shared/`) as found in `legacy/` so migration is incremental and reviewable.
- If you want to switch to Prisma instead, we can migrate schema later — but initial work will continue with Drizzle.
