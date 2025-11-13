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

Initialize a new Next.js app in `/Users/diyarkudrat/databricks_data_sharing_project/`:

- TypeScript configuration
- App Router structure
- Environment variable setup (`.env.local` for Databricks credentials)
- Basic project structure: `/app`, `/lib`, `/components`, `/types`

### 3. Databricks SDK Integration

Install and configure the Databricks SDK for Node.js:

- Set up authentication using PAT tokens
- Create a connection utility (`/lib/databricks/client.ts`)
- Implement error handling and retry logic
- Add TypeScript types for Databricks responses

### 4. Backend API Routes

Build Next.js API routes (`/app/api/`) for:

- **GET /api/warehouses** - List available warehouses
- **GET /api/tables** - Retrieve table metadata
- **POST /api/query** - Execute SQL queries against the warehouse
- **GET /api/query/[queryId]** - Poll query execution status
- Proper error handling and logging

### 5. Sample Data Creation

Create a utility script to:

- Generate sample datasets (e.g., sales transactions, user events)
- Provide SQL scripts to create tables in Databricks
- Document how to load data into the warehouse

### 6. Frontend UI Components

Build React components in `/components`:

- Query input form with SQL editor
- Data table viewer with pagination
- Loading/error states
- Warehouse connection status indicator
- Simple, modern styling (Tailwind CSS)

### 7. Main Dashboard Page

Create the main page (`/app/page.tsx`) that:

- Displays connection status to Databricks
- Shows available tables and schemas
- Allows users to run ad-hoc SQL queries
- Renders query results in a formatted table
- Handles async query execution patterns

### 8. Documentation & README

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
├── app/
│   ├── api/
│   │   ├── query/
│   │   ├── tables/
│   │   └── warehouses/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── QueryEditor.tsx
│   ├── ResultsTable.tsx
│   └── ConnectionStatus.tsx
├── lib/
│   ├── databricks/
│   │   ├── client.ts
│   │   └── types.ts
│   └── utils.ts
├── docs/
│   └── DATABRICKS_SETUP.md
├── .env.example
├── package.json
└── README.md
```

## Environment Variables

```
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/...
```