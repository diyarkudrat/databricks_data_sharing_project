# Orchestrated Databricks-Snowflake Sync Plan (Instance Profile Access)

## Overview

A backend-controlled data sync that allows users to manually trigger and monitor data transfers from Databricks to Snowflake.

**PoC Optimizations:**
- **Polling:** Increased interval to **30s-60s** to minimize API calls.
- **Data Volume:** Source query limited (e.g. `LIMIT 1000`) to reduce egress/ingress costs.
- **Retries:** No automatic retries; Fail-fast strategy.
- **State:** In-memory persistence for run history (resets on server restart).
- **Access Mode:** Uses **AWS Instance Profiles** (Legacy Mode) instead of Unity Catalog for S3 access.

## Architecture Flow

1.  **User Action**: User clicks "Sync Data" in Webapp.
2.  **Backend (Async Orchestrator)**:
    *   Creates `SyncRun` (PENDING).
    *   Returns `run_id` immediately.
    *   **Background**:
        1.  **Export**: Trigger Databricks Job with `run_id` param.
            *   Job writes to `s3://databricks-snowflake-share/runs/<run_id>/` (Authenticated via Instance Profile).
        2.  **Poll**: Check Databricks status every **30-60s** (Timeout: 30m).
        3.  **Import**: Connect to Snowflake -> `COPY INTO` from S3 path.
        4.  **Complete**: Update status to SUCCESS/FAILED.
3.  **Frontend**: Polls backend every **5s** for status updates.

## Implementation Steps

### 1) Infrastructure Updates (Databricks)
*   **S3 Access**: Configure the SQL Warehouse with an **AWS Instance Profile** that has S3 Read/Write permissions.
*   **Job SQL**: Update the Databricks Job SQL to accept `${run_id}` and limit data size.
    ```sql
    COPY INTO 's3://databricks-snowflake-share/runs/${run_id}/'
    FROM (
      SELECT * FROM samples.accuweather.forecast_daily_calendar_imperial
      WHERE date >= '2024-01-01' -- Filter for PoC
      LIMIT 1000                 -- Hard limit for PoC
    )
    FILEFORMAT = PARQUET
    OVERWRITE = TRUE;
    ```

### 2) Backend Data Model (`sync_runs`)
*   **Action**: Create a simple in-memory store in `backend/src/orchestrator/syncStore.ts`.
    *   `SyncRun`: `{ id: string, status: string, logs: string[], createdAt: Date }`

### 3) Backend Integrations
*   **Snowflake**:
    *   Install `snowflake-sdk`.
    *   Create `backend/src/snowflake/snowflakeService.ts`.
    *   Implement `loadData(runId)` using the `COPY INTO` command.
*   **Orchestrator**:
    *   Create `backend/src/orchestrator/syncService.ts`.
    *   Implement `startSync()` and polling logic.

### 4) API & Frontend
*   **API**:
    *   `POST /api/sync`: Start new sync.
    *   `GET /api/sync`: List recent runs.
    *   `GET /api/sync/:id`: Get details for one run.
*   **Frontend**:
    *   Update `DataShareManager.tsx` to use new endpoints and show run history.

## Security
*   Snowflake credentials stored in `.env`.
*   Databricks access via **AWS Instance Profile** (No keys in code).
*   S3 access via IAM Roles.
