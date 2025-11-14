# Databricks Workspace Setup Guide

This guide will walk you through setting up a Databricks workspace, creating a SQL warehouse, and configuring authentication to query data from your personal server.

## 1. Create Databricks Workspace

### Option A: Databricks Community Edition (Free)
1. Go to [databricks.com/try-databricks](https://databricks.com/try-databricks)
2. Click "Get started for free"
3. Sign up with your email
4. Select "Community Edition"
5. Verify your email and complete registration

### Option B: AWS Trial (14-day free trial)
1. Go to [databricks.com/try-databricks](https://databricks.com/try-databricks)
2. Select "Start free trial"
3. Choose "AWS" as your cloud provider
4. Follow the signup wizard
5. Note: Requires a credit card but won't charge during trial

### Get Your Workspace URL
After signup, your workspace URL will look like:
- Community Edition: `https://community.cloud.databricks.com`
- AWS Trial: `https://dbc-xxxxxxxx-xxxx.cloud.databricks.com`

**Save this URL - you'll need it for API calls.**

## 2. Create SQL Warehouse

A SQL warehouse is required to execute queries.

### Steps:
1. Log into your Databricks workspace
2. Click on **SQL Warehouses** in the left sidebar (under "SQL" section)
   - If you don't see it, click the switcher in the top-left and select "SQL"
3. Click **"Create SQL Warehouse"**
4. Configure the warehouse:
   - **Name**: `demo-warehouse` (or any name you prefer)
   - **Cluster size**: Select **Starter** (smallest/cheapest option)
   - **Auto Stop**: Keep default (10 minutes)
5. Click **"Create"**
6. Wait for the warehouse to start (shows green "Running" status)

### Get HTTP Path:
1. Click on your warehouse name to open details
2. Go to the **"Connection details"** tab
3. Copy the **"HTTP Path"** - it looks like:
   ```
   /sql/1.0/warehouses/xxxxxxxxxxxxxxxx
   ```
4. **Save this HTTP Path - you'll need it for API authentication.**

## 3. Create Sample Table

Let's create a simple table with sample data to test queries.

### Steps:
1. In your Databricks workspace, click **"SQL Editor"** in the left sidebar
2. Copy and paste this SQL script:

```sql
-- Create a sample sales table
CREATE TABLE IF NOT EXISTS default.sales_data (
  id INT,
  product_name STRING,
  category STRING,
  price DECIMAL(10,2),
  quantity INT,
  sale_date DATE,
  region STRING
);

-- Insert sample data
INSERT INTO default.sales_data VALUES
(1, 'Laptop Pro', 'Electronics', 1299.99, 2, '2024-01-15', 'North America'),
(2, 'Wireless Mouse', 'Electronics', 29.99, 5, '2024-01-16', 'Europe'),
(3, 'Office Chair', 'Furniture', 299.99, 1, '2024-01-17', 'Asia'),
(4, 'Desk Lamp', 'Furniture', 49.99, 3, '2024-01-18', 'North America'),
(5, 'USB Cable', 'Electronics', 12.99, 10, '2024-01-19', 'Europe'),
(6, 'Monitor 27"', 'Electronics', 399.99, 2, '2024-01-20', 'Asia'),
(7, 'Keyboard', 'Electronics', 79.99, 4, '2024-01-21', 'North America'),
(8, 'Standing Desk', 'Furniture', 599.99, 1, '2024-01-22', 'Europe'),
(9, 'Webcam HD', 'Electronics', 89.99, 2, '2024-01-23', 'Asia'),
(10, 'Notebook Set', 'Office Supplies', 15.99, 8, '2024-01-24', 'North America');
```

3. Select your warehouse from the dropdown at the top
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Commands completed successfully"

### Verify the data:
Run this query to confirm:
```sql
SELECT * FROM default.sales_data;
```

You should see 10 rows of data.

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

You now have all the information needed to connect from your Next.js app.

### Environment Variables Format

Create a `.env.local` file in your project root with:

```bash
# Your Databricks workspace URL
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com

# Personal Access Token (starts with dapi)
DATABRICKS_TOKEN=dapi...your-token-here...

# HTTP Path from SQL Warehouse connection details
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxxxxxxxxxxxxx
```

### Example REST API Call

Here's how to query your data using cURL (to test connectivity):

```bash
curl -X POST \
  https://your-workspace.cloud.databricks.com/api/2.0/sql/statements \
  -H "Authorization: Bearer dapi...your-token..." \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_id": "your-warehouse-id",
    "statement": "SELECT * FROM default.sales_data LIMIT 5",
    "wait_timeout": "30s"
  }'
```

**Note**: Extract the warehouse ID from your HTTP path (the part after `/warehouses/`).

## 6. Test Your Setup

### In Databricks UI:
1. Go back to SQL Editor
2. Run a test query:
   ```sql
   SELECT 
     category,
     COUNT(*) as total_items,
     SUM(price * quantity) as total_revenue
   FROM default.sales_data
   GROUP BY category
   ORDER BY total_revenue DESC;
   ```
3. If you see results grouped by category, you're all set!

### From Your Application:
Once you implement the API routes in your Next.js app, you'll be able to:
- Query the warehouse programmatically
- Fetch results as JSON
- Display data in your frontend

## Next Steps

Now that your Databricks workspace is configured:
1. Proceed to implement the Next.js API routes (`/app/api/`)
2. Create the Databricks client library (`/lib/databricks/client.ts`)
3. Build frontend components to display query results

## Troubleshooting

### "Warehouse not running" error
- Go to SQL Warehouses and manually start your warehouse
- It auto-stops after 10 minutes of inactivity to save costs

### "Authentication failed" error
- Verify your PAT token is correct
- Ensure the token hasn't expired
- Check that you're using the correct workspace URL

### "Table not found" error
- Confirm you ran the CREATE TABLE script
- Check you're using the correct catalog/schema: `default.sales_data`
- Verify your warehouse has access permissions

### Connection timeout
- For Community Edition, there may be rate limits
- Trial workspaces should have better performance
- Check your network/firewall isn't blocking Databricks

## Cost Management Tips

- **Auto Stop**: Warehouses auto-stop after 10 minutes (free tier)
- **Compute**: Community Edition has limited compute - suitable for demos
- **Trial**: AWS trial is free for 14 days, includes generous compute credits
- **Monitoring**: Check the "Billing" section to track usage (trial accounts only)

---

**You're now ready to integrate Databricks into your Next.js application!** 🎉

