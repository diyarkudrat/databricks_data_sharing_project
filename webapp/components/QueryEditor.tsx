'use client';

import React from 'react';

export interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function QueryEditor({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  placeholder,
}: QueryEditorProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isSubmitting) {
        onSubmit();
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
        SQL Query
      </label>
      <textarea
        className="h-40 w-full rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'SELECT 1'}
        spellCheck={false}
      />
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Press <kbd className="rounded bg-zinc-100 px-1 py-0.5 text-[0.7rem] font-semibold dark:bg-zinc-800">Ctrl+Enter</kbd>{' '}
          or{' '}
          <kbd className="rounded bg-zinc-100 px-1 py-0.5 text-[0.7rem] font-semibold dark:bg-zinc-800">Cmd+Enter</kbd> to run
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? 'Running…' : 'Run query'}
        </button>
      </div>
    </div>
  );
}
