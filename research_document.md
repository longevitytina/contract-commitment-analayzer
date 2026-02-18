---
date: 2026-02-17T23:14:55Z
researcher: Cursor Assistant
git_commit: not-available
branch: not-available
repository: contract-commitment-analyzer
topic: "Mini contract commitment analyzer implementation research"
tags: [research, architecture, python-api, postgres, supabase, react-typescript, framework-selection]
status: complete
last_updated: 2026-02-17
last_updated_by: Cursor Assistant
---

# Research: Mini Contract Commitment Analyzer

**Date**: 2026-02-17T23:14:55Z  
**Researcher**: Cursor Assistant  
**Git Commit**: not-available (workspace is not currently a git repository)  
**Branch**: not-available  
**Repository**: contract-commitment-analyzer  

## Research Question

Given the requirements in `instructions.md`, what is the best implementation approach for a small contract commitment analyzer, and which Python backend framework should be used (for example Flask or Django)?

## Summary

For this scope (3-5 hour toy app, one-page SPA, no auth/perf/security requirements), the best fit is a lightweight Python API with minimal boilerplate and explicit business logic around commitment checkins.

Backend recommendation:
- Primary choice: **Flask** for simplicity and low setup cost.
- Also viable: **FastAPI** if typed request/response models and auto API docs are desired.
- Least suitable for this assignment: **Django**, because the built-in ORM/admin/auth ecosystem is useful in larger apps but likely overkill here.
- Database platform option: **Supabase (managed Postgres)** works well for faster setup and tooling.

## Requirements Interpreted from Instructions

1. Load billing CSV into Postgres.
2. Build Python API + React/TypeScript SPA.
3. Support company switch and commitment drill-down.
4. Show:
   - current performance vs commitments,
   - future trajectory,
   - shortfall totals,
   - period-by-period checkin evaluation details.
5. Include a clear team-style README covering setup, assumptions, tradeoffs, and future work.

## Data Findings and Implications

From `aws_billing_data.csv`:
- Columns are `company`, `aws_service`, `datetime`, `gross_cost`.
- Spend events are timestamped at sub-daily granularity.
- Multiple services per company and many rows (thousands) imply aggregation queries are central.

From `spend_commitments.json`:
- Commitments include `id`, `name`, `company`, `service`, and multiple `checkins`.
- Checkins contain `[start, end, amount]` ranges that require date-window aggregation.
- Periods can be monthly, quarterly, or custom; logic must not assume a fixed cadence.

Design implication:
- The most important backend logic is deterministic checkin evaluation:
  - sum spend for `company + service + [start, end)`,
  - compare to committed amount,
  - compute `met`, `surplus`, `shortfall`,
  - compute trajectory for in-progress/future periods.

## Backend Framework Considerations

### Flask
Pros:
- Very small surface area and quick setup.
- Easy to keep business logic explicit in plain Python modules.
- Ideal for assignment scope and timeline.

Cons:
- No built-in request schema validation unless adding libraries.
- Less guided structure than Django for larger teams.

Best fit when:
- You want to move fast with minimal framework overhead.

### Django
Pros:
- Robust ORM, migrations, admin, and mature app structure.
- Good long-term maintainability for bigger products.

Cons:
- More setup and conventions than needed for this small assignment.
- Includes subsystems (auth/admin/templates) that are non-requirements here.

Best fit when:
- You expect a larger, longer-lived product with more domains and users.

### FastAPI (additional option)
Pros:
- Strong typing and pydantic models improve correctness.
- Automatic OpenAPI docs help during API iteration.
- Still relatively lightweight.

Cons:
- Slightly more upfront design for schemas.
- Async model may add complexity if not needed.

Best fit when:
- You want strict contracts between backend and frontend with low friction.

### Supabase (database/platform option)
Pros:
- Managed Postgres with quick provisioning, backups, and dashboard visibility.
- Can use `supabase-py`/REST instead of writing all SQL client plumbing.
- Useful if you want hosted DB plus optional generated APIs.

Cons:
- Adds external service dependency and project configuration.
- For complex analytics queries, you may still write SQL or use direct Postgres access.
- If using Supabase client APIs only, some server-side query patterns may be less ergonomic than direct SQL.

