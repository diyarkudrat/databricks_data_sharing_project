# Environment Variables Configuration

This document describes the environment variables needed for your Next.js application to connect to Databricks.

## Setup Instructions

1. Create a file named `.env.local` in your project root directory
2. Copy the template below and fill in your actual values
3. Never commit `.env.local` to version control (it should be in `.gitignore`)

## Environment Variables Template

```bash
# Databricks Connection Configuration

# Your Databricks workspace URL
# Format: https://your-workspace.cloud.databricks.com
# Examples:
#   - Community Edition: https://community.cloud.databricks.com
#   - AWS: https://dbc-xxxxxxxx-xxxx.cloud.databricks.com
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com

# Personal Access Token for authentication
# Generate from: User Settings → Developer → Access Tokens
# Format: starts with "dapi"
DATABRICKS_TOKEN=dapi...your-token-here...

# SQL Warehouse HTTP Path
# Find in: SQL Warehouses → [Your Warehouse] → Connection Details → HTTP Path
# Format: /sql/1.0/warehouses/xxxxxxxxxxxxxxxx
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxxxxxxxxxxxxx
```

## How to Get These Values

### DATABRICKS_HOST
- This is your workspace URL
- You see it in your browser when logged into Databricks
- **Community Edition**: `https://community.cloud.databricks.com`
- **AWS Trial/Enterprise**: `https://dbc-xxxxxxxx-xxxx.cloud.databricks.com`

### DATABRICKS_TOKEN
- Go to your Databricks workspace
- Click your username (top-right) → **User Settings**
- Navigate to **Developer** or **Access Tokens** tab
- Click **Generate New Token**
- Copy the token (starts with `dapi`)
- ⚠️ **Important**: Save it immediately - you can't view it again!

### DATABRICKS_HTTP_PATH
- Go to **SQL Warehouses** in your workspace
- Click on your warehouse name
- Go to **Connection details** tab
- Copy the **HTTP Path** value
- Format: `/sql/1.0/warehouses/xxxxxxxxxxxxxxxx`

## Security Best Practices

1. **Never commit** your `.env.local` file to Git
2. **Never share** your Personal Access Token
3. **Rotate tokens** periodically for security
4. **Use different tokens** for development and production
5. **Set token expiration** when generating new tokens

## Verifying Your Configuration

After setting up your `.env.local` file, you can verify the connection by:

1. Starting your Next.js development server:
   ```bash
   npm run dev
   ```

2. Making a test API call to your `/api/query` endpoint

3. Checking the server logs for any connection errors

## Troubleshooting

### "Missing environment variables" error
- Ensure `.env.local` exists in your project root
- Restart your Next.js dev server after creating/modifying `.env.local`
- Check that variable names match exactly (case-sensitive)

### "Authentication failed" error
- Verify your `DATABRICKS_TOKEN` is correct
- Check the token hasn't expired
- Ensure you copied the full token (starts with `dapi`)

### "Warehouse not found" error
- Verify your `DATABRICKS_HTTP_PATH` is correct
- Ensure the warehouse is running in Databricks
- Check you have permissions to access the warehouse

