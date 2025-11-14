'use client';

import type { QueryResult } from '@/types/query';

export interface ResultsTableProps {
  result: QueryResult | null;
}

export function ResultsTable({ result }: ResultsTableProps) {
  if (!result) {
    return null;
  }

  const { columns, rows } = result;

  if (!columns.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No columns returned.</p>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No results.</p>
    );
  }

  return (
    <div className="mt-4 max-h-80 overflow-auto rounded-md border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-950">
      <table className="min-w-full border-collapse">
        <thead className="bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.name}
                className="border-b border-zinc-200 px-3 py-2 text-left font-medium dark:border-zinc-700"
              >
                <div>{col.name}</div>
                <div className="text-[0.65rem] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {col.type}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
              {columns.map((col, colIndex) => {
                const value = row[colIndex];
                const display =
                  value === null || typeof value === 'undefined'
                    ? 'NULL'
                    : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value);

                return (
                  <td
                    key={col.name}
                    className="border-t border-zinc-200 px-3 py-1.5 align-top text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
                    title={display}
                  >
                    <span className="line-clamp-2 break-words">{display}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
