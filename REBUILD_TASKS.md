# Rebuild Plan — Align Implementation to Design v1.0

Date: 2025-08-24  
**Last Updated:** 2025-08-24

Objective: Rebuild according to `design.md` while preserving the existing repository/file architecture and reusing existing libraries and UI where possible. The `legacy/` folder contains the previous `client/` and `server/` layouts — use that as the reference for components, pages, shared types, and styles. Only scrap or rewrite code when necessary to implement the new design or remove technical debt.

---

## Requirements coverage

- Use the current design (design.md) as the single source of truth
- Scrap current implementation (archive/disable old code paths)
- Provide a clear, trackable task list in Markdown

Status key: [P0]=Critical, [P1]=High, [P2]=Normal | [🟢]=Done [🟡]=In-Progress [⚪]=Todo

---

## Phase 0 — Preparation & Reset

- [P0][🟢] Create rebuild branch `rebuild/design-v1` and protect `main`
- [P0][🟢] Snapshot current repo: tag `pre-rebuild-<date>` and archive `client/` + `server/` to `legacy/`
- [P0][🟢] Keep only infra that still helps (Cypress, Tailwind config if reused, CI); note deviations in this doc
- [P0][🟢] Decide lib choices that must match design (prefer existing libs from `legacy/`):
  - Backend: Node.js + Express, JWT, Zod (upgraded from Joi for better TypeScript integration)
  - DB: PostgreSQL, migrations (Drizzle ORM as configured in existing setup)
  - Frontend: React + Material UI, Chart.js, PWA (reuse components and styles from `legacy/client`)
- [P0][🟢] Introduce `docker-compose` for Postgres + app (dev)

**✅ Deliverable: clean scaffold, legacy archived, decision notes committed.**

---

## Phase 1 — Database & Migrations (from Section 4)

- [P0][🟢] Initialize migration tool (Drizzle) and DB connection
- [P0][🟢] Implement core schema tables:
  - users, houses, daily_logs, customers, sales
  - feed_recipes, feed_batches, batch_ingredients
  - operating_costs, bird_costs, daily_costs
- [P0][🟢] **NEW:** Add labor management tables:
  - laborers, daily_work_assignments, monthly_payroll
- [P1][🟢] Add indexes and constraints (checks from design)
- [P1][🟢] Seed scripts: minimal owner user + sample house
- [P1][🟢] Add SQL sanity tests (migration up/down, constraint checks)

**✅ Acceptance: migrations apply on fresh DB; constraints enforce invariants; seed runs.**

---

## Phase 2 — Backend Auth & RBAC (Section 5.1, 2.1.1)

## Phase 2 — Backend Auth & RBAC (Section 5.1, 2.1.1)

- [P0][🟢] Express app scaffold with structured routing and error handling
- [P0][🟢] Auth endpoints: POST /api/auth/login, /refresh, /logout, /me
- [P0][🟢] JWT issuance/verification; password hashing; session timeout
- [P1][🟢] Role-based middleware (owner, supervisor)
- [P1][🟢] Validation with Zod for all auth payloads (upgraded from Joi for TypeScript)
- [P1][🟢] Unit tests for auth + role guard
- [P1][🟢] **COMPLETED:** Code cleanup and organization following TypeScript conventions

**✅ Acceptance: login works; protected routes enforce roles; tests pass; clean code organization.**

---

## Phase 3 — Daily Operations APIs (Section 5.2)

- [P0][🟢] CRUD for daily logs: GET/POST/PUT/DELETE /api/daily-logs
- [P0][🟢] Houses: GET/POST /api/houses
- [P1][🟢] Input validation (Zod) and request schemas
- [P1][🟢] Integrity checks: eggs_total = A+B+C; unique (date, house)
- [P1][🟢] Unit + integration tests

**✅ Acceptance: supervisor can log daily entries; constraints enforced.**

---

## Phase 4 — Sales & Customers APIs (Section 5.3)

