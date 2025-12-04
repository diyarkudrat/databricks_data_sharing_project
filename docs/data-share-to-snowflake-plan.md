# Databricks → Snowflake Data Share via S3 + COPY INTO (Bulk Backfill)

## Overview

Publish curated datasets from Databricks to Snowflake by exporting Parquet files to an S3 landing zone, then ingesting into Snowflake using standard `COPY INTO` commands. This approach is optimized for **one-time backfills** and **bulk loads**, offering synchronous execution, better error visibility, and simpler operations than Snowpipe.

## Architecture

- **Producer**: Databricks writes Parquet files to `s3://<BUCKET>/<PREFIX>/...` (partitioned, optimized file sizes).
- **Transport/Storage**: S3 landing zone for data share files.
- **Consumer**: Snowflake external stage + `COPY INTO` command to bulk load data.
- **Security**: AWS IAM role assumed by Snowflake via STORAGE INTEGRATION.

## Implementation Steps

### 1) AWS S3 and IAM (Snowflake Access)

- Identify/create landing path: `s3://<BUCKET>/<PREFIX>/dataset/`.
- Create an IAM role for Snowflake (e.g., `snowflake-s3-reader`) with trust configured from Snowflake (via STORAGE INTEGRATION).

*Note: Secure access setup remains the same as standard integrations.*

```sql
-- In Snowflake (ACCOUNTADMIN)
CREATE OR REPLACE STORAGE INTEGRATION s3_share_int
  TYPE = EXTERNAL_STAGE
  STORAGE_PROVIDER = S3
  ENABLED = TRUE
  STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::<AWS_ACCOUNT_ID>:role/snowflake-s3-reader'
  STORAGE_ALLOWED_LOCATIONS = ('s3://<BUCKET>/<PREFIX>/')
  COMMENT = 'IAM-based access from Snowflake to S3 landing zone';

DESC INTEGRATION s3_share_int;
-- Note EXTERNAL_ID and AWS_IAM_USER_ARN for the trust policy.
```

- Configure the IAM role trust policy in AWS using the values from `DESC INTEGRATION`.
- Attach least-privilege S3 policy to the role (allow `s3:ListBucket` and `s3:GetObject` on the bucket/prefix).

### 2) Databricks Export Job (Optimized for Ingest)

Export Parquet files to the landing zone. **Critical:** Control file sizes to avoid the "small file problem" (aim for 100MB-250MB files) and ensure stable schemas.

#### Option A: PySpark (Recommended)
```python
# Estimate partitions: Total Size / 128MB. E.g., 10GB -> ~80 partitions
(
  spark.table("catalog.schema.trips_delta")
       .where("DATE(pickup_ts) = '2025-11-15'")
       .select("trip_id","pickup_ts","dropoff_ts","passenger_count","fare_amount","vendor_id")
       .repartition(10) # Control file count/size
       .write.mode("overwrite")
       .format("parquet")
       .save("s3://<BUCKET>/<PREFIX>/dataset/date=2025-11-15/")
)
```

#### Option B: Databricks SQL
```sql
-- Requires Databricks Runtime 11.3+ for file size hints in some contexts, 
-- or rely on auto-optimize if enabled.
SET spark.sql.files.maxRecordsPerFile = 1000000; -- Approx control

COPY INTO 's3://<BUCKET>/<PREFIX>/dataset/date=2025-11-15/'
FROM (SELECT trip_id, pickup_ts, dropoff_ts, passenger_count, fare_amount, vendor_id
      FROM catalog.schema.trips_delta
      WHERE DATE(pickup_ts) = '2025-11-15')
FILEFORMAT = PARQUET
HEADER = FALSE
OVERWRITE = TRUE;
```

### 3) Snowflake Stage and Bulk Load

- Create external stage:
```sql
USE ROLE ACCOUNTADMIN;
USE DATABASE <DB>;
USE SCHEMA <SCHEMA>;

CREATE OR REPLACE STAGE s3_share_stage
  URL = 's3://<BUCKET>/<PREFIX>/'
  STORAGE_INTEGRATION = s3_share_int
  FILE_FORMAT = (TYPE = PARQUET);
```

- Create target table:
```sql
CREATE OR REPLACE TABLE shared_trips (
  trip_id STRING,
  pickup_ts TIMESTAMP_NTZ,
  dropoff_ts TIMESTAMP_NTZ,
  passenger_count NUMBER,
  fare_amount NUMBER(10,2),
  vendor_id STRING,
  date DATE
);
```

- **Run Bulk Load**: Use `COPY INTO` for synchronous execution. This allows you to immediately see errors.
```sql
COPY INTO shared_trips
FROM (
  SELECT
    $1:trip_id::STRING,
    $1:pickup_ts::TIMESTAMP_NTZ,
    $1:dropoff_ts::TIMESTAMP_NTZ,
    $1:passenger_count::NUMBER,
    $1:fare_amount::NUMBER(10,2),
    $1:vendor_id::STRING,
    TO_DATE(SPLIT_PART(METADATA$FILENAME, 'date=', 2), '/') AS date -- Derive partition from path
  FROM @s3_share_stage/dataset/
)
FILE_FORMAT = (TYPE = PARQUET)
PATTERN = '.*.parquet'
ON_ERROR = 'ABORT_STATEMENT'; -- Fail fast if schema mismatches
```

### 4) Validation

Compare not just counts but aggregations to ensure data integrity.

```sql
-- 1. Row Count Parity
SELECT COUNT(*) FROM shared_trips;

-- 2. Data Value Integrity (Source vs Target)
SELECT 
    date, 
    COUNT(*) as row_count, 
    SUM(fare_amount) as total_fare 
FROM shared_trips 
GROUP BY 1 
ORDER BY 1;
```

*If `ON_ERROR = 'CONTINUE'` was used (not recommended for backfill), check rejected records:*
```sql
SELECT * FROM TABLE(VALIDATE(shared_trips, JOB_ID => '<query_id_of_copy_command>'));
```

### 5) Governance, Security, and Auditing

- **Role-Based Access**: `GRANT SELECT ON TABLE shared_trips TO ROLE ANALYST_READONLY;`
- **Idempotency**: If re-running a backfill for a specific date, `DELETE FROM shared_trips WHERE date = '...'` before running `COPY INTO` for that partition to avoid duplicates.

### 6) Optional: Continuous Sync (Snowpipe)

If this moves from a one-time backfill to a continuous feed:
1. Enable S3 Event Notifications for `ObjectCreated`.
2. Create a Pipe using the `COPY INTO` statement above (remove `PATTERN` if using auto-ingest managed queue).
3. Set `AUTO_INGEST = TRUE`.

### 7) Cleanup

- Drop stage and integration if no longer needed.
- Clean up S3 bucket to save storage costs if data is duplicated in Snowflake.
