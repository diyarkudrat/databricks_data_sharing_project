import { loadConfig } from '../config';
import type { Warehouse } from '../types';

interface DatabricksWarehouse {
  id?: string;
  warehouse_id?: string;
  name?: string;
  state?: string;
  size?: string;
}

interface ListWarehousesResponse {
  warehouses?: DatabricksWarehouse[];
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const config = loadConfig();

  const url = new URL('/api/2.0/sql/warehouses', config.databricksHost);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.databricksToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Databricks warehouses request failed with status ${response.status}`);
  }

  const data = (await response.json()) as ListWarehousesResponse;
  const items = data.warehouses ?? [];

  return items.map((w): Warehouse => ({
    id: w.id ?? w.warehouse_id ?? '',
    name: w.name ?? '',
    state: w.state,
    size: w.size,
  }));
}
