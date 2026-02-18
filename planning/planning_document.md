# Contract Commitment Analyzer Implementation Plan

## Overview

Build a minimal contract commitment analyzer using PostgreSQL (hosted on Supabase), a Python Flask API, and a React + TypeScript SPA. The implementation should stay intentionally small, focus on correctness of commitment math, and satisfy all assignment requirements without over-engineering.

## Final Stack Decision

- Database: PostgreSQL on Supabase
- Backend API: Flask
- Frontend: React + TypeScript
- Frontend testing reference: Vitest (no Jest)

## Current State Analysis

- Data files are present:
  - `aws_billing_data.csv` (billing events)
  - `spend_commitments.json` (commitment definitions + checkins)
- Requirements are documented in `instructions.md`.
- Architecture research and framework tradeoffs are documented in `research_document.md`.
- No app scaffold or API/UI implementation is present yet.

## Desired End State

After implementation, the project should provide:

1. A repeatable ingestion process that loads CSV billing data into Supabase Postgres.
2. A Flask API that:
   - Lists companies
   - Returns commitments for a selected company
   - Returns commitment detail with period-by-period checkin evaluation
3. A React/TypeScript SPA that:
   - Lets user switch current company
   - Shows all commitments for that company
   - Shows detail view for one commitment including shortfalls and period windows
4. A team-readable README that explains setup, assumptions, tradeoffs, and future improvements.

### Verification of End State

- All required endpoints return valid JSON for sample companies.
- UI supports company switching and commitment drill-down.
- Checkin calculations correctly show met/missed, actual spend, and shortfall.
- Setup and run steps work from a clean clone.

## What We Are NOT Doing

- Authentication/authorization
- Production-grade security hardening
- Performance optimization beyond basic sensible indexing
- Complex forecasting model (use simple transparent trajectory/status logic)
- Full CI/CD pipeline setup

## Implementation Approach

Use a "math-first" approach:

1. Define schema and ingestion flow.
2. Implement and validate commitment evaluation logic in backend service code.
3. Expose stable API contracts.
4. Build thin UI over those contracts.
5. Document assumptions and operation clearly.

This keeps risk concentrated in one place (commitment period evaluation) and avoids unnecessary framework complexity.

## Phase 1: Project Scaffold and Data Foundations

### Overview

Create initial backend/frontend structure, configure Supabase Postgres connection, and implement billing data ingestion.

### Changes Required

#### Backend scaffold
- Create `backend/` with:
  - Flask app entrypoint
  - Config loader (`SUPABASE_URL`, `SUPABASE_KEY`, database connection vars if needed)
  - Basic health endpoint (`GET /api/health`)

#### Database setup
- Define `billing_events` table:
  - `id` bigserial primary key
  - `company` text
  - `aws_service` text
  - `event_time` timestamptz
  - `gross_cost` numeric(12,2)
- Add index on `(company, aws_service, event_time)`.

#### Ingestion script
- Add `backend/scripts/load_billing_data.py`:
  - Reads `aws_billing_data.csv`
  - Parses datetime and amount safely
  - Writes rows to Postgres (Supabase)
  - Supports truncate-and-reload mode for simplicity

### Success Criteria

#### Automated Verification
- [x] Dependencies install successfully for backend.
- [x] Table creation script executes without errors (dry run).
- [ ] Ingestion script runs and inserts billing rows. *(requires valid `SUPABASE_DB_URL`)*
- [x] API health endpoint responds `200`.

#### Manual Verification
- [ ] Row counts in DB are non-zero and plausible.
- [ ] Spot-check a few ingested records against CSV values.
- [ ] Environment setup steps are understandable from README draft notes.

## Phase 2: Commitment Evaluation Service and API

### Overview

Implement backend business logic that evaluates checkins against spend and expose endpoints required by the UI.

### Changes Required

#### Commitment source adapter
- Load commitments from `spend_commitments.json` at runtime (simple path for project scope).

