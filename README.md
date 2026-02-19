# Contract Commitment Analyzer

Small full-stack app for evaluating AWS spend commitments by company. It loads
billing events into Postgres, evaluates contractual checkins against actual
spend, and presents summaries/details in a React UI.

## Architecture and Stack

- Database: PostgreSQL (local instance)
- Backend: Python + Flask + psycopg
- Frontend: React + TypeScript + Vite + Tailwind CSS

## Project Structure

- `backend/`
  - `app/` Flask app, evaluation logic, and DB repository utilities
  - `scripts/` DB schema init and CSV database loading scripts
  - `sql/schema.sql` table/index definitions
- `frontend/`
  - `src/` UI, API client, and tests
- `data/aws_billing_data.csv` billing source data
- `data/spend_commitments.json` commitment/checkin source data

## Setup


> [!TIP]
> Run commands from repository root unless noted.
> Keep one terminal for the backend and one for the frontend so manual API checks and UI verification are easier.

### 1) Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2) Start local PostgreSQL on your computer

If Postgres is installed locally, start the service and create the `commitments` database:

Example for macOS & Brew:
```bash
brew services start postgresql
createdb commitments
```

### 3) Backend environment variables

Create `backend/.env`:
```env
FLASK_ENV=development
FLASK_RUN_PORT=8000
DATABASE_URL=postgresql://<your_local_db_user>@localhost:5432/commitments
```

> [!TIP]
> If you created the database with `createdb commitments`, your DB user is usually your local account name. You can confirm it with `psql -d commitments -c "select current_user;"`.

### 4) Initialize and load database
> [!TIP]
> Truncate the database before loading new data - avoids duplicate data on repeated loads, gives a clean, deterministic dataset each run.

```bash
python backend/scripts/init_db.py
python backend/scripts/load_billing_data.py --truncate
```

> [!WARNING]
> If you see `FATAL: role "postgres" does not exist`, your `DATABASE_URL` is using the wrong user. Update it to an existing local PostgreSQL role (usually your local account user).

### 5) Run backend API

```bash
python backend/run.py
```

### 6) Run frontend (new terminal)

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

Run these only after starting the backend in a separate terminal (`python backend/run.py`).

```bash
curl -fsS http://127.0.0.1:8000/api/health | python3 -m json.tool
curl -fsS http://127.0.0.1:8000/api/companies | python3 -m json.tool
curl -fsS http://127.0.0.1:8000/api/companies/cyberdyne/commitments | python3 -m json.tool
curl -fsS http://127.0.0.1:8000/api/companies/cyberdyne/commitments/1 | python3 -m json.tool
```

If the backend is not running, `curl` will print a direct connection error instead of a JSON parse error.

## Assumptions

- Commitment definitions remain in `data/spend_commitments.json` at runtime.
- Billing data is loaded into Postgres before app usage.
- Currency values are treated as decimal USD amounts.
- Checkin windows use `[start, end)` date boundaries.
- UTC timestamps are used consistently.
- Auth/security is intentionally out of scope for this assignment.

## UI/UX Rationale

Implemented a single-page master-detail layout:
- company selector for context switching,
- commitment list for at-a-glance status and shortfall,
- detail table for period-by-period verification.

Why this was chosen:
- Solves assignment user stories directly (status, shortfalls, periods).
- Minimizes file navigation for simplicity of review.
- Keeps implementation small while remaining readable.

Alternative considered:
- separate list/detail pages, but this added routing complexity and slowed
  analysis flow for little benefit in a toy app.
- Component libraries: faster prebuilt UI, but less control and added dependency surface for a small app.

More UI/UX improvements:
- Add frontend loading skeletons and user-facing retry actions for API failures.
- Add filtering by status, sort by largest shortfall, and text search.
- Add a chart in commitment detail showing each check-in period's committed vs actual spend.

## Production-Version Changes

- Move commitments into versioned DB tables (instead of runtime JSON file).
- Add authentication and role-based access control.
- Add structured logging, metrics, tracing, and alerting.
- Add migration workflow and deployment pipeline.
- Add stronger input validation and API schema validation.
- Prefetch data for snappier UI responses.

## 100x Data Scale Changes

- Partition billing events by date.
- Create pre-aggregated daily spend tables by company/service.
- Use materialized views or batch jobs for commitment rollups.
- Cache frequently requested company/commitment summaries.
- Introduce async job processing for expensive recomputations.