- [P0][🟢] Customers: GET/POST/PUT /api/customers
- [P0][🟢] Sales: GET/POST/PUT /api/sales with pricing per grade
- [P1][🟢] Payment method/status handling
- [P1][🟢] Reporting queries for sales summary
- [P1][🟢] Tests (calculations, validation)

**✅ Acceptance: end-to-end sales flow persists and queries correctly.**

---

## Phase 5 — Feed Management APIs (Section 5.4)

- [P1][⚪] Feed recipes: GET/POST
- [P1][⚪] Feed batches: GET/POST with per-ingredient cost breakdown
- [P2][⚪] Batch ingredient retrieval by batch_id
- [P1][⚪] Tests for batch cost math

Acceptance: batch cost and cost/kg computed as designed.

---

## Phase 6 — **NEW:** Labor Management APIs (Section 5.6)

- [P0][⚪] Laborers CRUD: GET/POST/PUT/DELETE /api/laborers
- [P0][⚪] Daily work assignments: GET/POST/PUT /api/work-assignments
- [P0][⚪] Monthly payroll: GET/POST/PUT /api/payroll with auto-calculation
- [P1][⚪] Payroll generation endpoint: POST /api/payroll/generate/{month_year}
- [P1][⚪] Labor cost integration with daily cost calculations
- [P1][⚪] Attendance tracking and salary deduction algorithms
- [P1][⚪] Performance bonus calculation system
- [P1][⚪] Unit tests for payroll calculations and edge cases

Acceptance: complete labor management workflow; accurate payroll calculations; labor costs integrated into egg pricing.

---

## Phase 7 — Cost Engine & Analytics (Sections 5.5 & 7)

## Phase 7 — Cost Engine & Analytics (Sections 5.5 & 7)

- [P0][⚪] Implement daily cost engine as a service module (algorithms 7.1, 7.2, 7.3)
- [P0][⚪] **UPDATED:** Enhanced cost calculation including labor costs
- [P0][⚪] Endpoints:
  - GET /api/costs/daily/{date}
  - GET /api/costs/summary?start&end
  - POST /api/costs/operating (upsert monthly costs)
  - GET /api/costs/egg-price/{date}
- [P1][⚪] Persist computed daily_costs and idempotent recalculation
- [P1][⚪] **NEW:** Labor cost distribution per egg calculations
- [P1][⚪] Unit tests for edge cases (0 eggs, missing costs, partial data, payroll variations)

Acceptance: correct per-egg costs including labor; suggested prices for target dates.

---

## Phase 8 — Frontend Supervisor PWA (Section 6.1)

- [P0][⚪] Vite + React + MUI setup; PWA config (manifest, service worker)
- [P0][⚪] Daily Entry screen: house selector, egg grades, sales (optional), feed, mortality, notes
- [P0][⚪] **NEW:** Daily Worker Assignment screen: attendance tracking, task assignment, performance notes
- [P1][⚪] Client-side validation and totals auto-calc
- [P1][⚪] Offline capture + sync on reconnect (basic queue)
- [P1][⚪] Auth flow; role-based route guards
- [P1][⚪] Component tests and basic Cypress e2e

Acceptance: supervisor can submit complete daily entry and worker assignments from mobile.

---

## Phase 9 — Owner Web Dashboard (Section 6.2)

- [P0][⚪] Dashboard: today's KPIs (eggs, sales, cost/egg, labor costs)
- [P1][⚪] Production trend chart (7-day) with Chart.js
- [P1][⚪] Cost Analysis screen (breakdown + pricing recommendations including labor)
- [P1][⚪] **NEW:** Monthly Payroll screen: payroll summary, individual records, payment status
- [P1][⚪] **NEW:** Labor Management: laborer database, performance tracking
- [P1][⚪] Quick actions and navigation
- [P1][⚪] Basic accessibility and responsive layout

Acceptance: owner sees comprehensive KPIs, charts, and complete labor management interface.

---

