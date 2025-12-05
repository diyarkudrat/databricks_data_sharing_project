# Databricks → Snowflake Data Share (Orchestrated by Backend)

## Overview

This architecture uses the application **Backend** as the central orchestrator to manage the data transfer from Databricks to Snowflake. Instead of relying on decoupled schedules or complex event triggers, the Backend explicitly triggers the export from Databricks, waits for completion, and then triggers the import into Snowflake.

## Architecture Flow

1.  **User Action**: User clicks "Sync Data" in the Webapp.
2.  **Backend (Export)**:
    *   Calls Databricks Jobs API (`run-now`) to execute the SQL-based export job.
    *   Job writes Parquet files to `s3://databricks-snowflake-share/dataset/`.
    *   Backend polls Databricks API until job status is `SUCCESS`.
3.  **Backend (Import)**:
    *   Connects to Snowflake via Node.js driver.
    *   Executes `COPY INTO` command to load data from the S3 stage into the target table.
    *   Verifies the load (optional row count check).
4.  **Feedback**: Backend returns success to Frontend; User sees "Sync Complete".

## Implementation Steps

### 1) Infrastructure Setup [COMPLETED]

*   **S3 Bucket**: `databricks-snowflake-share`.
*   **AWS IAM**:
    *   Role for Databricks (Unity Catalog) to Write to S3.
    *   Role for Snowflake (Storage Integration) to Read from S3.
*   **Databricks**:
    *   Storage Credential + External Location configured.
    *   **Export Job** created (Task Type: SQL) -> Exports to S3.

### 2) Backend Logic (Orchestrator) [IN PROGRESS]

*   **Databricks Service**:
    *   `triggerJob(jobId)`: Starts the export.
    *   `waitForJob(runId)`: Polls status.
*   **Snowflake Service**:
    *   `connect()`: Establishes connection using private key or password.
    *   `loadData()`: Runs the `COPY INTO` command.

### 3) Snowflake Configuration [PENDING]

We need to ensure the destination table and stage exist.

```sql
-- 1. Storage Integration (One-time setup by Admin)
-- (Already done in Step 1 of previous plan)

-- 2. Create Stage
CREATE OR REPLACE STAGE s3_share_stage
  URL = 's3://databricks-snowflake-share/dataset/'
  STORAGE_INTEGRATION = s3_share_int
  FILE_FORMAT = (TYPE = PARQUET);

-- 3. Create Target Table
CREATE OR REPLACE TABLE shared_forecasts (
  date DATE,
  weather_date DATE,
  latitude DOUBLE,
  longitude DOUBLE,
  -- ... other columns matching source ...
  forecast_temp_min_f DOUBLE,
  forecast_temp_max_f DOUBLE
);
```

### 4) The Import Command (Run by Backend)

```sql
COPY INTO shared_forecasts
FROM @s3_share_stage
FILE_FORMAT = (TYPE = PARQUET)
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
ON_ERROR = 'ABORT_STATEMENT';
```

*Note: `MATCH_BY_COLUMN_NAME` is great for Parquet when schemas match.*

## Security Considerations

*   **Backend**: Holds the Snowflake credentials (env vars).
*   **Databricks**: Accesses S3 via Unity Catalog (no keys in code).
*   **Snowflake**: Accesses S3 via Storage Integration (no keys in code).
*   **Network**: Traffic flows from Databricks -> S3 -> Snowflake. Backend only sends control signals (commands).