#### Evaluation service
- Add service module to compute per-checkin:
  - committed amount
  - actual spend in `[start, end)`
  - met flag
  - shortfall and surplus
  - status (`past`, `current`, `future`)

#### API endpoints
- `GET /api/companies`
- `GET /api/companies/{company}/commitments`
- `GET /api/companies/{company}/commitments/{commitment_id}`

### Success Criteria

#### Automated Verification
- [ ] Endpoint-level tests pass for expected happy paths.
- [ ] Endpoint-level tests pass for invalid company/commitment inputs.
- [ ] Numeric values are serialized correctly (currency-safe formatting rules applied consistently).

#### Manual Verification
- [ ] API responses are easy to consume from frontend.
- [ ] For a sampled commitment, manually verify one checkin's shortfall calculation from raw data.
- [ ] Current/future/past status values look correct based on checkin dates.

## Phase 3: React + TypeScript SPA

### Overview

Implement a minimal but clear UI that solves the required user problems.

### Changes Required

#### Frontend scaffold
- Create `frontend/` with React + TypeScript app.
- Configure API base URL via environment variable.

#### UI flow
- Company selector (global state for current company)
- Commitments list for selected company
- Commitment detail panel/table:
  - checkin periods
  - committed vs actual
  - met/missed status
  - shortfall amount

#### UX details
- Show clear currency formatting.
- Highlight missed commitments.
- Keep navigation simple (single-page master-detail layout).

### Success Criteria

#### Automated Verification
- [ ] Frontend builds successfully.
- [ ] Core UI behavior tests run with **Vitest**.
- [ ] No use of Jest in test setup or scripts.

#### Manual Verification
- [ ] Company can be switched and commitment list updates correctly.
- [ ] Selecting a commitment updates detail pane.
- [ ] User can clearly identify periods, commitments met/missed, and shortfall totals.

## Phase 4: README, Polish, and Demo Readiness

### Overview

Finalize project documentation and ensure the implementation is easy to run and evaluate.

### Changes Required

#### README
- Add:
  - project overview
  - architecture and stack choices (explicitly: PostgreSQL hosted on Supabase)
  - setup/run instructions for backend/frontend
  - environment variables
  - data ingestion steps
  - assumptions
  - what would change in production
  - what would change for 100x dataset
  - UI/UX rationale and alternatives considered

#### Final polish
- Improve API error messages for common failures.
- Ensure all scripts/commands are consistent and documented.

### Success Criteria

#### Automated Verification
- [ ] Frontend tests (Vitest) pass.
- [ ] Backend tests/scripts run successfully.
- [ ] App starts cleanly with documented commands.

#### Manual Verification
- [ ] A reviewer can follow README from scratch and run the app.
- [ ] End-to-end workflow is demonstrable in under 5 minutes.
- [ ] Scope remains intentionally small and understandable.

## Testing Strategy

### Backend
- Focus on deterministic business-logic tests for checkin evaluation.
- Add endpoint tests for company and commitment routes.
- Include edge cases:
  - no spend for checkin window
  - exact commitment match
  - over-commit spend (surplus)
  - boundary timestamp at checkin start/end

### Frontend
- Use Vitest for component behavior and data-flow tests.
- Validate:
  - company selection state updates
  - commitment list rendering
  - detail panel rendering for selected commitment

### Manual Testing

1. Load database via ingestion script.
2. Start backend and frontend.
3. Switch among multiple companies.
4. Open different commitments and compare displayed checkin values with API output.
5. Validate at least one known shortfall case from source data.

## Risks and Mitigations

- Risk: Date boundary bugs in checkin aggregation.
  - Mitigation: Use clear `[start, end)` rule and test boundaries explicitly.
- Risk: Numeric rounding/currency display inconsistencies.
  - Mitigation: Keep numeric precision in backend and consistent formatting in frontend.
- Risk: Overbuilding beyond assignment scope.
  - Mitigation: Stick to four phases and "not doing" list.

## Execution Checklist

- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] README finalized
- [ ] Demo-ready walkthrough confirmed
