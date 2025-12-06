import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
import type { Column } from '../types';

dotenv.config();

const connectionOptions = {
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USERNAME || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
  database: process.env.SNOWFLAKE_DATABASE || '',
  schema: process.env.SNOWFLAKE_SCHEMA || '',
  role: process.env.SNOWFLAKE_ROLE || '',
};

const stageName = (process.env.SNOWFLAKE_STAGE || 'S3_SHARE_STAGE').replace(/^@/, '');
const targetDatabase = process.env.SNOWFLAKE_DATABASE || 'SNOWFLAKE_LEARNING_DB';
const targetSchema = process.env.SNOWFLAKE_SCHEMA || 'DIYARKUDRAT_LOAD_DATA_FROM_AMAZON_AWS';

function getConnection(): snowflake.Connection {
  return snowflake.createConnection(connectionOptions);
}

async function executeQuery(sqlText: string, binds: any[] = []): Promise<any[]> {
  const connection = getConnection();

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake: ' + err.message);
        reject(err);
        return;
      }

      conn.execute({
        sqlText,
        binds,
        complete: (error, _stmt, rows) => {
          if (error) {
            console.error('Failed to execute statement due to the following error: ' + error.message);
            reject(error);
          } else {
            resolve(rows || []);
          }

          connection.destroy((destroyErr) => {
            if (destroyErr) console.error('Error destroying connection:', destroyErr);
          });
        },
      });
    });
  });
}

function sanitizeIdentifier(raw: string | undefined, fallback: string): string {
  const safe = (raw || '')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, '_$1');
  return safe || fallback;
}

function mapToSnowflakeType(rawType: string | undefined): string {
  const t = (rawType || '').toLowerCase();
  if (t.includes('int')) return 'NUMBER';
  if (t.includes('decimal') || t.includes('numeric')) return 'NUMBER';
  if (t.includes('double')) return 'DOUBLE';
  if (t.includes('float') || t.includes('real')) return 'FLOAT';
  if (t.includes('bool')) return 'BOOLEAN';
  if (t.includes('date')) return 'DATE';
  if (t.includes('timestamp')) return 'TIMESTAMP_NTZ';
  if (t.includes('time')) return 'TIME';
  if (t.includes('binary')) return 'BINARY';
  if (t.includes('variant') || t.includes('json')) return 'VARIANT';
  if (t.includes('map') || t.includes('array') || t.includes('struct')) return 'VARIANT';
  return 'STRING';
}

function normalizeColumns(columns: Column[]): { name: string; type: string; rawName: string }[] {
  const seen = new Set<string>();

  return columns.map((col, idx) => {
    const rawName = col.name || `col_${idx + 1}`;
    const base = sanitizeIdentifier(rawName, `col_${idx + 1}`);
    let candidate = base;
    let counter = 1;
    while (seen.has(candidate)) {
      counter += 1;
      candidate = `${base}_${counter}`;
    }
    seen.add(candidate);
    return { name: candidate, type: col.type || 'string', rawName };
  });
}

export async function loadExportedRun({
  runId,
  columns,
}: {
  runId: string;
  columns: Column[];
}): Promise<{ rowsLoaded: number; stageFilesCount: number; raw: any[] }> {
  const sanitizedRunId = sanitizeIdentifier(runId, 'run');
  const schema = `${targetDatabase}.${targetSchema}`;
  const table = `${schema}.${sanitizedRunId}`;
  const stagePath = `@${stageName}/runs/run_id=${runId}/`;

  const normalizedCols = normalizeColumns(columns);
  const columnDefs = normalizedCols
    .map((c) => `"${c.name}" ${mapToSnowflakeType(c.type)}`)
    .join(', ');

  await executeQuery(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  await executeQuery(`CREATE OR REPLACE TABLE ${table} (${columnDefs})`);

  const selectList = normalizedCols
    .map((c, idx) => `${parquetFieldRef(c.rawName, idx)} AS "${c.name}"`)
    .join(', ');

  const copySql = `
    COPY INTO ${table}
    FROM (
      SELECT ${selectList} FROM ${stagePath}
    )
    FILE_FORMAT = (TYPE = PARQUET)
    ON_ERROR = 'ABORT_STATEMENT'
  `;

  const listResult = await executeQuery(`LIST ${stagePath}`);
  const stageFilesCount = Array.isArray(listResult) ? listResult.length : 0;

  const copyResult = await executeQuery(copySql);
  const info = Array.isArray(copyResult) && copyResult.length > 0 ? (copyResult[0] as any) : {};
  const rowsLoaded = Number(
    info.rows_loaded ??
      info.ROWS_LOADED ??
      info['rows loaded'] ??
      info['ROWS LOADED'] ??
      info['rows_loaded'] ??
      0,
  );

  let tableCount = -1;
  try {
    const countRows = await executeQuery(`SELECT COUNT(*) AS cnt FROM ${table}`);
    if (Array.isArray(countRows) && countRows.length > 0) {
      const row = countRows[0] as any;
      tableCount =
        Number(row.cnt ?? row.CNT ?? row['COUNT(*)'] ?? row['count(*)'] ?? row[0] ?? -1);
    }
  } catch (err) {
    console.warn(`[Snowflake] Failed to count rows in ${table}:`, err);
  }

  console.log(
    `[Snowflake] Loaded run ${runId} into ${table} (stage_files=${stageFilesCount}, rows_loaded=${rowsLoaded}, table_count=${tableCount})`,
  );
  return { rowsLoaded, stageFilesCount, raw: copyResult };
}

function parquetFieldRef(rawName: string, idx: number): string {
  // Prefer name-based extraction; fallback to positional if name missing
  const escaped = (rawName || '').replace(/"/g, '""');
  if (escaped) {
    return `$1:"${escaped}"`;
  }
  return `$1[${idx}]`;
}
