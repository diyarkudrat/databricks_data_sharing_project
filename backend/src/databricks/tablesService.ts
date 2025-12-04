import type { TableInfo } from '../types';
import { executeQuery } from './queryService';

export interface ListTablesOptions {
  catalog?: string;
  schema?: string;
}

export async function listTables(options: ListTablesOptions = {}): Promise<TableInfo[]> {
  const { catalog, schema } = options;

  // Construct target for SHOW TABLES
  let target = '';
  if (catalog && schema) {
    target = `${catalog}.${schema}`;
  } else if (schema) {
    target = schema;
  }

  const sql = target ? `SHOW TABLES IN ${target}` : 'SHOW TABLES';
  const result = await executeQuery(sql);

  // Map results to TableInfo
  return result.rows.map((row) => parseTableRow(row, result.columns, catalog, schema));
}

/**
 * Parses a single row from SHOW TABLES result into TableInfo.
 * Handles both array-based (standard) and object-based (legacy/fallback) rows.
 */
function parseTableRow(
  row: unknown[],
  columns: { name: string }[],
  defaultCatalog?: string,
  defaultSchema?: string
): TableInfo {
  // Helper to find value by column name candidates
  const getValue = (candidates: string[]): string | null => {
    // 1. Try to find by column index match
    const colIndex = columns.findIndex(c => candidates.includes(c.name.toLowerCase()));
    if (colIndex >= 0 && colIndex < row.length) {
      return String(row[colIndex]);
    }
    return null;
  };

  // Schema resolution
  let schemaValue = defaultSchema ?? null;
  const foundSchema = getValue(['database', 'namespace', 'schema']);
  if (foundSchema && !defaultSchema) {
    schemaValue = foundSchema;
  }

  // Table Name resolution
  let nameValue = getValue(['tablename', 'table_name', 'name']);
  
  // Fallback: if no column match, assume first column is table name (common in some JDBC/ODBC paths)
  if (!nameValue && row.length > 0) {
    nameValue = String(row[0]);
  }

  return {
    catalog: defaultCatalog ?? null,
    schema: schemaValue,
    name: nameValue ?? '',
    comment: null,
  };
}
