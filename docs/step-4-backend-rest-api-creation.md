## Step 4: Backend REST API Creation

### Approach

Extend the existing `backend/` service to expose a clear, typed REST API that the Next.js `webapp/` can consume. Implement endpoints for listing warehouses, listing tables/metadata, executing ad-hoc SQL queries, and (optionally) polling long-running queries. All endpoints will be thin HTTP wrappers around reusable Databricks service functions, reusing environment/config and client logic from Step 3.

### Implementation Tasks

#### 1. Define REST API Contract and Types (COMPLETED)

- Document the backend API surface in code and docs:
  - `GET /health` – already implemented.
  - `GET /api/warehouses` – list available SQL warehouses.
  - `GET /api/tables` – list tables/metadata, filtered by catalog/schema as needed.
  - `POST /api/query` – execute ad-hoc SQL queries (synchronous for MVP).
  - `GET /api/query/:queryId` – (optional/advanced) poll status for async queries.
- In `backend/src/types.ts` (or `backend/src/api/types.ts`), add/adjust types for:
  - `Warehouse` (id, name, state, etc.).
  - `TableInfo` (catalog, schema, name, comment, etc.).
  - `QueryRequest` / `QueryResponse` shapes used by the REST API.
  - Reuse existing `QueryResult` and `ApiError` where possible so the frontend can rely on a consistent schema.

#### 2. Warehouses Endpoint: `GET /api/warehouses` (COMPLETED)

- Create a Databricks service helper, e.g., `backend/src/databricks/warehousesService.ts` that:
  - Uses `DATABRICKS_HOST` and `DATABRICKS_TOKEN` from `loadConfig()`.
  - Calls the Databricks REST API (e.g., `GET /api/2.0/sql/warehouses`).
  - Maps the raw response into an array of `Warehouse` objects.
- Add a handler in the Express API layer (e.g., extend `backend/src/api.ts` or introduce `backend/src/routes/warehouses.ts`):
  - `GET /api/warehouses` → returns `{ warehouses: Warehouse[] }` on success.
  - Returns `{ error: ApiError }` with appropriate HTTP status codes on failures.

#### 3. Tables Endpoint: `GET /api/tables` (COMPLETED)

- Decide on the simplest source for table metadata:
  - Option A (SQL-based, MVP-friendly): use the existing `executeQuery` helper with `SHOW TABLES IN <schema>` and map results into `TableInfo`.
  - Option B (REST-based): use Unity Catalog REST APIs (e.g., `GET /api/2.1/unity-catalog/tables`).
- Implement a Databricks helper, e.g., `backend/src/databricks/tablesService.ts`, that:
  - Accepts optional `catalog`/`schema` parameters.
  - Returns a typed `TableInfo[]`.
- Add a handler in the Express API layer:
  - `GET /api/tables?catalog=...&schema=...` → returns `{ tables: TableInfo[] }`.
  - Validates query parameters and responds with `400` + `ApiError` when invalid.

#### 4. Query Execution Endpoints: `POST /api/query` and Optional Polling (COMPLETED)

- Refine the existing `POST /api/query` handler in `backend/src/api.ts`:
  - Request body: `{ sql: string, params?: Record<string, unknown> }` (keep flexible for future parameterization).
  - Uses `executeQuery(sql)` from `queryService` for **synchronous** execution in the MVP.
  - Returns `{ result: QueryResult }` on success.
  - On error, returns `{ error: ApiError }` with `400` or `500` status codes.
- (Optional/advanced, if you want full parity with the original Step 4):
  - Introduce a new Databricks service that uses the SQL Statements REST API to submit a query and obtain a `statement_id`.
  - Adjust `POST /api/query` to optionally operate in async mode and return `{ queryId, status }`.
  - Implement `GET /api/query/:queryId` that polls the Databricks statement endpoint and returns terminal status/results.

#### 5. Error Handling, Logging, and Security Considerations (COMPLETED)

- Ensure all routes:
  - Validate inputs and return `400` with a structured `ApiError` for bad requests.
  - Catch unexpected errors and return `500` with a generic message, only including detailed messages when `NODE_ENV === 'development'`.
- Add basic logging for incoming requests and Databricks errors (for now, simple `console.log` / `console.error` in the backend; can be replaced later with structured logging).
- Confirm that no Databricks secrets (`DATABRICKS_TOKEN`, etc.) are ever serialized into HTTP responses.

#### 6. Documentation and Frontend Integration Hooks (COMPLETED)

- Document the REST API routes and payloads briefly in this `step-4-backend-rest-api-creation.md` file:
  - Include example requests/responses for each endpoint.
  - Clarify expected query parameters and error formats.
- Note for future steps (frontend work):
  - The Next.js app should read `NEXT_PUBLIC_BACKEND_URL` and call these endpoints via `fetch`/`axios`.
  - Types in `backend/src/types.ts` can be mirrored or shared with `webapp/types/` to keep the contract consistent.
