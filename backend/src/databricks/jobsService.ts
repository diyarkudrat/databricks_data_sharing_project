import { loadConfig } from '../config';

const config = loadConfig();

// Helper to get headers
const getHeaders = () => ({
  Authorization: `Bearer ${config.databricksToken}`,
  'Content-Type': 'application/json',
});

// Helper to get base URL (removes trailing slash if present)
const getBaseUrl = () => {
  const host = config.databricksHost.replace(/\/$/, '');
  // Ensure protocol
  if (!host.startsWith('http')) {
    return `https://${host}`;
  }
  return host;
};

export interface JobRunResult {
  run_id: number;
  number_in_job: number;
}

export interface RunStatus {
  run_id: number;
  state: {
    life_cycle_state: 'PENDING' | 'RUNNING' | 'TERMINATING' | 'TERMINATED' | 'SKIPPED' | 'INTERNAL_ERROR';
    result_state?: 'SUCCESS' | 'FAILED' | 'TIMEDOUT' | 'CANCELED';
    state_message?: string;
  };
  task_id?: string;
}

/**
 * Triggers a specific Databricks Job to run immediately.
 * API: POST /api/2.1/jobs/run-now
 */
export async function triggerJob(jobId: string): Promise<JobRunResult> {
  const url = `${getBaseUrl()}/api/2.1/jobs/run-now`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ job_id: jobId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger job ${jobId}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data as JobRunResult;
}

/**
 * Gets the status of a specific Job Run.
 * API: GET /api/2.1/jobs/runs/get?run_id=<run_id>
 */
export async function getRunStatus(runId: string): Promise<RunStatus> {
  const url = `${getBaseUrl()}/api/2.1/jobs/runs/get?run_id=${runId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get run status for ${runId}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data as RunStatus;
}
