import { Warehouse } from '@/types/warehouses';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  // This will surface during build or on first request in development
  // if the environment is not configured correctly.
  throw new Error('NEXT_PUBLIC_BACKEND_URL is not set. Check webapp/.env.local.');
}

interface WarehousesResponse {
  warehouses: Warehouse[];
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
