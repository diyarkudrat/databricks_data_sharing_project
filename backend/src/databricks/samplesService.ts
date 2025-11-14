import { executeQuery } from './queryService';
import type { QueryResult } from '../types';

// List schemas ("databases") under the `samples` catalog.
export async function listSampleSchemas(): Promise<QueryResult> {
  const sql = 'SHOW SCHEMAS IN samples';
  return executeQuery(sql);
}
