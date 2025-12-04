import type { DBSQLClient } from '@databricks/sql';
import { getClient } from './client';
import { loadConfig } from '../config';
import type { QueryResult, Column } from '../types';

export interface ExecuteQueryOptions {
  maxRetries?: number;
}

export class DatabricksQueryError extends Error {
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.cause = cause;
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
    let session: any = null;
    let operation: any = null;

    try {
      // Connect if not already connected (client handles this check internally usually,
      // but explicit connect call is safe).
      // Using 'any' to avoid tight coupling to specific driver versions
      await (client as any).connect({
        host: config.databricksHost,
        path: config.databricksHttpPath,
        token: config.databricksToken,
      });

      session = await (client as any).openSession();
      operation = await session.executeStatement(sql, {
        runAsync: false,
      });

      const fetchedRows: unknown[] = (await operation.fetchAll?.()) ?? [];

      const metaColumns: any[] =
        operation.getSchema?.().columns ??
        operation.metadata?.columns ??
        [];

      const result = parseResult(metaColumns, fetchedRows);
      
      // Cleanup happens in finally block
      return result;

    } catch (error) {
      attempt += 1;
      const isLastAttempt = attempt > maxRetries;

      if (isLastAttempt) {
        throw new DatabricksQueryError(
          'QUERY_FAILED',
          error instanceof Error ? error.message : 'Unknown Databricks error',
          error
        );
      }

      // Backoff
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    } finally {
      // Ensure resources are released
      if (operation) {
        try {
          await operation.close?.();
        } catch {
          // Ignore close errors
        }
      }
      if (session) {
        try {
          await session.close?.();
        } catch {
          // Ignore close errors
        }
      }
    }
  }
}

/**
 * Helper to normalize Databricks driver results into our standard QueryResult.
 * Handles both standard (array of arrays) and fallback (array of objects) formats.
 */
function parseResult(metaColumns: any[], fetchedRows: unknown[]): QueryResult {
  let columns: Column[];
  let rows: unknown[][];

  if (metaColumns.length > 0) {
    // Standard path: driver provides column metadata
    columns = metaColumns.map((col: any) => ({
      name: col.name ?? '',
      type: col.type ?? 'string',
      nullable: col.nullable ?? null,
    }));
    rows = fetchedRows as unknown[][];
  } else if (fetchedRows.length > 0 && isRecord(fetchedRows[0])) {
    // Fallback path: object rows (e.g. some SHOW commands)
    // Synthesize columns from the first row's keys
    const firstRow = fetchedRows[0];
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
    // Empty result
    columns = [];
    rows = [];
  }

  return { columns, rows };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}
