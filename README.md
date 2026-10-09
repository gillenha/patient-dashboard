# Patient Dashboard

Patient management dashboard for a medical practice: React + TypeScript frontend, FastAPI backend, PostgreSQL.

## Quick start

```bash
docker compose up --build
```

Then open http://localhost:5173. Migrations and sample data are applied automatically. Details, ports and the non-Docker workflow are below.

## Status

| Area                                                                     | State |
| ------------------------------------------------------------------------ | ----- |
| Backend: patients CRUD, search, sort, pagination, stats                  | Done  |
| Backend: patient notes, summary endpoint                                 | Done  |
| Frontend: layout, routing, patient list, patient detail, dashboard stats | Done  |
| Frontend: notes section, summary view                                    | Done  |
| Frontend: create/edit form, delete                                       | Done  |
| Docker: backend, frontend and database in one compose stack              | Done  |

### Stretch goals covered

- **Sorting and filtering query parameters** on the list endpoint (`sort_by`, `order`, `status`, tokenized `q`).
- **Alembic migrations**, applied automatically when the backend container starts.
- **Data visualization**: the dashboard shows summary tiles and a status breakdown bar with an accessible legend that links to the filtered list.
- **Code splitting** (partial): the create and edit form routes are lazy-loaded, which keeps react-hook-form and zod out of the main bundle.

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
| Serving      | nginx                                                | Serves the built SPA and proxies `/api` to the backend, so the browser talks to a single origin.                                       |
| Tooling      | ESLint (type-checked), Prettier, TypeScript strict   | `npm run lint`, `format:check` and `typecheck` should all pass clean.                                                                  |

## Run with Docker (recommended)

