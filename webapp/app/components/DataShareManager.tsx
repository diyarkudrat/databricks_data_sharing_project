"use client";

import { useState, useEffect } from "react";
import { triggerJob, getJobRunStatus, RunStatus } from "@/lib/backend";

export function DataShareManager() {
  const [jobId, setJobId] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!jobId.trim()) {
      setError("Please enter a valid Job ID.");
      return;
    }
    setIsStarting(true);
    setError(null);
    setRunId(null);
    setStatus(null);

    try {
      const result = await triggerJob(jobId);
      setRunId(result.run_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job");
      setIsStarting(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (runId) {
      const checkStatus = async () => {
        try {
          const s = await getJobRunStatus(String(runId));
          setStatus(s);

          const state = s.state.life_cycle_state;
          if (
            state === "TERMINATED" ||
            state === "SKIPPED" ||
            state === "INTERNAL_ERROR"
          ) {
            setIsStarting(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
          // Don't stop polling immediately on transient errors, 
          // but maybe show a warning? For now, just log.
        }
      };

      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }

    return () => clearInterval(interval);
  }, [runId]);

  const isRunning =
    status?.state.life_cycle_state === "RUNNING" ||
    status?.state.life_cycle_state === "PENDING" ||
    isStarting;

  const isSuccess = status?.state.result_state === "SUCCESS";

  return (
    <section className="w-full max-w-xl rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900 mt-6">
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Databricks Data Export
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Trigger the Databricks Job to export data to S3 (Snowflake Share).
      </p>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Enter Databricks Job ID"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          onClick={handleRun}
          disabled={isRunning || !jobId}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? "Starting..." : isRunning ? "Running..." : "Run Export"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      {status && (
        <div className="mt-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Job Status (Run ID: {runId})
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status.state.life_cycle_state === "RUNNING"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : status.state.result_state === "SUCCESS"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : status.state.result_state === "FAILED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {status.state.life_cycle_state}
              {status.state.result_state ? ` - ${status.state.result_state}` : ""}
            </span>
          </div>
          {isSuccess && (
            <div className="mt-4 text-sm text-green-600 dark:text-green-400">
              <p>✅ Data successfully exported to S3!</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                The data is now ready for Snowflake ingestion.
              </p>
            </div>
          )}
          {status.state.state_message && (
             <p className="mt-2 text-xs text-zinc-500">{status.state.state_message}</p>
          )}
        </div>
      )}
    </section>
  );
}
