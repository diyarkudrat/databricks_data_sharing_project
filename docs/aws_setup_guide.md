# AWS Setup for Databricks Unity Catalog S3 Access

To allow Databricks (Unity Catalog) to write data to your S3 bucket (`databricks-snowflake-share`), you need to create an **AWS IAM Role** and configure a trust relationship.

## Step 1: Create the IAM Policy
This policy gives permission to read/write to your specific bucket.

1. Go to **AWS Console > IAM > Policies > Create Policy**.
2. Click **JSON** and paste the following (replace `<BUCKET_NAME>` with `databricks-snowflake-share`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetLifecycleConfiguration",
                "s3:PutLifecycleConfiguration"
            ],
            "Resource": [
                "arn:aws:s3:::databricks-snowflake-share",
                "arn:aws:s3:::databricks-snowflake-share/*"
            ],
            "Effect": "Allow"
        }
    ]
}
```
3. Name it `Databricks-Unity-Access-Policy` and create it.

## Step 2: Create the IAM Role
1. Go to **AWS Console > IAM > Roles > Create role**.
2. **Trusted entity type**: Select **AWS account**.
3. **An AWS account**: Select **This account** (we will update this trust relationship later).
4. Click **Next**.
5. **Add permissions**: Search for and select the policy you just created (`Databricks-Unity-Access-Policy`).
6. Name the role: `Databricks-Unity-Access-Role`.
7. Click **Create role**.
8. **Copy the Role ARN** (e.g., `arn:aws:iam::123456789012:role/Databricks-Unity-Access-Role`).

## Step 3: Create Storage Credential in Databricks (Get External ID)
1. Open your **Databricks Workspace**.
2. Run the SQL command to create the credential using the Role ARN from Step 2:
   ```sql
   CREATE STORAGE CREDENTIAL IF NOT EXISTS snowflake_share_cred
     WITH OPTIONS (
       'aws_iam_role_arn' = 'arn:aws:iam::123456789012:role/Databricks-Unity-Access-Role'
     );
   
   DESCRIBE STORAGE CREDENTIAL snowflake_share_cred;
   ```
3. Look at the output of `DESCRIBE`. Note down these two values:
   - `endpoint` (The Databricks IAM User ARN)
   - `external_id` (The unique ID for security)

## Step 4: Update Trust Relationship in AWS
1. Go back to **AWS Console > IAM > Roles > Databricks-Unity-Access-Role**.
2. Click the **Trust relationships** tab > **Edit trust policy**.
3. Replace the JSON with the values you got from Databricks:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<DATABRICKS_ENDPOINT_ARN>" 
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<DATABRICKS_EXTERNAL_ID>"
        }
      }
    }
  ]
}
```
*Replace `<DATABRICKS_ENDPOINT_ARN>` and `<DATABRICKS_EXTERNAL_ID>` with the actual values from the `DESCRIBE` command.*

## Step 5: Create External Location
Now that trust is established, run the final piece of SQL in Databricks:

```sql
CREATE EXTERNAL LOCATION IF NOT EXISTS snowflake_share_loc
  URL 's3://databricks-snowflake-share/'
  WITH STORAGE CREDENTIAL snowflake_share_cred;
  
GRANT READ FILES, WRITE FILES ON EXTERNAL LOCATION snowflake_share_loc TO `account users`;
```
