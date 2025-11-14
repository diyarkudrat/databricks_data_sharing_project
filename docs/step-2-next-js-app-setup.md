# Step 2: Next.js Application Scaffold

## Approach

Initialize a Next.js 14+ application using `create-next-app` in a `webapp/` subdirectory with TypeScript, App Router, Tailwind CSS, and ESLint. Then configure the project structure and environment variables for Databricks credentials.

## Implementation Tasks

### 1. Initialize Next.js Application

Run `npx create-next-app@latest webapp` in `/Users/diyarkudrat/databricks_data_sharing_project/` with the following options:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: Yes (default `@/*`)

### 2. Create Directory Structure

Set up the foundational directories:
- `webapp/lib/` - Utility functions and shared logic
- `webapp/types/` - TypeScript type definitions
- `webapp/components/` - React components (already created by create-next-app)
- `webapp/app/api/` - API routes (already created by create-next-app)

### 3. Environment Variable Configuration

Create two files in `webapp/`:

**`.env.example`** - Template for required environment variables:
```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/...
```

**`.env.local`** - Local development environment file (will be gitignored automatically by Next.js).

### 4. Update .gitignore

Ensure `.env.local` is in the webapp's `.gitignore` (Next.js includes this by default, but verify).

### 5. Update Root README

Update `/Users/diyarkudrat/databricks_data_sharing_project/README.md` to reflect the new webapp directory structure and point to the webapp's documentation.

## Files to Create/Modify

- Run command to create: `webapp/` (entire Next.js app)
- Create: `webapp/lib/` directory
- Create: `webapp/types/` directory
- Create: `webapp/.env.example`
- Create: `webapp/.env.local` (empty template for developer to fill)
- Verify: `webapp/.gitignore` includes `.env.local`
- Update: Root `README.md` with webapp location

## Notes

- The `webapp/` directory will contain the complete Next.js application
- Documentation in `docs/` remains at the root level
- This setup keeps the project organized with clear separation between docs and application code
