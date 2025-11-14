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

      const allRows: unknown[][] = (await operation.fetchAll?.()) ?? [];

      const metaColumns: any[] =
        operation.getSchema?.().columns ??
        operation.metadata?.columns ??
        [];

      const columns: Column[] = metaColumns.map((col: any) => ({
        name: col.name ?? '',
        type: col.type ?? 'string',
        nullable: col.nullable ?? null,
      }));

      await operation.close?.();
      await session.close?.();

      return { columns, rows: allRows };
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
