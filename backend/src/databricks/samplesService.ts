import { executeQuery, DatabricksQueryError } from './queryService';
import type { QueryResult } from '../types';

// List schemas ("databases") under the `samples` catalog.
export async function listSampleSchemas(): Promise<QueryResult> {
  const sql = 'SHOW SCHEMAS IN samples';
  try {
    return await executeQuery(sql);
  } catch (error) {
    // Wrap or rethrow with context if needed, or let the global error handler catch it.
    // For now, we just ensure it propagates correctly as a DatabricksQueryError.
    if (error instanceof DatabricksQueryError) {
      throw error;
    }
    throw new DatabricksQueryError('SAMPLES_LIST_FAILED', 'Failed to list schemas in samples catalog', error);
  }
}
