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

  // Ensure we have a fully qualified URL. The host in config is expected to be
  // something like `dbc-xxxx.cloud.databricks.com` (without protocol).
  const base =
    config.databricksHost.startsWith('http')
      ? config.databricksHost
      : `https://${config.databricksHost}`;

  const url = new URL('/api/2.0/sql/warehouses', base);

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
