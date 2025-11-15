## Step 5: Frontend UI Components

### Goal

Build reusable, typed React components in the `webapp` that talk to your existing backend and provide a basic data exploration UI: a SQL query input, a results table, loading/error states, and a simple connection/warehouse status indicator. Keep the design clean and minimal, using Tailwind for styling.

### High-Level Approach

1. Create a small set of focused components under `webapp/components` (or `app` subroutes) for query input, results display, and connection status.
2. Introduce a backend-aware client helper (or extend `lib/backend.ts`) for calling `GET /api/warehouses`, `GET /api/tables`, and `POST /api/query` from the frontend.
3. Wire everything into a page (root `/` for now) that lets you choose a warehouse context (optional for MVP), run SQL against Databricks via the backend, and see results plus error/loading UI.

### Implementation Tasks

#### 1. Extend Backend Fetch Helpers for Frontend

- In `webapp/lib/backend.ts`:
- Add typed helpers alongside `fetchWarehouses`:
  - `fetchTables(params?: { catalog?: string; schema?: string })` → calls `GET /api/tables` and returns an array of table metadata.
  - `executeSql(sql: string)` → calls `POST /api/query` and returns a typed `QueryResult` shape suitable for tabular display.
- Reuse or mirror backend types in `webapp/types` (e.g., `QueryResult`, `Column`) to keep contracts explicit.

#### 2. Create Query Editor Component

- Add a new component, e.g., `webapp/components/QueryEditor.tsx`:
- Props: `value`, `onChange`, `onSubmit`, `isSubmitting`, optional `defaultQuery`.
- UI:
  - A `<textarea>` or `<CodeMirror>`-style area (for now, a textarea with monospace font) for SQL entry.
  - A primary button to run the query; disabled + shows a spinner when `isSubmitting` is true.
- Keyboard behavior: allow `Ctrl+Enter` / `Cmd+Enter` to trigger submit.
- Style with Tailwind for a simple, clean look.

#### 3. Create Results Table Component

- Add `webapp/components/ResultsTable.tsx`:
- Props: `columns` and `rows` matching the `QueryResult` type from the backend (e.g., `columns: { name: string; type: string }[]; rows: unknown[][]`).
- Render a basic `<table>`:
  - Header row showing column names.
  - Body mapping each row to a `<tr>` and each cell to `<td>`.
- Handle edge cases:
  - No rows: show a small message like “No results”.
  - Large values: truncate or wrap text with a tooltip or `title` attribute.
- Optional: basic pagination later; for MVP, show full result set with a sensible max row count enforced by queries.

#### 4. Connection / Status Indicator Component

- Add `webapp/components/ConnectionStatus.tsx`:
- For MVP, accept a simple `status` prop: `'ok' | 'error' | 'unknown'`, plus optional message.
- Render a small badge (e.g., green dot + “Connected to backend” or red dot + “Backend unavailable”).
- Later, this can be wired to a lightweight `/health` check or reused wherever you need to show connection state.

#### 5. Integrate Components into the Main Page

- Update `webapp/app/page.tsx` (or create a dedicated route, e.g., `app/query/page.tsx`) to:
- Fetch warehouses and (optionally) tables on the server or client as needed.
- Manage query state (SQL text, loading, error, result) in a client component that:
  - Renders `QueryEditor` for input/submission.
  - Calls `executeSql` via a server action or client-side fetch when the user runs a query.
  - Shows a loading indicator while the query is in-flight.
  - On success, passes the result to `ResultsTable`.
  - On failure, renders a clear error banner.
- Display `ConnectionStatus` somewhere near the top, reflecting whether the last backend call succeeded.

### Files to Create/Update

- Update: `webapp/lib/backend.ts` – add `fetchTables` and `executeSql` helpers.
- Create: `webapp/types/query.ts` – define `Column` / `QueryResult` types mirroring backend.
- Create: `webapp/components/QueryEditor.tsx` – SQL input + run button.
- Create: `webapp/components/ResultsTable.tsx` – tabular render of query results.
- Create: `webapp/components/ConnectionStatus.tsx` – backend connectivity indicator.
- Update: `webapp/app/page.tsx` – integrate new components into a simple data-exploration page.

### Notes

- Keep the UI minimal and functional; visual polish can be improved later.
- For now, assume a single warehouse/http_path configured via backend env; no need to expose warehouse selection in the UI unless you want to.
- Make sure all backend calls respect `NEXT_PUBLIC_BACKEND_URL` so switching environments is trivial.