# Step 3: Databricks Backend Service

## Approach

Create a separate Node.js + TypeScript backend service (for example, in a `backend/` directory) that owns all communication with Databricks using the `@databricks/sql` SDK. The Next.js `webapp/` will not call Databricks directly; instead, it will use a JSON REST API exposed by this backend.

## Implementation Tasks

### 1. Initialize Backend Project Structure

- Create a `backend/` directory at the repo root.
- Initialize a Node.js + TypeScript project with:
  - `package.json` (scripts like `dev`, `build`, `start`).
  - `tsconfig.json` with an `outDir` such as `dist/`.
  - `src/` folder with an entrypoint file (`src/index.ts` or `src/server.ts`).
- Add a minimal Express (or similar) HTTP server that:
  - Listens on a configurable port (for example, `PORT=4000`).
  - Exposes a basic `GET /health` endpoint returning `{ status: "ok" }`.

### 2. Backend Environment Configuration

- Add `backend/.env.example` with Databricks-related variables:
  - `DATABRICKS_HOST`
  - `DATABRICKS_TOKEN`
  - `DATABRICKS_HTTP_PATH`
  - `PORT=4000`
- Create `backend/.env` (for local development) and ensure it is gitignored.
- Add a small config module, for example `src/config.ts`, that:
  - Uses `dotenv` to load environment variables.
  - Validates required variables at startup and throws clear errors if any are missing.

### 3. Install Databricks SDK and Core Dependencies

- Install dependencies in `backend/`:
  - Runtime: `@databricks/sql`, `express`, `dotenv`, optionally `cors`.
  - Dev: `typescript`, `ts-node` or `tsx`, `@types/express`, `@types/node`.
- Configure TypeScript to compile `src/` into `dist/`, and set up `npm run dev` to use a TS runner (for example, `tsx src/index.ts`).

### 4. Databricks Client Module

- Create `src/databricks/client.ts` that:
  - Imports and configures the Databricks SQL client using the environment/config values.
  - Exposes a reusable function like `getClient()` (singleton or connection factory).
  - Centralizes host, HTTP path, and token configuration.

### 5. Query Service with Basic Error Handling

- Create `src/databricks/queryService.ts` that provides functions such as:
  - `executeQuery(sql: string, options?: QueryOptions)`.
- Responsibilities:
  - Use the Databricks client to submit and fetch query results.
  - Convert raw SDK responses into a simplified, typed shape (rows, columns, schema).
  - Implement basic error handling, mapping SDK/HTTP errors into a consistent internal error type.
  - Optionally implement a simple retry mechanism for transient failures (for example, network/5xx).

### 6. REST API Endpoints

- In `src/routes` or directly in `src/index.ts`, define endpoints such as:
  - `GET /health` – returns `{ status: "ok" }`.
  - `POST /api/query` –  
    - Request body: `{ sql: string, params?: Record<string, unknown> }`.  
    - Uses `executeQuery` to run the SQL against Databricks.  
    - Response: `{ columns: Column[], rows: unknown[][] }` or a similar typed structure.
- Ensure proper HTTP status codes:
  - `200` on success.
  - `400` for validation errors (for example, missing `sql`).
  - `500` for unexpected internal/Databricks errors with redacted messages.

### 7. Types and API Contract

- Create `src/types.ts` (or `src/api/types.ts`) defining:
  - `Column` type (name, type, nullable, etc.).
  - `QueryResult` type (columns and rows).
  - `ApiError` type for error responses.
- Optionally mirror these types in `webapp/` (for example, a shared `types/` file, or re-declare them) so the frontend can consume strongly typed responses.

## Files to Create/Modify

- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, `backend/.env` (local only).
- Create: `backend/src/index.ts` (or `server.ts`) – Express app and routes wiring.
- Create: `backend/src/config.ts` – environment loading and validation.
- Create: `backend/src/databricks/client.ts` – Databricks SDK client setup.
- Create: `backend/src/databricks/queryService.ts` – query execution and error handling.
- Create: `backend/src/types.ts` – shared backend types.

## Notes

- The backend must never expose raw Databricks credentials to the frontend; only derived data.
- Keep the REST API surface small and focused (health check, query execution) so it is easy to secure and evolve.
- In local development, you can run `webapp` on port 3000 and `backend` on port 4000, and configure the frontend to call `http://localhost:4000` for data.


