import { executeQuery } from './queryService';

// List catalog names visible in the connected SQL warehouse.
// Returns an array of catalog name strings, not the raw query result.
export async function listCatalogs(): Promise<string[]> {
  const sql = 'SHOW CATALOGS';
  const result = await executeQuery(sql);

  // Try to locate the catalog-name column based on common Databricks column names.
  const lowerNames = result.columns.map((c) => c.name.toLowerCase());
  let nameIndex = lowerNames.findIndex((n) =>
    ['catalog_name', 'catalog', 'name'].includes(n),
  );
  if (nameIndex < 0) {
    nameIndex = 0;
  }

  const catalogs = result.rows.map((row, idx) => {
    const cell = row[nameIndex] as unknown;
    if (cell && typeof cell === 'object') {
      const anyCell = cell as { catalog_name?: string; catalog?: string; name?: string };
      const value = anyCell.catalog_name ?? anyCell.catalog ?? anyCell.name;
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
      return JSON.stringify(cell);
    }
    return cell == null ? `row_${idx}` : String(cell);
  });

  // Best-effort: ensure the well-known `samples` catalog (Delta Shares Received)
  // is included if it is actually accessible in this workspace.
  if (!catalogs.includes('samples')) {
    try {
      const probe = await executeQuery('SHOW SCHEMAS IN samples');
      if (probe.rows.length > 0) {
        catalogs.push('samples');
      }
    } catch {
      // If the probe fails (no permission or catalog not present), just ignore.
    }
  }

  return catalogs;
}
