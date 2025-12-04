import { loadConfig } from '../config';
import type { Warehouse } from '../types';

interface DatabricksWarehouse {
  id?: string;
  warehouse_id?: string; // API v2.0 often uses 'id', but some contexts use 'warehouse_id'
  name?: string;
  state?: string;
  size?: string;
}

interface ListWarehousesResponse {
  warehouses?: DatabricksWarehouse[];
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const config = loadConfig();

  // Normalize host to ensure protocol presence
  const base = config.databricksHost.startsWith('http')
    ? config.databricksHost
    : `https://${config.databricksHost}`;

  const url = new URL('/api/2.0/sql/warehouses', base);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.databricksToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetails = `Status ${response.status}`;
      try {
        const errorBody = await response.text();
        errorDetails += `: ${errorBody}`;
      } catch {
        // ignore body read errors
      }
      throw new Error(`Failed to list warehouses: ${errorDetails}`);
    }

    const data = (await response.json()) as ListWarehousesResponse;
    const items = data.warehouses ?? [];

    return items.map((w): Warehouse => ({
      id: w.id ?? w.warehouse_id ?? '',
      name: w.name ?? 'Unknown Warehouse',
      state: w.state,
      size: w.size,
    }));
  } catch (error) {
    // Re-throw with context if it's not already our formatted error
    if (error instanceof Error && error.message.startsWith('Failed to list warehouses')) {
      throw error;
    }
    throw new Error(
      `Network error listing warehouses: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