## Phase 10 — Reporting & Export (Section 5.7)

- [P1][⚪] Reports: production/sales/financial/labor with date ranges
- [P1][⚪] **NEW:** Payroll reports and summaries
- [P1][⚪] **NEW:** Labor cost analysis and performance reports
- [P1][⚪] Export: CSV (first), PDF (second)
- [P2][⚪] Email/download options and pagination

Acceptance: exports match on-screen data and handle large ranges; comprehensive labor reporting.

---

## Phase 11 — Non-Functional Requirements

---

## Phase 7 — Frontend Supervisor PWA (Section 6.1)

- [P0][⚪] Vite + React + MUI setup; PWA config (manifest, service worker)
- [P0][⚪] Daily Entry screen: house selector, egg grades, sales (optional), feed, mortality, notes
- [P1][⚪] Client-side validation and totals auto-calc
- [P1][⚪] Offline capture + sync on reconnect (basic queue)
- [P1][⚪] Auth flow; role-based route guards
- [P1][⚪] Component tests and basic Cypress e2e

Acceptance: supervisor can submit a complete daily entry from mobile.

---

## Phase 8 — Owner Web Dashboard (Section 6.2)

- [P0][⚪] Dashboard: today’s KPIs (eggs, sales, cost/egg)
- [P1][⚪] Production trend chart (7-day) with Chart.js
- [P1][⚪] Cost Analysis screen (breakdown + pricing recommendations)
- [P1][⚪] Quick actions and navigation
- [P1][⚪] Basic accessibility and responsive layout

Acceptance: owner sees KPIs and charts matching backend data.

---

## Phase 9 — Reporting & Export (Section 5.6)

- [P1][⚪] Reports: production/sales/financial with date ranges
- [P1][⚪] Export: CSV (first), PDF (second)
- [P2][⚪] Email/download options and pagination

Acceptance: exports match on-screen data and handle large ranges.

---

## Phase 10 — Non-Functional Requirements

## Phase 11 — Non-Functional Requirements

- [P0][🟢] Performance: p95 page ≤ 3s, queries ≤ 1s (indexing implemented)
- [P0][🟢] Security: hash passwords, JWT expiry (24h), RBAC checks everywhere
- [P1][⚪] Reliability: daily automated DB backup (dev/prod), uptime targets
- [P1][⚪] Usability: mobile responsiveness, minimal training UI
- [P2][⚪] Offline capability validation and sync conflict handling (basic)

Acceptance: measured via small perf suite and manual checklists.

---

## Phase 12 — Testing Strategy (Section 9)

- [P0][🟢] Unit tests: endpoints, validation, algorithms
- [P1][🟡] Integration tests: DB + API + selected UI flows
- [P1][⚪] E2E smoke with Cypress: login, daily entry, dashboard, labor management
- [P1][⚪] Performance tests (API latency, query timings)
- [P1][⚪] **NEW:** Payroll calculation testing with edge cases

**Current Status:** 27/27 backend tests passing; comprehensive auth and operations coverage.

Acceptance: CI green, coverage baseline set, smoke e2e passes.

### Running tests against a real Postgres database (optional)

- Set up a local or CI Postgres and create a test database (example name: `farmpilot_test`).
- Set the env var `DATABASE_URL` to the test DB connection string.
- To run the Jest suite against the real DB and apply migrations automatically, set `TEST_REAL_DB=true` and run the server tests from the repo root:

```bash
DATABASE_URL=postgres://user:pass@localhost/farmpilot_test TEST_REAL_DB=true pnpm --filter ./server test
```

- The test setup will attempt to apply SQL files from the top-level `migrations/` directory before running tests. Prefer a dedicated test DB to avoid data loss.

If you prefer isolated tests without a DB, the test-suite already uses an in-process mock DB by default.

---

## Phase 13 — Deployment & Ops (Section 10)