Best fit when:
- You want Postgres with minimal operational overhead and faster environment setup.

## Recommendation

Use **Flask + Supabase (Postgres)** for this exercise.

Why:
- Fastest path to deliver required functionality within expected effort.
- Keeps implementation focused on commitment-calculation correctness.
- Avoids the extra setup and conceptual load of a full Django project.
- Keeps database operations simple while leveraging managed Postgres infrastructure.

If you prefer stronger schema guarantees, choose FastAPI instead of Flask; both are better aligned than Django for the current scope.

Data access note:
- If you use Supabase client APIs for reads/writes, it can replace most of `SQLAlchemy + psycopg` in app code.
- If you need heavier ingestion or custom SQL performance tuning, direct Postgres access (via `psycopg`/SQLAlchemy) can still be used against the same Supabase database.

## Proposed Minimal Architecture

### Database (Postgres)
- Table: `billing_events`
  - `id` (bigserial pk)
  - `company` (text, indexed)
  - `aws_service` (text, indexed)
  - `event_time` (timestamptz, indexed)
  - `gross_cost` (numeric(12,2))
- Composite index: `(company, aws_service, event_time)`
- Hosting option: run this schema on Supabase Postgres.

### Ingestion Script
- Python script reads CSV and writes to `billing_events` (either via `supabase-py` or direct Postgres connection).
- Parse datetime once, batch writes (for speed and simplicity).
- Idempotency options:
  - truncate-and-load for toy app simplicity, or
  - unique constraint + upsert if needed.

### API Endpoints (example)
- `GET /api/companies`
- `GET /api/companies/{company}/commitments`
- `GET /api/companies/{company}/commitments/{commitment_id}`
- `GET /api/companies/{company}/dashboard` (optional aggregate summary)

Response payloads should include for each checkin:
- committed amount,
- actual spend,
- met boolean,
- surplus/shortfall,
- status (`past`, `current`, `future`),
- progress ratio for current/future periods.

### Frontend (React + TypeScript)
- Layout:
  - company selector,
  - commitment list with status chips,
  - detail panel/table for selected commitment checkins.
- Prioritize clarity:
  - show shortfall in currency,
  - explicit date windows,
  - progress bars for upcoming/active periods.

## UI/UX Direction and Alternatives

Preferred UI:
- Master-detail dashboard because it optimizes comparison across commitments while preserving deep detail for one commitment.

Why this UX:
- Matches user tasks in the prompt: monitor current status, inspect period-by-period shortfalls, and plan future spend adjustments.

Alternative considered:
- Separate pages for list and detail views.
- Rejected for this scope because context switching slows analysis and adds routing complexity without strong benefit.

## Implementation Plan (Small-Scope)

1. Create Postgres schema and ingestion script.
2. Implement commitment evaluation service (pure Python functions).
3. Build API endpoints that call service logic and format responses.
4. Build React UI with company switcher + commitment list + detail view.
5. Write README with setup, assumptions, decisions, and future enhancements.

## Assumptions

- Commitment JSON remains source-of-truth and can be loaded at runtime.
- Currency values are treated as decimal USD amounts.
- Checkin intervals are interpreted as `[start, end)` for aggregation.
- Datetime values are treated consistently in UTC.
- No auth and no multi-tenant security boundaries are required.

## Production and 100x Scale Considerations

For production:
- Persist commitments in Postgres and version them.
- Add validation, error handling, auditability, and role-based auth.
- Add tests around commitment math and boundary dates.

For 100x data:
- Partition `billing_events` by time.
- Pre-aggregate daily spend by company/service.
- Cache expensive aggregates and move heavy recalculations to background jobs.

## Open Questions

- Should commitments also be imported into Postgres for easier joins/versioning?
- Should the app support filtering by custom time windows beyond checkins?
- How should partially complete current-period projections be modeled (linear projection vs historical baseline)?

## Code References

- `instructions.md` - project requirements, constraints, and expected README topics.
- `aws_billing_data.csv` - billing event schema and sample spend patterns.
- `spend_commitments.json` - commitment/checkin schema and evaluation periods.
