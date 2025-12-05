import { loadConfig } from '../config';

const config = loadConfig();

const getHeaders = () => ({
  Authorization: `Bearer ${config.databricksToken}`,
  'Content-Type': 'application/json',
});

const getBaseUrl = () => {
  const host = config.databricksHost.replace(/\/$/, '');
  if (!host.startsWith('http')) {
    return `https://${host}`;
  }
  return host;
};

export interface DataSource {
  id: string;
  name: string;
  warehouse_id: string;
}

/**
 * Lists all data sources available in the workspace.
 * API: GET /api/2.0/preview/sql/data_sources
 */
export async function listDataSources(): Promise<DataSource[]> {
  const url = `${getBaseUrl()}/api/2.0/preview/sql/data_sources`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list data sources: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data as DataSource[];
}
