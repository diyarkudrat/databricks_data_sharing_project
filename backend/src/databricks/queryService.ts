import type { DBSQLClient } from '@databricks/sql';
import { getClient } from './client';
import { loadConfig } from '../config';
import type { QueryResult, Column } from '../types';

export interface ExecuteQueryOptions {
  maxRetries?: number;
}

export class DatabricksQueryError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'DatabricksQueryError';
  }
}

export async function executeQuery(
  sql: string,
  options: ExecuteQueryOptions = {},
): Promise<QueryResult> {
  const { maxRetries = 2 } = options;
  const client = getClient();
  const config = loadConfig();

  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // The SDK types are loosely modeled here using 'any' to avoid
      // tight coupling to a specific driver version.
      await (client as any).connect({
        host: config.databricksHost,
        path: config.databricksHttpPath,
        token: config.databricksToken,
      });

      const session: any = await (client as any).openSession();
      const operation: any = await session.executeStatement(sql, {
        runAsync: false,
      });

      const fetchedRows: unknown[] = (await operation.fetchAll?.()) ?? [];

      const metaColumns: any[] =
        operation.getSchema?.().columns ??
        operation.metadata?.columns ??
        [];

      let columns: Column[];
      let rows: unknown[][];

      if (metaColumns.length > 0) {
        // Standard path: driver provides column metadata and rows as arrays.
        columns = metaColumns.map((col: any) => ({
          name: col.name ?? '',
          type: col.type ?? 'string',
          nullable: col.nullable ?? null,
        }));
        rows = fetchedRows as unknown[][];
      } else if (fetchedRows.length > 0 && fetchedRows[0] && typeof fetchedRows[0] === 'object' && !Array.isArray(fetchedRows[0])) {
        // Fallback path: some Databricks operations (e.g., SHOW TABLES IN samples.db)
        // return rows as objects with no column metadata. Synthesize columns from keys
        // and turn each row into an ordered array of cell values.
        const firstRow = fetchedRows[0] as Record<string, unknown>;
        const keys = Object.keys(firstRow);

        columns = keys.map((name) => ({
          name,
          type: 'string',
          nullable: null,
        }));

        rows = fetchedRows.map((raw) => {
          const obj = raw as Record<string, unknown>;
          return keys.map((k) => obj[k]);
        });
      } else {
        // No metadata and no rows; return empty result.
        columns = [];
        rows = [];
      }

      await operation.close?.();
      await session.close?.();

      return { columns, rows };
    } catch (error) {
      attempt += 1;

      const isLastAttempt = attempt > maxRetries;

      if (isLastAttempt) {
        throw new DatabricksQueryError(
          'QUERY_FAILED',
          error instanceof Error ? error.message : 'Unknown Databricks error',
        );
      }

      // Simple linear backoff between retries.
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}
