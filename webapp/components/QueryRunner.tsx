'use client';

import React from 'react';
import { executeSql, fetchTables, fetchSampleSchemas, fetchCatalogs } from '@/lib/backend';
import type { QueryResult, TableInfo } from '@/types/query';
import { QueryEditor } from '@/components/QueryEditor';
import { ResultsTable } from '@/components/ResultsTable';
import { ConnectionStatus, type ConnectionState } from '@/components/ConnectionStatus';

export function QueryRunner() {
  const [sql, setSql] = React.useState<string>('SELECT 1');
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('unknown');

  const [databases, setDatabases] = React.useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = React.useState(false);
  const [databasesError, setDatabasesError] = React.useState<string | null>(null);
  const [selectedDatabase, setSelectedDatabase] = React.useState<string>('');

  const [tables, setTables] = React.useState<TableInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = React.useState(false);
  const [tablesError, setTablesError] = React.useState<string | null>(null);

  // NOTE:
  // We currently focus the UI on the well-known `samples` catalog. The backend
  // exposes a generic `/catalogs` endpoint and `fetchCatalogs()` helper so that
  // this component (or others) could be extended to let users pick any visible
  // catalog, then drill into schemas/tables. For the MVP, we only auto-load
  // schemas under `samples` and use `fetchTables({ catalog: 'samples', schema })`.

  // Load databases (schemas) under `samples` catalog
  React.useEffect(() => {
    let cancelled = false;

    const loadDatabases = async () => {
      setIsLoadingDatabases(true);
      setDatabasesError(null);
      try {
        const data = await fetchSampleSchemas();
        if (!cancelled) {
          setDatabases(data);
          // Optionally auto-select a common database such as accuweather if present
          const defaultDb = data.includes('accuweather') ? 'accuweather' : data[0] ?? '';
          setSelectedDatabase(defaultDb);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load databases for samples catalog.';
          setDatabasesError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDatabases(false);
        }
      }
    };

    void loadDatabases();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load tables when schema changes
  React.useEffect(() => {
    if (!selectedDatabase) {
      setTables([]);
      setTablesError(null);
      return;
    }

    let cancelled = false;

    const loadTables = async () => {
      setIsLoadingTables(true);
      setTablesError(null);
      try {
        const data = await fetchTables({ catalog: 'samples', schema: selectedDatabase });
        if (!cancelled) {
          setTables(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : `Failed to load tables for samples.${selectedDatabase}.`;
          setTablesError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTables(false);
        }
      }
    };

    void loadTables();

    return () => {
      cancelled = true;
    };
  }, [selectedDatabase]);

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

      <div className="mb-4 flex flex-col gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">
            Database under <code>samples</code> catalog
          </label>
          <p className="text-[0.7rem] text-zinc-500 dark:text-zinc-400">
            Choose a database from the <code>samples</code> catalog to explore its tables.
          </p>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            value={selectedDatabase}
            disabled={isLoadingDatabases || !!databasesError || databases.length === 0}
            onChange={(e) => {
              const database = e.target.value;
              setSelectedDatabase(database);
              setTables([]);
              setTablesError(null);
              setError(null);
              setResult(null);
            }}
          >
            <option value="" disabled>
              {isLoadingDatabases
                ? 'Loading databases...'
                : databasesError
                ? 'Failed to load databases for samples catalog'
                : databases.length === 0
                ? 'No databases found in samples catalog'
                : 'Select a database under samples'}
            </option>
            {databases.map((db) => (
              <option key={db} value={db}>
                {db}
              </option>
            ))}
          </select>
          {databasesError && (
            <p className="text-[0.7rem] text-red-600 dark:text-red-400">{databasesError}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">
            Tables in{' '}
            <code>{selectedDatabase ? `samples.${selectedDatabase}` : 'samples'}</code>
          </label>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={
              !selectedDatabase || isLoadingTables || !!tablesError || tables.length === 0
            }
            onChange={(e) => {
              const tableName = e.target.value;
              if (!tableName) return;
              setSql(`SELECT * FROM samples.${selectedDatabase}.${tableName} LIMIT 100`);
              setError(null);
              setResult(null);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              {isLoadingTables
                ? 'Loading tables...'
                : tablesError
                ? 'Failed to load tables'
                : tables.length === 0
                ? 'No tables found'
                : 'Select a table'}
            </option>
            {tables
              .filter((t) => t.name && t.name.trim().length > 0)
              .map((t, index) => {
                const key = `${t.catalog ?? ''}:${t.schema ?? ''}:${t.name}`;
                const label = t.schema ? `${t.schema}.${t.name}` : t.name;
                return (
                  <option key={key || index} value={t.name}>
                    {label}
                  </option>
                );
              })}
          </select>
          {tablesError && (
            <p className="text-[0.7rem] text-red-600 dark:text-red-400">{tablesError}</p>
          )}
        </div>
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
