import { DBSQLClient } from '@databricks/sql';
import { loadConfig } from '../config';

let cachedClient: DBSQLClient | null = null;

export function getClient(): DBSQLClient {
  if (cachedClient) {
    return cachedClient;
  }

  const config = loadConfig();

  const client = new DBSQLClient();

  // Connection configuration is applied when connecting in the query service.
  // Keeping this module focused on client construction and reuse.

  cachedClient = client;
  return client;
}
