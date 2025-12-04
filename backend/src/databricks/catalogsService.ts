import { executeQuery } from './queryService';

/**
 * List catalog names visible in the connected SQL warehouse.
 * Returns an array of catalog name strings.
 */
export async function listCatalogs(): Promise<string[]> {
  const sql = 'SHOW CATALOGS';
  const result = await executeQuery(sql);

  // Robust column finding:
  // 1. Try exact match for 'catalog_name' (standard).
  // 2. Try 'catalog'.
  // 3. Fallback to 'name'.
  // 4. Absolute fallback to index 0.
  const lowerNames = result.columns.map((c) => c.name.toLowerCase());
  
  const targetCol = ['catalog_name', 'catalog', 'name'];
  let nameIndex = -1;

  for (const candidate of targetCol) {
    nameIndex = lowerNames.indexOf(candidate);
    if (nameIndex >= 0) break;
  }

  if (nameIndex < 0 && result.columns.length > 0) {
    nameIndex = 0;
  }

  const catalogs: string[] = [];

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    const cell = row[nameIndex];

    if (typeof cell === 'string' && cell.trim().length > 0) {
      catalogs.push(cell);
    } else if (cell && typeof cell === 'object') {
      // Handle potential object-wrapped values (rare but possible in some drivers)
      const val = (cell as any).toString();
      if (val) catalogs.push(val);
    }
  }

  // Best-effort: ensure the well-known `samples` catalog is included 
  // if accessible, even if not returned by SHOW CATALOGS (e.g. shared catalogs).
  if (!catalogs.includes('samples')) {
    try {
      const probe = await executeQuery('SHOW SCHEMAS IN samples');
      if (probe.rows.length > 0) {
        catalogs.push('samples');
      }
    } catch (e) {
      // Silence error; likely permission denied or catalog doesn't exist.
    }
  }

  return catalogs;
}
