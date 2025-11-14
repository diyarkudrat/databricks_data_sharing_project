import type { TableInfo } from '../types';
import { executeQuery } from './queryService';

export interface ListTablesOptions {
  catalog?: string;
  schema?: string;
}

export async function listTables(options: ListTablesOptions = {}): Promise<TableInfo[]> {
  const { schema } = options;

  // For the MVP we use SHOW TABLES, optionally scoped to a schema/database.
  const sql = schema ? `SHOW TABLES IN ${schema}` : 'SHOW TABLES';

  const result = await executeQuery(sql);

  // Try to locate indices for schema/catalog and table name columns based on
  // common Databricks column names.
  const lowerNames = result.columns.map((c) => c.name.toLowerCase());

  const schemaIndex = lowerNames.findIndex((n) =>
    ['database', 'namespace', 'schema'].includes(n),
  );
  const nameIndex = lowerNames.findIndex((n) =>
    ['tablename', 'table_name', 'name'].includes(n),
  );

  return result.rows.map((row) => {
    const schemaValue =
      schemaIndex >= 0 && schemaIndex < row.length
        ? (row[schemaIndex] as string | null)
        : schema ?? null;

    const nameValue =
      nameIndex >= 0 && nameIndex < row.length
        ? (row[nameIndex] as string | null)
        : (row[0] as string | null);

    return {
      catalog: null,
      schema: schemaValue,
      name: nameValue ?? '',
      comment: null,
    } satisfies TableInfo;
  });
}
