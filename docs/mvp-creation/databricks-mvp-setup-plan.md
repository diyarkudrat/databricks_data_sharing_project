# Databricks Data Warehouse MVP

## Overview

Create a standalone Next.js application with TypeScript that demonstrates end-to-end integration with Databricks: setting up a warehouse, authenticating, querying data via SQL and REST APIs, and rendering results in a clean UI.

## Implementation Steps

### 1. Databricks Workspace Setup Documentation

Create a step-by-step guide (`docs/DATABRICKS_SETUP.md`) covering:

- Creating a Databricks workspace (Community Edition or trial)
- Setting up a SQL warehouse
- Creating sample tables with synthetic data
- Generating personal access tokens (PAT)
- Configuring IP access lists (if needed)

### 2. Next.js Application Scaffold

Initialize a new Next.js app in `/Users/diyarkudrat/databricks_data_sharing_project/webapp`:

- TypeScript configuration
- App Router structure
- Environment variable setup (`.env.local` for frontend configuration such as `NEXT_PUBLIC_BACKEND_URL`)
- Basic project structure: `/app`, `/lib`, `/components`, `/types`

### 3. Backend Service for Databricks

Create a separate Node.js + TypeScript backend service (for example, in a `backend/` directory) that owns all communication with Databricks:

- Install and configure the `@databricks/sql` SDK
- Configure environment variables for Databricks credentials
- Implement a Databricks client and query service with error handling and retry logic
- Define TypeScript types for backend responses

### 4. Backend REST API Routes

In the backend service, build REST endpoints that the Next.js app will call:

- **GET /api/warehouses** - List available warehouses
- **GET /api/tables** - Retrieve table metadata
- **POST /api/query** - Execute SQL queries against the warehouse
- **GET /api/query/[queryId]** - Poll query execution status
- Proper error handling and logging

### 5. Frontend UI Components

Build React components in `/components`:

- Query input form with SQL editor
- Data table viewer with pagination
- Loading/error states
- Warehouse connection status indicator
- Simple, modern styling (Tailwind CSS)

### 6. Main Dashboard Page

Create the main page (`/app/page.tsx`) that:

- Displays connection status to Databricks
- Shows available tables and schemas
- Allows users to run ad-hoc SQL queries
- Renders query results in a formatted table
- Handles async query execution patterns

### 7. Documentation & README

Comprehensive documentation including:

- Prerequisites and dependencies
- Step-by-step setup instructions
- Environment variable configuration
- Example queries to run
- Architecture diagram showing data flow
- Troubleshooting common issues

## Key Technologies

- **Next.js 14+** (App Router)
- **TypeScript**
- **@databricks/sql** SDK
- **Tailwind CSS** for styling
- **React Query** for data fetching (optional but recommended)

## File Structure

```
databricks-mvp/
├── webapp/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── DATABRICKS_SETUP.md
│   ├── step-2-next-js-app-setup.md
│   └── step-3-backend-service-setup.md
└── README.md
```

## Environment Variables

```bash
# Frontend (webapp/.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Backend (backend/.env)
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/...
```