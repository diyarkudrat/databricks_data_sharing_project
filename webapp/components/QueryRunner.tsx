'use client';

import React from 'react';
import { executeSql } from '@/lib/backend';
import type { QueryResult } from '@/types/query';
import { QueryEditor } from '@/components/QueryEditor';
import { ResultsTable } from '@/components/ResultsTable';
import { ConnectionStatus, type ConnectionState } from '@/components/ConnectionStatus';

export function QueryRunner() {
  const [sql, setSql] = React.useState<string>('SELECT 1');
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('unknown');

  const handleRun = async () => {
    if (!sql.trim()) {
      setError('Please enter a SQL query.');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const res = await executeSql(sql);
      setResult(res);
      setConnectionState('ok');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to execute query.';
      setError(message);
      setConnectionState('error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="mt-10 w-full max-w-3xl rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Query Databricks
        </h2>
        <ConnectionStatus state={connectionState} />
      </div>

      <QueryEditor
        value={sql}
        onChange={setSql}
        onSubmit={handleRun}
        isSubmitting={isRunning}
        placeholder="SELECT 1"
      />

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <ResultsTable result={result} />
    </section>
  );
}
