import { v4 as uuidv4 } from 'uuid';
import { syncStore } from './syncStore';
import { triggerJob, getRunStatus, getRunOutput, listJobs, createSqlJob } from '../databricks/jobsService';
import { listWarehouses } from '../databricks/warehousesService';
import { loadData } from '../snowflake/snowflakeService';

// Configuration constants
const POLLING_INTERVAL_MS = 30000; // 30 seconds
const MAX_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
// The standard job name we look for
const EXPORT_JOB_NAME = 'DATAPORTO_SNOWFLAKE_EXPORT_POC_V8';
// Fallback to env var if set manually
let CACHED_JOB_ID = process.env.DATABRICKS_EXPORT_JOB_ID || '';

/**
 * Ensures the Export Job exists in Databricks.
 * Strategy: Find by name -> Create if missing -> Return ID.
 */
async function ensureExportJobExists(): Promise<string> {
    if (CACHED_JOB_ID) return CACHED_JOB_ID;

    console.log(`[Sync] Checking for existing job: ${EXPORT_JOB_NAME}...`);
    
    // 1. Check if job exists
    const existingId = await listJobs(EXPORT_JOB_NAME);
    if (existingId) {
        console.log(`[Sync] Found existing job: ${existingId}`);
        CACHED_JOB_ID = String(existingId);
        return CACHED_JOB_ID;
    }

    // 2. Job missing, create it.
    console.log(`[Sync] Job not found. Creating new job...`);
    
    // We need a warehouse to run the SQL. Pick the first available one.
    const warehouses = await listWarehouses();
    if (warehouses.length === 0) {
        throw new Error("No SQL Warehouses found in Databricks. Cannot create export job.");
    }
    // Prefer a running warehouse, but pick first if none running.
    const runningWh = warehouses.find(w => w.state === 'RUNNING') || warehouses[0];
    const warehouseId = runningWh.id;

    // The SQL Query for the job
    // Note: We use {{job_parameters.run_id}} which is standard Databricks parameter syntax
    const sqlQuery = `
INSERT OVERWRITE DIRECTORY 's3://databricks-snowflake-share/runs/run_id={{run_id}}'
USING PARQUET
SELECT
  date,
  city_name,
  latitude,
  longitude,
  degree_days_cooling,
  humidity_relative_avg,
  cloud_cover_perc_avg
FROM samples.accuweather.forecast_daily_calendar_imperial
WHERE date >= '2024-01-01'
LIMIT 50;

    `.trim();

    const newJobId = await createSqlJob(EXPORT_JOB_NAME, warehouseId, sqlQuery);
    console.log(`[Sync] Created new job: ${newJobId}`);
    
    CACHED_JOB_ID = String(newJobId);
    return CACHED_JOB_ID;
}

export async function startSync(): Promise<string> {
  const runId = uuidv4();
  syncStore.createRun(runId);
  
  // Start background process
  runBackgroundSync(runId).catch(err => {
    console.error(`Unhandled error in background sync for ${runId}:`, err);
    syncStore.updateStatus(runId, 'FAILED', `Critical system error: ${err.message}`);
  });

  return runId;
}

async function runBackgroundSync(runId: string) {
  // Define dbRun variable outside so we can access it in catch block
  let dbRun: { run_id: number } | undefined;

  try {
    // 0. Ensure Job Exists
    const jobId = await ensureExportJobExists();
    syncStore.addLog(runId, `Using Databricks Job ID: ${jobId}`);

    // 1. Trigger Databricks Export
    syncStore.updateStatus(runId, 'EXPORTING', 'Triggering Databricks export job...');
    
    dbRun = await triggerJob(jobId, { run_id: runId }); 
    syncStore.setDatabricksRunId(runId, dbRun.run_id);
    syncStore.addLog(runId, `Databricks Run ID: ${dbRun.run_id} started.`);

    // 2. Poll for Completion
    const startTime = Date.now();
    let isExportComplete = false;

    while (!isExportComplete) {
      if (Date.now() - startTime > MAX_TIMEOUT_MS) {
        throw new Error('Databricks export timed out');
      }

      const status = await getRunStatus(String(dbRun.run_id));
      const state = status.state.life_cycle_state;
      const resultState = status.state.result_state;

      syncStore.addLog(runId, `Databricks Status: ${state}`);

      if (state === 'TERMINATED' || state === 'SKIPPED' || state === 'INTERNAL_ERROR') {
        if (resultState === 'SUCCESS') {
          isExportComplete = true;
          syncStore.addLog(runId, 'Export completed successfully.');
        } else {
          // If it failed, try to get more details from output
          const errorMsg = status.state.state_message || 'Unknown error';
          
          // Try to fetch run output for more details
          try {
              let targetRunId = String(dbRun.run_id);
              // If there are sub-tasks, pick the one that failed
              if (status.tasks && status.tasks.length > 0) {
                  const failedTask = status.tasks.find(t => t.state.result_state !== 'SUCCESS');
                  if (failedTask) {
                      targetRunId = String(failedTask.run_id);
                      syncStore.addLog(runId, `Inspecting failed task: ${failedTask.task_key} (Run ID: ${targetRunId})`);
                  }
              }

              const output = await getRunOutput(targetRunId);
              if (output && output.error) {
                 syncStore.addLog(runId, `Run Output Error: ${output.error}`);
              } else if (output && output.error_trace) {
                 syncStore.addLog(runId, `Run Output Trace: ${output.error_trace}`);
              } else {
                 // Sometimes output contains 'logs' or 'error' field differently
                 syncStore.addLog(runId, `Run Output: ${JSON.stringify(output).slice(0, 200)}...`);
              }
          } catch (e) {
              console.warn("Failed to fetch run output logs", e);
          }

          throw new Error(`Databricks job failed: ${resultState} - ${errorMsg}`);
        }
      } else {
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      }
    }

    // 3. Trigger Snowflake Import
    syncStore.updateStatus(runId, 'IMPORTING', 'Starting Snowflake import...');
    await loadData(runId);
    
    // 4. Completion
    syncStore.updateStatus(runId, 'COMPLETED', 'Data sync completed successfully.');

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    syncStore.updateStatus(runId, 'FAILED', message);
  }
}
