'use client';

export type ConnectionState = 'ok' | 'error' | 'unknown';

export interface ConnectionStatusProps {
  state: ConnectionState;
  message?: string;
}

const STATE_STYLES: Record<ConnectionState, string> = {
  ok: 'bg-emerald-500',
  error: 'bg-red-500',
  unknown: 'bg-zinc-400',
};

const STATE_LABEL: Record<ConnectionState, string> = {
  ok: 'Connected to backend',
  error: 'Backend error',
  unknown: 'Status unknown',
};

export function ConnectionStatus({ state, message }: ConnectionStatusProps) {
  const dotClass = STATE_STYLES[state];
  const label = message ?? STATE_LABEL[state];

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}
