import type { TableInfo } from '../types';
import { executeQuery } from './queryService';

export interface ListTablesOptions {
  catalog?: string;
  schema?: string;
}

export async function listTables(options: ListTablesOptions = {}): Promise<TableInfo[]> {
  const { catalog, schema } = options;

  // For the MVP we use SHOW TABLES, optionally scoped to a schema or catalog.schema.
  let target = '';
  if (catalog && schema) {
    target = `${catalog}.${schema}`;
  } else if (schema) {
    target = schema;
  }

  const sql = target ? `SHOW TABLES IN ${target}` : 'SHOW TABLES';

  const result = await executeQuery(sql);

  // Try to locate indices for schema/catalog and table name columns based on
  // common Databricks column names. This is used when rows are arrays.
  const lowerNames = result.columns.map((c) => c.name.toLowerCase());

  const schemaIndex = lowerNames.findIndex((n) =>
    ['database', 'namespace', 'schema'].includes(n),
  );
  const nameIndex = lowerNames.findIndex((n) =>
    ['tablename', 'table_name', 'name'].includes(n),
  );

  return result.rows.map((rawRow) => {
    const row: any = rawRow;

    let schemaValue: string | null = schema ?? null;
    let nameValue: string | null = null;

    if (Array.isArray(row)) {
      if (schemaIndex >= 0 && schemaIndex < row.length) {
        schemaValue = row[schemaIndex] as string | null;
      }

      if (nameIndex >= 0 && nameIndex < row.length) {
        nameValue = row[nameIndex] as string | null;
      } else {
        nameValue = row[0] as string | null;
      }
    } else if (row && typeof row === 'object') {
      // Some Databricks SHOW TABLES results (e.g., under samples) return rows
      // as objects like { database: 'accuweather', tableName: 'forecast_...' }.
      const dbCandidate =
        (row.database as string | undefined) ??
        (row.databaseName as string | undefined) ??
        (row.schema as string | undefined) ??
        (row.namespace as string | undefined);

      if (!schema && dbCandidate) {
        schemaValue = dbCandidate;
      }

      const tableCandidate =
        (row.tableName as string | undefined) ??
        (row.name as string | undefined) ??
        (row.tablename as string | undefined);

      if (tableCandidate) {
        nameValue = tableCandidate;
      }
    }

    return {
      catalog: catalog ?? null,
      schema: schemaValue,
      name: nameValue ?? '',
      comment: null,
    } satisfies TableInfo;
  });
}
