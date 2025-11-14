'use client';

import React from 'react';
import { fetchAccuWeather } from '@/lib/backend';
import type { QueryResult } from '@/types/query';
import { ResultsTable } from '@/components/ResultsTable';
import { ConnectionStatus, type ConnectionState } from '@/components/ConnectionStatus';

export function AccuWeatherClient() {
  const [city, setCity] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [limit, setLimit] = React.useState<number | ''>(100);
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('unknown');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const effectiveLimit = typeof limit === 'number' ? limit : undefined;

      const data = await fetchAccuWeather({
        city: city || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: effectiveLimit,
      });

      setResult(data);
      setConnectionState('ok');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load AccuWeather data.';
      setError(message);
      setConnectionState('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-6 w-full max-w-3xl rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          AccuWeather Data Explorer
        </h2>
        <ConnectionStatus state={connectionState} />
      </div>

      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">
            City (optional)
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="e.g. New York"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">
            Start date (optional)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">
            End date (optional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">
            Limit
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => {
              const value = e.target.value;
              setLimit(value === '' ? '' : Number(value));
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading ? 'Loading…' : 'Load data'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <ResultsTable result={result} />
    </section>
  );
}
