# Environment Variables Configuration

This document describes the environment variables needed for:

- The **backend** service that connects to Databricks
- The **Next.js frontend** that talks to the backend

## Backend Service (`backend/.env`)

1. In the `backend/` directory, copy `.env.example` to `.env`
2. Fill in your actual Databricks values
3. Ensure `.env` is listed in `backend/.gitignore` (already configured)

### Backend Environment Variables Template

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

# Port for the backend HTTP server
PORT=4000
```

## Frontend (`webapp/.env.local`)

1. In the `webapp/` directory, copy `.env.example` to `.env.local`
2. Set the URL of your backend service
3. `.env.local` is already gitignored by Next.js

### Frontend Environment Variables Template

```bash
# URL of the backend Databricks service
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
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

### Backend

1. From `backend/`:
   ```bash
   npm run dev
   ```
2. Hit the health endpoint:
   ```bash
   curl http://localhost:4000/health
   ```
3. Optionally, send a test query to `/api/query` after your Databricks creds are set.

### Frontend

1. Ensure `NEXT_PUBLIC_BACKEND_URL` points to your running backend.
2. From `webapp/`:
   ```bash
   npm run dev
   ```
3. Use the UI (or a simple fetch call) to hit the backend API and verify that data flows end-to-end.

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