Prerequisite: [Docker](https://docs.docker.com/get-docker/) with Compose v2. From the repo root:

```bash
docker compose up --build
```

The first build takes a few minutes. When the logs settle:

|                    | URL                          |
| ------------------ | ---------------------------- |
| App                | http://localhost:5173        |
| API docs (Swagger) | http://localhost:8000/docs   |
| Health check       | http://localhost:8000/health |

On first start the backend applies the database migrations and seeds 20 sample patients with a few clinical notes. Seeding is idempotent, so restarts don't duplicate data. No configuration is required.

**How it fits together**

- **frontend**: nginx serves the built React app and proxies `/api/*` to the backend, stripping the prefix, so the browser only ever talks to one origin and CORS is not involved. Unknown paths fall back to `index.html` for client-side routing, while a missing `/assets/*` file is a real 404.
- **backend**: runs `alembic upgrade head`, then uvicorn, as a non-root user. It waits for the database healthcheck before starting, and the frontend waits for the backend's.
- **db**: PostgreSQL 17 with data in the named volume `pgdata`.

**Common tasks**

```bash
docker compose up -d --build    # run in the background
docker compose logs -f backend  # follow one service's logs
docker compose down             # stop, keep data
docker compose down -v          # stop and delete all data (re-seeds on next start)
```

**Changing ports or credentials.** Everything has a default. To override, `cp .env.example .env` and edit it (for example `FRONTEND_PORT=8080` if 5173 is taken). `POSTGRES_PASSWORD` must be URL-safe because it is interpolated into the database URL.

## Run without Docker (development)

Prerequisites: Docker (for the database), Python 3.11+, Node 20.19+. Stop the Docker app stack first if it is running, since both use ports 8000 and 5173.

### 1. Database

```bash
cp .env.example .env        # optional, defaults work as-is
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
| `DB_PORT`                                           | `.env` (root, read by compose) | `5432`                                                           |
| `BACKEND_PORT`                                      | `.env` (root, read by compose) | `8000`                                                           |
| `FRONTEND_PORT`                                     | `.env` (root, read by compose) | `5173`                                                           |
| `DATABASE_URL`                                      | backend env                    | `postgresql+psycopg://patients:patients@localhost:5432/patients` |
| `CORS_ORIGINS`                                      | backend env (JSON list)        | `["http://localhost:5173"]`                                      |
| `VITE_API_URL`                                      | frontend env                   | unset: uses the `/api` proxy                                     |

Under Docker, compose builds `DATABASE_URL` from the `POSTGRES_*` values, and `CORS_ORIGINS` is not needed because the browser reaches the API through nginx. The last three rows matter for the non-Docker workflow.

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

Always call `/patients` without a trailing slash (FastAPI redirects otherwise). Full request and response schemas are in the Swagger UI at `/docs`.

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
- **Offset pagination.** It supports jumping to a page and showing totals, which suits this UI. Keyset pagination would scale better to very large tables, but a few hundred rows with indexes on the sort and filter columns is comfortably within range. The client only ever renders one page. Sorting is whitelisted and has a deterministic tie-breaker on `id`, so pages never overlap.
- **Search** tokenizes the query and matches each token against first name, last name and email (case-insensitive, LIKE-escaped). On the client it is debounced 300ms and uses `keepPreviousData`, so typing never blocks and the list doesn't flash.
- **List state lives in the URL** (`q`, `status`, `sort_by`, `order`, `page`), so views are linkable and survive refresh. Typing replaces the history entry; other changes push one.
- **Retry policy.** The client never retries 4xx responses and retries network failures and 5xx at most twice.
- **Dashboard stats** come from one aggregate endpoint computed in the database. The status chart is plain HTML with no charting library, since it has three segments; each status is also labelled with its count and percentage, so color is never the only encoding.
- **Notes carry two timestamps**: `noted_at` (when the clinical event happened, client-supplied, may be backdated, but not in the future) and `created_at` (when the row was written).
- **Notes are unpaginated.** The spec asks to list all notes, and one patient's notes are a small, bounded set. Add pagination if charts grow into the hundreds.

### Validation

The zod schema in `frontend/src/features/patients/schema.ts` mirrors the rules in `PatientCreate`, so the common mistakes are caught before a round trip. The server is still the source of truth: anything it rejects comes back as `detail: [{loc, msg, type}]`, and one helper (`serverErrors.ts`) applies each entry to the matching field with `setError`. The field name is the first string in `loc` after `"body"`, so `["body", "allergies", 3]` and `["body", "email"]` both land on a field.

Because the 409 duplicate email uses the same body shape as a 422, it needs no special case and shows up under the email field. Anything not attributable to a field (network failures, 5xx, a 404 from a record deleted mid-edit) goes to a form-level banner. No failure clears the user's input.

### Summary endpoint

`GET /patients/{id}/summary` is **template-based, not LLM-generated**.

- Identifiers (name, age, blood type, status) and clinical lists (conditions, allergies) are returned as **structured fields** so the UI can render them with emphasis rather than burying them in prose.
- `narrative` covers the notes only: how many there are, over what date range, and the most recent ones quoted in chronological order, truncated at word boundaries.
- It is deterministic and unit-testable, but it **orders and quotes notes; it does not synthesize them**. It cannot infer trends, reconcile contradictions or write clinical judgment.
- `generated_by` is `"template"`. An LLM-backed implementation can replace `build_summary` in `backend/app/summary.py` without changing the API contract. Doing so would raise PHI-handling questions (sending patient data to a third party) that this project doesn't address.

## Project layout

```
backend/
  Dockerfile
  app/              main.py, config, db, models, schemas, summary, seed, routers/
  alembic/          migrations
frontend/
  Dockerfile
  nginx.conf        static serving, /api proxy, SPA fallback
  src/
    components/     layout, shared UI (shadcn in components/ui)
    features/patients/   api, queries, schema, list-state hooks, components
    lib/            API client, formatting
    pages/          route components
docker-compose.yml
.env.example
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

- **No automated tests.** Verification was done by hand against the running stack and through lint, type-check and build. The API contract in this README (status codes, error shapes, cascade delete, summary output) is the natural first target for a pytest suite.
- **No authentication or authorization.** Patient data is PHI; a production deployment would need auth, audit logging and encryption at rest. The data here is fictional.
- **No CI pipeline** and no hot reload inside Docker; for active development use the non-Docker workflow above.
- **Image tags.** The nginx image uses the moving `stable-alpine` tag; pin an exact version for reproducible production builds.