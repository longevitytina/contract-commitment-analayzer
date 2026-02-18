# Contract Commitment Analyzer

Minimal implementation scaffold for a toy contract commitment analyzer.

## Stack

- PostgreSQL (hosted on Supabase)
- Python + Flask API
- React + TypeScript frontend

## Phase 1 Setup

### Backend

1. Create and activate a Python virtual environment.
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
3. Copy env template and set credentials:
   - `cp backend/.env.example backend/.env`
4. Initialize schema:
   - `python backend/scripts/init_db.py`
5. Load billing CSV:
   - `python backend/scripts/load_billing_data.py --truncate`
6. Run API:
   - `python backend/run.py`

### Frontend

1. Install dependencies:
   - `cd frontend && npm install`
2. Start dev server:
   - `npm run dev`

Note: Full product documentation and design rationale will be completed in a later implementation phase.

## Environment Variables

Backend currently requires only:

- `SUPABASE_DB_URL` (direct Postgres connection string)

The API uses direct `psycopg` database access and does not require `SUPABASE_URL` or `SUPABASE_KEY`.
