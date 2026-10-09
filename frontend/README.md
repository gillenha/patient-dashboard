# Patient Dashboard

Patient management dashboard for a medical practice: React + TypeScript frontend, FastAPI backend, PostgreSQL.

## Status

| Area                                                                     | State                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| Backend: patients CRUD, search, sort, pagination, stats                  | Done                                             |
| Backend: patient notes, summary endpoint                                 | Done                                             |
| Frontend: layout, routing, patient list, patient detail, dashboard stats | Done                                             |
| Frontend: notes section, summary view                                    | In progress                                      |
| Frontend: create/edit form                                               | Planned                                          |
| Dockerized backend and frontend                                          | Planned (only the database runs in Docker today) |

## Stack and rationale

| Concern      | Choice                                               | Why                                                                                                                                    |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| UI           | React 19, Vite, shadcn/ui (Base UI), Tailwind CSS v4 | Components are copied into the repo, so there is no opaque dependency to fight; Tailwind keeps styling colocated.                      |
| Server state | TanStack Query                                       | All state that matters is server state. Caching, retries and `keepPreviousData` pagination come built in, so there is no global store. |
| Routing      | React Router                                         | Search, filter, sort and page live in the URL, so list views are shareable and survive refresh and back/forward.                       |
| Forms        | react-hook-form + zod                                | Client-side validation that mirrors the server's rules.                                                                                |
| API          | FastAPI, Pydantic v2                                 | Typed request/response models, per-field validation errors, generated OpenAPI docs.                                                    |
| DB access    | SQLAlchemy 2.0 (sync), psycopg 3, Alembic            | Sync endpoints run in FastAPI's threadpool, which is sufficient here and simpler than async. Schema changes are versioned migrations.  |
| Database     | PostgreSQL 17                                        |                                                                                                                                        |
| Tooling      | ESLint (type-checked), Prettier, TypeScript strict   | `npm run lint`, `format:check` and `typecheck` should all pass clean.                                                                  |

## Run locally

Prerequisites: Docker, Python 3.11+, Node 20.19+.

### 1. Database

```bash
cp .env.example .env        # defaults work as-is
docker compose up -d db
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Git Bash:    source .venv/Scripts/activate
# PowerShell:  .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head        # create tables; must run before the first start
uvicorn app.main:app --reload
```

- API: http://localhost:8000, interactive docs: http://localhost:8000/docs
- On startup the app seeds 20 sample patients and a few notes if the tables are empty. Seeding is idempotent.
- Run `alembic` commands from `backend/`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173. The dev server proxies `/api/*` to `localhost:8000` and strips the prefix, so there is no CORS in development.

## Configuration

| Variable                                            | Where                          | Default                                                          |
| --------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `.env` (root, read by compose) | `patients`                                                       |
| `DATABASE_URL`                                      | backend env                    | `postgresql+psycopg://patients:patients@localhost:5432/patients` |
| `CORS_ORIGINS`                                      | backend env (JSON list)        | `["http://localhost:5173"]`                                      |
| `VITE_API_URL`                                      | frontend env                   | unset: uses the `/api` proxy                                     |

## API

| Method | Path                             | Notes                                                            |
| ------ | -------------------------------- | ---------------------------------------------------------------- |
| GET    | `/health`                        | `{"status": "ok"}`. Does not touch the database.                 |
| GET    | `/patients`                      | `q`, `status`, `sort_by`, `order`, `page`, `page_size` (max 100) |
| GET    | `/patients/stats`                | Totals, counts by status, seen in last 30 days, average age      |
| GET    | `/patients/{id}`                 |                                                                  |
| POST   | `/patients`                      | 201                                                              |
| PUT    | `/patients/{id}`                 | Full replace                                                     |
| DELETE | `/patients/{id}`                 | 204. Cascades to notes.                                          |
| GET    | `/patients/{id}/notes`           | Newest first, not paginated                                      |
| POST   | `/patients/{id}/notes`           | `content`, optional `noted_at` (timezone-aware, defaults to now) |
| DELETE | `/patients/{id}/notes/{note_id}` | 204                                                              |
| GET    | `/patients/{id}/summary`         | See below                                                        |

Always call `/patients` without a trailing slash (FastAPI redirects otherwise).

### Errors

| Status | When                    | Body                                                                          |
| ------ | ----------------------- | ----------------------------------------------------------------------------- |
| 422    | Validation              | `detail: [{loc, msg, type}]`, one entry per invalid field                     |
| 404    | Unknown patient or note | `{"detail": "Patient not found"}`                                             |
| 409    | Duplicate email         | Same `detail: [{loc, msg, type}]` shape as 422, with `loc: ["body", "email"]` |

Conflicts deliberately use the 422 shape so the client has a single path for mapping server errors onto form fields.

## Design decisions and trade-offs

- **Age is computed on read.** A stored age goes stale; only the date of birth is persisted.
- **Enums are `VARCHAR` plus named CHECK constraints**, not native Postgres enums. Native enums are painful to alter in migrations.
- **Offset pagination.** It supports jumping to a page and showing totals, which suits this UI. Keyset pagination would scale better to very large tables, but 100+ rows with indexes is comfortably within range. Sorting is whitelisted and has a deterministic tie-breaker on `id`, so pages never overlap.
- **Search** tokenizes the query and matches each token against first name, last name and email (case-insensitive, LIKE-escaped). On the client it is debounced 300ms and uses `keepPreviousData`, so typing never blocks and the list doesn't flash.
- **Retry policy.** The client never retries 4xx responses and retries network failures and 5xx at most twice.
- **Notes carry two timestamps**: `noted_at` (when the clinical event happened, client-supplied, may be backdated, but not in the future) and `created_at` (when the row was written).
- **Notes are unpaginated.** The spec asks to list all notes, and one patient's notes are a small, bounded set. Add pagination if charts grow into the hundreds.

### Summary endpoint

`GET /patients/{id}/summary` is **template-based, not LLM-generated**.

- Identifiers (name, age, blood type, status) and clinical lists (conditions, allergies) are returned as **structured fields** so the UI can render them with emphasis rather than burying them in prose.
- `narrative` covers the notes only: how many there are, over what date range, and the most recent ones quoted in chronological order, truncated at word boundaries.
- It is deterministic and unit-testable, but it **orders and quotes notes; it does not synthesize them**. It cannot infer trends, reconcile contradictions or write clinical judgment.
- `generated_by` is `"template"`. An LLM-backed implementation can replace `build_summary` in `backend/app/summary.py` without changing the API contract. Doing so would raise PHI-handling questions (sending patient data to a third party) that this project doesn't address.

## Project layout

```
backend/
  app/            main.py, config, db, models, schemas, summary, seed, routers/
  alembic/        migrations
frontend/src/
  components/     layout, shared UI (shadcn in components/ui)
  features/patients/   api, queries, list-state hooks, components
  lib/            API client, formatting
  pages/          route components
docker-compose.yml
```

## Development

```bash
# frontend/
npm run lint
npm run format
npm run typecheck
npm run build

# backend/
alembic revision --autogenerate -m "describe change"   # then review before upgrading
alembic upgrade head
```

Autogenerated migrations must be read before applying. A duplicate CHECK constraint was caught that way in this project.

## Known limitations

- No authentication or authorization. Patient data is PHI; a production deployment would need auth, audit logging and encryption at rest.
- Sample data is fictional.
- No automated tests yet.
