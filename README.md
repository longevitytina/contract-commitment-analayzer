# Contract Commitment Analyzer

Small full-stack app for evaluating AWS spend commitments by company. It loads
billing events into Postgres, evaluates contractual checkins against actual
spend, and presents summaries/details in a React UI.

## Architecture and Stack

- Database: PostgreSQL (hosted on Supabase)
- Backend: Python + Flask + `psycopg`
- Frontend: React + TypeScript + Vite
- Frontend tests: Vitest (no Jest)

## Project Structure

- `backend/`
  - `app/` Flask app, evaluation logic, and DB repository utilities
  - `scripts/` DB schema init and CSV ingestion scripts
  - `sql/schema.sql` table/index definitions
- `frontend/`
  - `src/` UI, API client, and tests
- `aws_billing_data.csv` billing source data
- `spend_commitments.json` commitment/checkin source data

## Setup

Run commands from repository root unless noted.

### 1) Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2) Backend environment variables

```bash
cp backend/.env.template backend/.env
```

Set `SUPABASE_DB_URL` in `backend/.env`:
(Tina should have provided a secure link for .env file)
```env
FLASK_ENV=development
FLASK_RUN_PORT=8000
SUPABASE_DB_URL=postgresql://...:5432/postgres?sslmode=require
```

### 3) Initialize and load database

```bash
python backend/scripts/init_db.py
python backend/scripts/load_billing_data.py --truncate
```

### 4) Run backend API

```bash
python backend/run.py
```

### 5) Run frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Vite defaults to `http://localhost:5173` and proxies `/api` to backend.

## API Endpoints

- `GET /api/health`
- `GET /api/companies`
- `GET /api/companies/{company}/commitments`
- `GET /api/companies/{company}/commitments/{commitment_id}`

Common error behavior:
- `404` for unknown company/commitment
- `503` when database is unavailable
- `500` for unexpected internal errors

## Verification Commands

### Backend checks

```bash
python backend/scripts/init_db.py --dry-run
python -m unittest discover -s backend/tests -v
```

### Frontend checks

```bash
cd frontend
npm test
npm run build
```

### Manual API smoke tests

```bash
curl -s http://127.0.0.1:8000/api/health | python3 -m json.tool
curl -s http://127.0.0.1:8000/api/companies | python3 -m json.tool
curl -s http://127.0.0.1:8000/api/companies/cyberdyne/commitments | python3 -m json.tool
curl -s http://127.0.0.1:8000/api/companies/cyberdyne/commitments/1 | python3 -m json.tool
```

## Assumptions

- Commitment definitions remain in `spend_commitments.json` at runtime.
- Billing data is loaded into Postgres before app usage.
- Currency values are treated as decimal USD amounts.
- Checkin windows use `[start, end)` date boundaries.
- UTC timestamps are used consistently.
- Auth/security hardening is intentionally out of scope for this assignment.

## UI/UX Rationale

Implemented a single-page master-detail layout:
- company selector for context switching,
- commitment list for at-a-glance status and shortfall,
- detail table for period-by-period verification.

Why this was chosen:
- Solves assignment user stories directly (status, shortfalls, periods).
- Minimizes navigation overhead for comparison.
- Keeps implementation small while remaining readable.

Alternative considered:
- separate list/detail pages, but this added routing complexity and slowed
  analysis flow for little benefit in a toy app.

## If Rebuilding from Scratch

- Add clearer backend error envelopes with machine-readable error codes.
- Add deterministic fixture-based integration tests against a local Postgres
  container.
- Add frontend loading skeletons and user-facing retry actions for API failures.

## Production-Version Changes

- Move commitments into versioned DB tables (instead of runtime JSON file).
- Add authentication and role-based access control.
- Add structured logging, metrics, tracing, and alerting.
- Add migration workflow and deployment pipeline.
- Add stronger input validation and API schema contracts.

## 100x Data Scale Changes

- Partition billing events by date.
- Create pre-aggregated daily spend tables by company/service.
- Use materialized views or batch jobs for commitment rollups.
- Cache frequently requested company/commitment summaries.
- Introduce async job processing for expensive recomputations.
