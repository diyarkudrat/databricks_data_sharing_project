import { v4 as uuidv4 } from 'uuid';
import { syncStore } from './syncStore';
import { executeQuery, describeTableColumns, inferColumnsFromQuery, countRowsForQuery } from '../databricks/queryService';
import { loadExportedRun } from '../snowflake/snowflakeService';

const EXPORT_BASE_PATH = 's3://databricks-snowflake-share/runs';

export async function startSync(params: { sql: string; sourceTable?: string }): Promise<string> {
  const { sql, sourceTable } = params;
  const trimmed = sql?.trim();
  if (!trimmed) {
    throw new Error('SQL is required to start sync');
  }

  const runId = uuidv4();
  syncStore.createRun(runId);
  syncStore.addLog(runId, 'Received sync request with user SQL.');

  runBackgroundSync({ runId, sql: trimmed, sourceTable }).catch((err) => {
    console.error(`Unhandled error in background sync for ${runId}:`, err);
    syncStore.updateStatus(runId, 'FAILED', `Critical system error: ${err.message}`);
  });

  return runId;
}

async function runBackgroundSync(params: { runId: string; sql: string; sourceTable?: string }) {
  const { runId, sql, sourceTable } = params;

  try {
    syncStore.updateStatus(runId, 'EXPORTING', 'Running Databricks export to S3...');

    const expectedCount = await safeCount(sql);
    syncStore.addLog(runId, `Expected rows from query: ${expectedCount}`);

    const exportSql = buildExportSql(runId, sql);
    syncStore.addLog(runId, `Executing export SQL to ${EXPORT_BASE_PATH}/run_id=${runId}`);
    await executeQuery(exportSql);
    syncStore.addLog(runId, 'Export completed.');

    const columns = await resolveColumns({ sql, sourceTable });
    syncStore.addLog(runId, `Resolved ${columns.length} columns for Snowflake load.`);

    syncStore.updateStatus(runId, 'IMPORTING', 'Loading export into Snowflake...');
    const loadResult = await loadExportedRun({ runId, columns });
    syncStore.addLog(
      runId,
      `Snowflake COPY completed: rows_loaded=${loadResult.rowsLoaded}, stage_files=${loadResult.stageFilesCount} (run table = ${runId}).`,
    );

    syncStore.updateStatus(runId, 'COMPLETED', 'Data sync completed successfully.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    syncStore.updateStatus(runId, 'FAILED', message);
  }
}

function buildExportSql(runId: string, userSql: string): string {
  const path = `${EXPORT_BASE_PATH}/run_id=${runId}`;
  return [
    `INSERT OVERWRITE DIRECTORY '${path}'`,
    'USING PARQUET',
    userSql.endsWith(';') ? userSql : `${userSql};`,
  ].join('\n');
}

async function resolveColumns(params: { sql: string; sourceTable?: string }) {
  const { sql, sourceTable } = params;
  if (sourceTable) {
    return describeTableColumns(sourceTable);
  }
  return inferColumnsFromQuery(sql);
}

async function safeCount(sql: string): Promise<number> {
  try {
    return await countRowsForQuery(sql);
  } catch (err) {
    console.warn('Failed to count rows for query; proceeding without expected count.', err);
    return -1;
  }
}