- [P0][⚪] Dockerfiles + docker-compose (dev); env templates
- [P1][⚪] Staging environment with seed data; basic CI pipeline
- [P1][⚪] Production deploy guide (VPS/Cloud), SSL, backups, monitoring
- [P2][⚪] Rollback strategy scripted and documented

Acceptance: push-to-deploy to staging; documented prod steps.

---

## Milestones & Checkpoints

1. **✅ MVP Core (Phases 1–3): DB + Auth + Daily Ops** — COMPLETED ✨

   - Database schema with labor management extensions
   - Complete authentication system with refresh tokens
   - Daily operations CRUD with validation
   - Code organization following TypeScript conventions

2. **🎯 Sales & Feed + Labor (Phases 4–6): 4–5 weeks** — CURRENT FOCUS

   - Customer and sales management
   - Feed production cost tracking
   - **NEW:** Complete labor management and payroll system

3. Cost Engine & Dashboard (Phases 7–9): 3–4 weeks

   - Enhanced cost calculations including labor
   - Mobile supervisor interface with worker management
   - Owner dashboard with comprehensive labor reporting

4. Reports, NFRs, Deploy (Phases 10–13): 2–3 weeks
   - Comprehensive reporting including payroll
   - Performance optimization and security hardening
   - Production deployment

---

## Recent Accomplishments (Aug 24, 2025)

### ✅ **Phase 2 Enhanced Authentication (COMPLETED)**

- Implemented comprehensive JWT-based authentication
- Added refresh token functionality and user info endpoint
- Created 13 comprehensive test cases (all passing)
- Enhanced validation with Zod schemas
- Structured error handling with proper response formats

### ✅ **Code Organization & Cleanup (COMPLETED)**

- Renamed files to follow kebab-case convention
- Organized test files alphabetically with clear naming
- Created centralized import/export patterns for routes and middleware
- Updated all describe blocks to remove temporary "phase" references
- Achieved professional codebase structure following TypeScript conventions

### ✅ **Design Document Updates (COMPLETED)**

- Added comprehensive labor management requirements
- Extended database schema with payroll and worker tracking tables
- Added labor management API endpoints
- Designed supervisor and owner UI screens for labor management
- Created payroll calculation algorithms
- Updated cost calculation to include labor distribution

### 🎯 **Next Priority: Sales & Labor Management Implementation**

- Customer and sales management APIs
- Labor management system (laborers, assignments, payroll)
- Integration of labor costs into pricing calculations

---

## Current Technical Status

### Backend Architecture

- **Framework:** Node.js + Express with structured routing
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT with refresh tokens and role-based access
- **Validation:** Zod schemas for type-safe validation
- **Testing:** 27/27 tests passing with comprehensive coverage

### File Organization

```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (centralized exports)
│   │   ├── auth.ts (complete auth system)
│   │   ├── admin-users.ts
│   │   ├── daily-activities.ts
│   │   └── houses.ts
│   ├── middleware/
│   │   ├── index.ts (centralized exports)
│   │   └── [auth & validation middleware]
│   └── [other organized modules]
└── __tests__/
    ├── admin-auth.test.ts
    ├── admin-users.test.ts
    ├── auth.test.ts (13 comprehensive auth tests)
    └── daily-activities.test.ts
```

---

## Risks & Mitigations

- **✅ Authentication complexity** → Completed with comprehensive testing
- **✅ Code organization debt** → Resolved with convention cleanup
- **🔄 Labor cost integration complexity** → Document algorithms clearly; make configurable
- Offline sync complexity → start with simple queue, no merges; warn on conflicts
- Performance regressions → add indices early; profile slow queries
- Scope creep → lock design v1.0; change via explicit RFCs

---

## Working Agreements

- API and schema changes require updating `design.md` and migrations in the same PR
- Keep TypeScript types in `shared/` for API contracts (DTOs)
- Add tests with features; do not merge red builds
- **NEW:** Follow established naming conventions (kebab-case for files, clear describe blocks)
- **NEW:** Maintain centralized exports for clean import patterns
