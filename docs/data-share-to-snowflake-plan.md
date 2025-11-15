# S3/Athena → Databricks via External Tables (Assume-Role, One-Time Backfill)

## Overview

Configure Databricks Unity Catalog to query data stored in AWS S3 (also used by Athena) without moving data. Use an AWS IAM role (assume-role) for secure access, create a Unity Catalog storage credential and external location, then register external tables over Parquet/partitioned data. Perform a one-time metadata backfill (no data copy) and validate with sample queries.

## Architecture

- **Data at rest**: S3 bucket/prefix already queried by Athena (optionally registered in Glue)
- **Access**: Databricks assumes an AWS IAM role via Unity Catalog storage credential
- **Metadata**: Unity Catalog external tables that point to S3 paths (no ingestion)
- **Compute**: Databricks SQL Warehouse or All-Purpose cluster

## Implementation Steps

### 1) AWS IAM Setup (Assume-Role)

- Create IAM role (e.g., `databricks-ext-access-role`) with trust for Databricks account and external ID (retrieve values from Databricks when creating a storage credential):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::<DATABRICKS_AWS_ACCOUNT_ID>:root"},
      "Action": "sts:AssumeRole",
      "Condition": {"StringEquals": {"sts:ExternalId": "<DATABRICKS_EXTERNAL_ID>"}}
    }
  ]
}
```

- Attach least-privilege policy for the target bucket/prefix:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:ListBucket"], "Resource": ["arn:aws:s3:::<BUCKET>"], "Condition": {"StringLike": {"s3:prefix": ["<PREFIX>/*"]}} },
    { "Effect": "Allow", "Action": ["s3:GetObject"], "Resource": ["arn:aws:s3:::<BUCKET>/<PREFIX>/*"] }
  ]
}
```


### 2) Unity Catalog Storage Credential + External Location

- In a Databricks SQL editor (or UI), create the storage credential using the IAM role:
```sql
CREATE STORAGE CREDENTIAL sc_s3_ext
WITH IAM_ROLE = 'arn:aws:iam::<AWS_ACCOUNT_ID>:role/databricks-ext-access-role'
COMMENT 'S3 access for Athena-backed data';
```

- Create external location pointing to the S3 prefix and grant usage:
```sql
CREATE EXTERNAL LOCATION loc_athena_data
URL 's3://<BUCKET>/<PREFIX>/'
WITH (STORAGE CREDENTIAL sc_s3_ext)
COMMENT 'Athena-managed S3 data';

GRANT USAGE ON EXTERNAL LOCATION loc_athena_data TO `account users`;
```


### 3) Catalog/Schema for External Tables

- Establish a dedicated catalog/schema for governance:
```sql
CREATE CATALOG IF NOT EXISTS ext_data COMMENT 'External data over S3';
GRANT USE CATALOG ON CATALOG ext_data TO `account users`;

CREATE SCHEMA IF NOT EXISTS ext_data.athena_demo COMMENT 'Athena datasets exposed via external tables';
GRANT USE SCHEMA ON SCHEMA ext_data.athena_demo TO `account users`;
```


### 4) Register External Tables (Parquet/Partitioned)

- For Parquet data (recommended), register directly:
```sql
CREATE TABLE IF NOT EXISTS ext_data.athena_demo.trips
USING PARQUET
LOCATION 's3://<BUCKET>/<PREFIX>/trips/';
```

- If Hive-style partitions exist (e.g., `year=YYYY/month=MM/`), repair partitions after creation:
```sql
MSCK REPAIR TABLE ext_data.athena_demo.trips;
```

- For non-Parquet formats (CSV/JSON), provide schema explicitly or run a one-time notebook to infer schema and generate `CREATE TABLE` DDL.

### 5) Validation (One-Time Backfill)

- Run sample queries to confirm access and performance:
```sql
SELECT COUNT(*) FROM ext_data.athena_demo.trips;
SELECT year, month, COUNT(*) FROM ext_data.athena_demo.trips GROUP BY 1,2 ORDER BY 1,2;
```

- Spot-check a few rows and compare to Athena results for parity.

### 6) Governance, Security, and Auditing

- Grant fine-grained privileges:
```sql
GRANT SELECT ON TABLE ext_data.athena_demo.trips TO `analytics-readers`;
```

- Optionally enable table/column lineage and access logs via Databricks audit logging.
- Document data owners, PII handling, and downstream consumers.

### 7) Optional: Glue Schema Import (If You Want Schema Parity)

- Script (Python/boto3 or AWS SDK) to read Glue table schema and emit Databricks `CREATE TABLE ... USING <format> LOCATION ...` DDL for quick registration.

### 8) Cleanup and Rollback

- To revoke access: drop grants, drop tables (metadata only), drop external location/storage credential, detach IAM policy/role if no longer used.

## Files to Update

- `databricks_data_sharing_project/docs/data-share-to-snowflake-plan.md` — write this plan
- Optionally add: `docs/snippets/s3-external-tables.sql` and `docs/snippets/iam-policies.json`

## Assumptions

- Data stored in Parquet under `s3://<BUCKET>/<PREFIX>/...`
- You have Databricks account admin or metastore admin to create credentials/locations
- You can retrieve `DATABRICKS_AWS_ACCOUNT_ID` and `DATABRICKS_EXTERNAL_ID` from the Databricks UI during storage credential creation