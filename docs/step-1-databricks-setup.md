# Databricks Workspace Setup Guide

This guide will walk you through accessing your Databricks Starter Space workspace and configuring authentication to query the AccuWeather sample data from your personal server.

## 1. Access Your Databricks Starter Space

Databricks automatically creates a **"Starter Space"** workspace for trial accounts with:
- ✅ Sample data already loaded (AccuWeather weather data)
- ✅ SQL warehouse pre-configured
- ✅ Ready to query immediately

### Get Your Workspace URL
Your workspace URL is in your browser's address bar when logged in:
- Format: `https://dbc-xxxxxxxx-xxxx.cloud.databricks.com`

**Save this URL - you'll need it for API calls.**

## 2. Access Your SQL Warehouse

Your Starter Space includes a pre-configured SQL warehouse.

### Steps:
1. In your Databricks workspace, click the **persona switcher** in the top-left
2. Select **"SQL"**
3. Click **"SQL Warehouses"** in the left sidebar
4. You should see an existing warehouse (from Starter Space)
5. If it's stopped, click on it and then click **"Start"**

### Get HTTP Path:
1. Click on your warehouse name to view details
2. Go to the **"Connection details"** tab
3. Copy the **"HTTP Path"** - it looks like:
   ```
   /sql/1.0/warehouses/xxxxxxxxxxxxxxxx
   ```
4. **Save this HTTP Path - you'll need it for API authentication.**

## 3. Explore the AccuWeather Sample Data

Your Starter Space includes ready-to-use AccuWeather weather data.

### View the Sample Data:
1. Click **"SQL Editor"** in the left sidebar
2. In the left **Catalog** browser panel, expand:
   - `samples` (catalog)
   - `accuweather` (schema)
   - You'll see the weather data table(s)

### Test Query:
Run this to see the data structure and sample rows:

```sql
-- View sample weather data
SELECT * FROM samples.accuweather.daily_weather_data LIMIT 10;
```

### Explore the Schema:
See what columns are available:

```sql
-- Get column information
DESCRIBE samples.accuweather.daily_weather_data;
```

This sample data is perfect for testing your Next.js integration!

## 4. Generate Access Token (PAT)

Personal Access Tokens (PAT) are used to authenticate API requests from your server.

### Steps:
1. Click on your **username** in the top-right corner
2. Select **"User Settings"**
3. Go to the **"Developer"** tab (or **"Access Tokens"** section)
4. Click **"Generate New Token"**
5. Configure the token:
   - **Comment**: `API Access for Next.js App` (or any description)
   - **Lifetime**: Select desired expiration (or leave blank for 90 days)
6. Click **"Generate"**
7. **IMPORTANT**: Copy the token immediately - it won't be shown again!
   - Token format: `dapi...` (starts with "dapi")

**Keep this token secure - treat it like a password.**

## 5. Connection Details for Your Application

You now have all the information needed to connect from your backend service.

### Backend Environment Variables Format

In the `backend/` service, create a `.env` file (or copy `backend/.env.example` to `.env`) with:

```bash
# Your Databricks workspace URL
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com

# Personal Access Token (starts with dapi)
DATABRICKS_TOKEN=dapi...your-token-here...

# HTTP Path from SQL Warehouse connection details
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxxxxxxxxxxxxx
```

### Example REST API Call

Here's how to query the AccuWeather data using cURL (to test connectivity):

```bash
curl -X POST \
  https://your-workspace.cloud.databricks.com/api/2.0/sql/statements \
  -H "Authorization: Bearer dapi...your-token..." \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_id": "your-warehouse-id",
    "statement": "SELECT * FROM samples.accuweather.daily_weather_data LIMIT 5",
    "wait_timeout": "30s"
  }'
```

**Note**: Extract the warehouse ID from your HTTP path (the part after `/warehouses/`)

## 6. Test Your Setup

### In Databricks UI:
1. Go to **SQL Editor**
2. Run this test query to verify everything works:

```sql
-- Get weather data for specific cities
SELECT 
  date,
  city,
  temp_max,
  temp_min,
  precipitation
FROM samples.accuweather.daily_weather_data
ORDER BY date DESC
LIMIT 20;
```

3. If you see weather data results, you're all set!

### From Your Application:
Once you implement the backend service and its REST API routes, and connect your Next.js frontend to it, you'll be able to:
- Query the warehouse programmatically from the backend
- Fetch results as JSON via the backend API
- Display data in your frontend

## Next Steps

Now that your Databricks workspace is configured:
1. Scaffold the Next.js frontend in `webapp/` (see `step-2-next-js-app-setup.md`)
2. Implement the backend Databricks service in `backend/` (see `step-3-backend-service-setup.md`)
3. Build frontend components to display query results from the backend API

## Troubleshooting

### "Warehouse not running" error
- Go to SQL Warehouses and manually start your warehouse
- It auto-stops after 10 minutes of inactivity to save costs

### "Authentication failed" error
- Verify your PAT token is correct
- Ensure the token hasn't expired
- Check that you're using the correct workspace URL

### "Table not found" error
- Verify you're using the correct table name: `samples.accuweather.daily_weather_data`
- Check the catalog browser in SQL Editor to confirm the table path
- Ensure your warehouse has access permissions

### Connection timeout
- Check your network/firewall isn't blocking Databricks
- Ensure the warehouse is running (not stopped)
- Trial workspaces should have good performance

## Cost Management Tips

- **Auto Stop**: Your warehouse auto-stops after 10 minutes of inactivity
- **Trial Period**: AWS trial is free for 14 days with generous compute credits
- **Monitoring**: Check the "Billing" section to track usage during your trial
- **Start/Stop Manually**: Stop the warehouse when not in use to conserve credits

---

**You're now ready to integrate Databricks into your Next.js application!** 🎉

