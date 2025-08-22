# Rebuild Plan — Align Implementation to Design v1.0

Date: 2025-08-22

Objective: Scrap the current implementation and rebuild according to `design.md` while preserving only what is useful for tooling (e.g., Cypress runner, linting) if it doesn’t conflict.

---

## Requirements coverage

- Use the current design (design.md) as the single source of truth
- Scrap current implementation (archive/disable old code paths)
- Provide a clear, trackable task list in Markdown

Status key: [P0]=Critical, [P1]=High, [P2]=Normal | [🟢]=Done [🟡]=In-Progress [⚪]=Todo

---

## Phase 0 — Preparation & Reset

- [P0][⚪] Create rebuild branch `rebuild/design-v1` and protect `main`
- [P0][⚪] Snapshot current repo: tag `pre-rebuild-<date>` and archive `client/` + `server/` to `legacy/`
- [P0][⚪] Keep only infra that still helps (Cypress, Tailwind config if reused, CI); note deviations in this doc
- [P0][⚪] Decide lib choices that must match design:
  - Backend: Node.js + Express, JWT, Joi
  - DB: PostgreSQL, migrations (choose: Prisma or Drizzle or Knex) — pick one and standardize
  - Frontend: React + Material UI, Chart.js, PWA
- [P0][⚪] Introduce `docker-compose` for Postgres + app (dev)

Deliverable: clean scaffold, legacy archived, decision notes committed.

---

## Phase 1 — Database & Migrations (from Section 4)

- [P0][⚪] Initialize migration tool (Prisma/Drizzle/Knex) and DB connection
- [P0][⚪] Implement schema tables:
  - users, houses, daily_logs, customers, sales
  - feed_recipes, feed_batches, batch_ingredients
  - operating_costs, bird_costs, daily_costs
- [P1][⚪] Add indexes and constraints (checks from design)
- [P1][⚪] Seed scripts: minimal owner user + sample house
- [P1][⚪] Add SQL sanity tests (migration up/down, constraint checks)

Acceptance: migrations apply on fresh DB; constraints enforce invariants; seed runs.

---

## Phase 2 — Backend Auth & RBAC (Section 5.1, 2.1.1)

- [P0][⚪] Express app scaffold with structured routing and error handling
- [P0][⚪] Auth endpoints: POST /api/auth/login, /refresh, /logout
- [P0][⚪] JWT issuance/verification; password hashing; session timeout
- [P1][⚪] Role-based middleware (owner, supervisor)
- [P1][⚪] Validation with Joi for all auth payloads
- [P1][⚪] Unit tests for auth + role guard

Acceptance: login works; protected routes enforce roles; tests pass.

---

## Phase 3 — Daily Operations APIs (Section 5.2)

- [P0][⚪] CRUD for daily logs: GET/POST/PUT/DELETE /api/daily-logs
- [P0][⚪] Houses: GET/POST /api/houses
- [P1][⚪] Input validation (Joi) and request schemas
- [P1][⚪] Integrity checks: eggs_total = A+B+C; unique (date, house)
- [P1][⚪] Unit + integration tests

Acceptance: supervisor can log daily entries; constraints enforced.

---

## Phase 4 — Sales & Customers APIs (Section 5.3)

- [P0][⚪] Customers: GET/POST/PUT /api/customers
- [P0][⚪] Sales: GET/POST/PUT /api/sales with pricing per grade
- [P1][⚪] Payment method/status handling
- [P1][⚪] Reporting queries for sales summary
- [P1][⚪] Tests (calculations, validation)

Acceptance: end-to-end sales flow persists and queries correctly.

---

## Phase 5 — Feed Management APIs (Section 5.4)

- [P1][⚪] Feed recipes: GET/POST
- [P1][⚪] Feed batches: GET/POST with per-ingredient cost breakdown
- [P2][⚪] Batch ingredient retrieval by batch_id
- [P1][⚪] Tests for batch cost math

Acceptance: batch cost and cost/kg computed as designed.

---

## Phase 6 — Cost Engine & Analytics (Sections 5.5 & 7)

- [P0][⚪] Implement daily cost engine as a service module (algorithms 7.1, 7.2)
- [P0][⚪] Endpoints:
  - GET /api/costs/daily/{date}
  - GET /api/costs/summary?start&end
  - POST /api/costs/operating (upsert monthly costs)
  - GET /api/costs/egg-price/{date}
- [P1][⚪] Persist computed daily_costs and idempotent recalculation
- [P1][⚪] Unit tests for edge cases (0 eggs, missing costs, partial data)

Acceptance: correct per-egg costs and suggested prices for target dates.

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

- [P0][⚪] Performance: p95 page ≤ 3s, queries ≤ 1s (indexing, caching later if needed)
- [P0][⚪] Security: hash passwords, JWT expiry (24h), RBAC checks everywhere
- [P1][⚪] Reliability: daily automated DB backup (dev/prod), uptime targets
- [P1][⚪] Usability: mobile responsiveness, minimal training UI
- [P2][⚪] Offline capability validation and sync conflict handling (basic)

Acceptance: measured via small perf suite and manual checklists.

---

## Phase 11 — Testing Strategy (Section 9)

- [P0][⚪] Unit tests: endpoints, validation, algorithms
- [P1][⚪] Integration tests: DB + API + selected UI flows
- [P1][⚪] E2E smoke with Cypress: login, daily entry, dashboard
- [P1][⚪] Performance tests (API latency, query timings)

Acceptance: CI green, coverage baseline set, smoke e2e passes.

---

## Phase 12 — Deployment & Ops (Section 10)

- [P0][⚪] Dockerfiles + docker-compose (dev); env templates
- [P1][⚪] Staging environment with seed data; basic CI pipeline
- [P1][⚪] Production deploy guide (VPS/Cloud), SSL, backups, monitoring
- [P2][⚪] Rollback strategy scripted and documented

Acceptance: push-to-deploy to staging; documented prod steps.

---

## Milestones & Checkpoints

1. MVP Core (Phases 1–3): DB + Auth + Daily Ops — 4–6 weeks
2. Sales & Feed (Phases 4–5): 3–4 weeks
3. Cost Engine & Dashboard (Phases 6–8): 2–3 weeks
4. Reports, NFRs, Deploy (Phases 9–12): 2–3 weeks

---

## Risks & Mitigations

- Ambiguity in cost assumptions → document constants and make configurable
- Offline sync complexity → start with simple queue, no merges; warn on conflicts
- Performance regressions → add indices early; profile slow queries
- Scope creep → lock design v1.0; change via explicit RFCs

---

## Working Agreements

- API and schema changes require updating `design.md` and migrations in the same PR
- Keep TypeScript types in `shared/` for API contracts (DTOs)
- Add tests with features; do not merge red builds
