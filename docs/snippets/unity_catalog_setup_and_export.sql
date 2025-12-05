-- ============================================================
-- STEP 1: Unity Catalog Setup (Run as Account Admin / Metastore Admin)
-- ============================================================

-- 1. Create Storage Credential
-- Replace <AWS_IAM_ROLE_ARN> with your specific IAM Role ARN (e.g., arn:aws:iam::123456789012:role/databricks-s3-access)
CREATE STORAGE CREDENTIAL IF NOT EXISTS snowflake_share_cred
  WITH OPTIONS (
    'aws_iam_role_arn' = 'arn:aws:iam::220681009484:role/Databricks-Unity-Access-Role'
  )
  COMMENT 'Credential for accessing Databricks-Snowflake share bucket';

-- 2. Create External Location
CREATE EXTERNAL LOCATION IF NOT EXISTS snowflake_share_loc
  URL 's3://databricks-snowflake-share/'
  WITH STORAGE CREDENTIAL snowflake_share_cred
  COMMENT 'External location for shared datasets';

-- 3. Grant Permissions
-- Grant access to the user/group running the job
GRANT READ FILES, WRITE FILES ON EXTERNAL LOCATION snowflake_share_loc TO `account users`; 

-- ============================================================
-- STEP 2: The Export Logic (The Job Query)
-- ============================================================

-- Option A: COPY INTO (Cleanest for file export)
COPY INTO 's3://databricks-snowflake-share/dataset/'
FROM samples.accuweather.forecast_daily_calendar_imperial
FILEFORMAT = PARQUET
FORMAT_OPTIONS ('compression' = 'snappy')
OVERWRITE = TRUE;

-- Option B: INSERT OVERWRITE DIRECTORY (Alternative)
-- INSERT OVERWRITE DIRECTORY 's3://databricks-snowflake-share/dataset/'
-- USING PARQUET
-- OPTIONS ('compression' = 'snappy')
-- SELECT * FROM samples.accuweather.forecast_daily_calendar_imperial;
