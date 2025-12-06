"use client";

import { useState, useEffect } from "react";
import { startSync, fetchSyncRun, fetchSyncRuns, SyncRun } from "@/lib/backend";

interface DataShareManagerProps {
  sql: string | null;
  sourceTable?: string | null;
}

export function DataShareManager({ sql, sourceTable: sourceTableProp }: DataShareManagerProps) {
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<SyncRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<SyncRun[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceTable, setSourceTable] = useState<string>(sourceTableProp || "");

  useEffect(() => {
    setSourceTable(sourceTableProp || "");
  }, [sourceTableProp]);

  // Initial load of history
  useEffect(() => {
    fetchSyncRuns().then(setRecentRuns).catch(console.error);
  }, []);

  // Poll active run
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeRunId) {
      const checkStatus = async () => {
        try {
          const run = await fetchSyncRun(activeRunId);
          setActiveRun(run);

          // Refresh list if status changed to terminal
          if (run.status === 'COMPLETED' || run.status === 'FAILED') {
            fetchSyncRuns().then(setRecentRuns).catch(console.error);
            // Stop polling after a short delay to let user see success state
            if (run.status === 'FAILED') {
                // Keep it active so they see the error
            } else {
                // Optional: Clear active run after 5 seconds?
                // For now keep it visible.
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      };

      checkStatus();
      interval = setInterval(checkStatus, 5000); // Poll every 5s
    }

    return () => clearInterval(interval);
  }, [activeRunId]);

  const handleRun = async () => {
    setIsStarting(true);
    setError(null);
    setActiveRun(null);

    if (!sql || !sql.trim()) {
      setError("SQL is required to start sync.");
      setIsStarting(false);
      return;
    }

    try {
      const { runId } = await startSync({ sql, sourceTable: sourceTable.trim() || undefined });
      setActiveRunId(runId);
      // Refresh list immediately to show the new pending run
      fetchSyncRuns().then(setRecentRuns).catch(console.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sync");
    } finally {
      setIsStarting(false);
    }
  };

  const isRunning = activeRun?.status === 'PENDING' || activeRun?.status === 'EXPORTING' || activeRun?.status === 'IMPORTING';

  return (
    <section className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Data Sync (Databricks → Snowflake)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Orchestrated export and import pipeline.
            </p>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || isStarting || !sql || !sql.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? "Starting..." : isRunning ? "Syncing..." : "Start Sync"}
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <p className="font-semibold mb-1">SQL to export</p>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-zinc-800 dark:text-zinc-100">
            {sql && sql.trim().length > 0 ? sql : "No SQL provided from editor."}
          </pre>
        </div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          Source table (optional, for schema inference)
        </label>
        <input
          value={sourceTable}
          onChange={(e) => setSourceTable(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="catalog.schema.table"
        />
        <p className="text-[0.7rem] text-zinc-500 dark:text-zinc-400">
          The sync pipeline will export the query to S3 then load into Snowflake (table named by runId).
          Providing a source table helps fetch column metadata; otherwise columns are inferred from the query.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Active Run Status */}
      {activeRun && (
        <div className="mb-8 rounded-md border border-zinc-200 p-4 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            Active Sync Status
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              ${activeRun.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                activeRun.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                'bg-blue-100 text-blue-800'}`}>
              {activeRun.status}
            </span>
            <span className="text-xs text-zinc-500 font-mono">{activeRun.id}</span>
          </div>
          
          {/* Logs Window */}
          <div className="bg-black rounded text-xs font-mono p-3 h-32 overflow-y-auto text-green-400">
            {activeRun.logs.length === 0 && <span className="text-zinc-500">Initializing...</span>}
            {activeRun.logs.map((log, i) => (
                <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-3">Recent Runs</h3>
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Started</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                    {recentRuns.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">No runs found.</td>
                        </tr>
                    ) : (
                        recentRuns.map((run) => (
                            <tr key={run.id}>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                        ${run.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                          run.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                                        {run.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                    {run.id.slice(0, 8)}...
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">
                                    {new Date(run.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">
                                    <button 
                                        onClick={() => setActiveRunId(run.id)}
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        View Logs
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </section>
  );
}
