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

interface AccuWeatherResponse {
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

export async function fetchAccuWeather(options?: {
  city?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<QueryResult> {
  const search = new URLSearchParams();

  if (options?.city) search.set('city', options.city);
  if (options?.startDate) search.set('startDate', options.startDate);
  if (options?.endDate) search.set('endDate', options.endDate);
  if (typeof options?.limit === 'number') {
    search.set('limit', String(options.limit));
  }

  const qs = search.toString();
  const url = qs
    ? `${BACKEND_URL}/api/accuweather?${qs}`
    : `${BACKEND_URL}/api/accuweather`;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch AccuWeather data: ${res.status}`);
  }

  const data = (await res.json()) as AccuWeatherResponse;
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
