# Contract Commitment Analyzer

Minimal implementation scaffold for a toy contract commitment analyzer.

## Stack

- PostgreSQL (hosted on Supabase)
- Python + Flask API
- React + TypeScript frontend

### Backend

1. Create and activate a Python virtual environment (from project root `/contract-commitment-analyzer`).
   - `python -m venv venv`
   - `source venv/bin/activate`
   - `which python` (verifies the virtual environment is active)
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
3. Copy env template and set credentials:
   - `cp backend/.env.template backend/.env`
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

## Testing

### Manual test commands (copy/paste these into your terminal)
From repo root:
`curl -s http://127.0.0.1:8000/api/health | python3 -m json.tool`
`curl -s http://127.0.0.1:8000/api/companies | python3 -m json.tool`
`curl -s http://127.0.0.1:8000/api/companies/cyberdyne/commitments | python3 -m json.tool`
`curl -s http://127.0.0.1:8000/api/companies/cyberdyne/commitments/1 | python3 -m json.tool`

Negative-path checks:
`curl -s -i http://127.0.0.1:8000/api/companies/not-a-company/commitments`
`curl -s -i http://127.0.0.1:8000/api/companies/cyberdyne/commitments/9999`
 - You should see 404 with an error message for those.

### How to manually verify “easy to consume from frontend”
Treat it as a frontend-dev usability checklist:
- Stable, predictable envelope
  - Lists are always arrays in known keys (companies, commitments).
  - Detail endpoint always returns commitment object.
- Types are frontend-friendly
  - Money fields are numbers (not strings).
  - IDs are numeric.
  - Status fields are simple strings (past/current/future).
- Minimal client transformation needed
  - Frontend can directly render list/table/cards without heavy reshaping.
  - No nested weirdness that forces complicated mapping.
- Error handling is clear
  - 404s return JSON with error text; frontend can show user-friendly messages.
- Cross-endpoint consistency
  - company, id, service, totals use consistent naming across endpoints.
