import { DBSQLClient } from '@databricks/sql';

let cachedClient: DBSQLClient | null = null;

/**
 * Returns the singleton Databricks SQL client instance.
 * Initializes a new client if one does not exist.
 */
export function getClient(): DBSQLClient {
  if (cachedClient) {
    return cachedClient;
  }

  // Initialize the client. Connection details are provided
  // when opening a session, not at instantiation time.
  cachedClient = new DBSQLClient();
  
  return cachedClient;
}

/**
 * Closes the active client and clears the cache.
 * Useful for graceful shutdowns or testing.
 */
export async function closeClient(): Promise<void> {
  if (cachedClient) {
    try {
      await cachedClient.close();
    } catch (error) {
      console.error('Error closing Databricks client:', error);
    } finally {
      cachedClient = null;
    }
  }
}
