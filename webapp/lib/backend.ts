import { Warehouse } from '@/types/warehouses';
import type { QueryResult, TableInfo } from '@/types/query';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  // This will surface during build or on first request in development
  // if the environment is not configured correctly.
  throw new Error('NEXT_PUBLIC_BACKEND_URL is not set. Check webapp/.env.local.');
}

interface WarehousesResponse {
  warehouses: Warehouse[];
}

interface TablesResponse {
  tables: TableInfo[];
}

interface CatalogsResponse {
  catalogs: string[];
}

interface QueryResponse {
  result: QueryResult;
}

interface SampleSchemasResponse {
  schemas: string[];
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${BACKEND_URL}/api/warehouses`, {
    // Ensure we always get fresh data from the backend when rendering
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch warehouses: ${res.status}`);
  }

  const data = (await res.json()) as WarehousesResponse;
  return data.warehouses ?? [];
}

export async function fetchTables(params?: {
  catalog?: string;
  schema?: string;
}): Promise<TableInfo[]> {
  const search = new URLSearchParams();
  if (params?.catalog) search.set('catalog', params.catalog);
  if (params?.schema) search.set('schema', params.schema);

  const qs = search.toString();
  const url = qs ? `${BACKEND_URL}/api/tables?${qs}` : `${BACKEND_URL}/api/tables`;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch tables: ${res.status}`);
  }

  const data = (await res.json()) as TablesResponse;
  return data.tables ?? [];
}

export async function fetchCatalogs(): Promise<string[]> {
  const res = await fetch(`${BACKEND_URL}/api/catalogs`, {
    // Always fetch fresh catalogs from the backend so we reflect current Databricks metadata.
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch catalogs: ${res.status}`);
  }

  const data = (await res.json()) as CatalogsResponse;
  return data.catalogs ?? [];
}

export async function executeSql(sql: string): Promise<QueryResult> {
  const res = await fetch(`${BACKEND_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    throw new Error(`Failed to execute SQL: ${res.status}`);
  }

  const data = (await res.json()) as QueryResponse;
  return data.result;
}

export async function fetchSampleSchemas(): Promise<string[]> {
  const res = await fetch(`${BACKEND_URL}/api/samples/schemas`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sample schemas: ${res.status}`);
  }

  const data = (await res.json()) as SampleSchemasResponse;
  return data.schemas ?? [];
}

export interface JobRunResult {
  run_id: number;
  number_in_job: number;
}

export interface RunStatus {
  run_id: number;
  state: {
    life_cycle_state: 'PENDING' | 'RUNNING' | 'TERMINATING' | 'TERMINATED' | 'SKIPPED' | 'INTERNAL_ERROR';
    result_state?: 'SUCCESS' | 'FAILED' | 'TIMEDOUT' | 'CANCELED';
    state_message?: string;
  };
}

export interface SyncRun {
  id: string;
  status: 'PENDING' | 'EXPORTING' | 'IMPORTING' | 'COMPLETED' | 'FAILED';
  databricksRunId?: number;
  logs: string[];
  createdAt: string;
  completedAt?: string;
}

export async function triggerJob(jobId: string): Promise<JobRunResult> {
  const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to trigger job: ${res.status}`);
  }

  return (await res.json()) as JobRunResult;
}

export async function getJobRunStatus(runId: string): Promise<RunStatus> {
  const res = await fetch(`${BACKEND_URL}/api/jobs/runs/${runId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to get job status: ${res.status}`);
  }

  const data = await res.json();
  return data.status as RunStatus;
}

export async function startSync(payload: { sql: string; sourceTable?: string }): Promise<{ runId: string }> {
  const res = await fetch(`${BACKEND_URL}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to start sync: ${res.status}`);
  }
  return res.json();
}

export async function fetchSyncRuns(): Promise<SyncRun[]> {
  const res = await fetch(`${BACKEND_URL}/api/sync`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch sync runs: ${res.status}`);
  }
  const data = await res.json();
  return data.runs ?? [];
}

export async function fetchSyncRun(id: string): Promise<SyncRun> {
  const res = await fetch(`${BACKEND_URL}/api/sync/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch sync run: ${res.status}`);
  }
  const data = await res.json();
  return data.run;
}
