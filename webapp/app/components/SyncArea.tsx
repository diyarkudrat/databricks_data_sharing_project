'use client';

import { useState } from 'react';
import { QueryRunner } from '@/components/QueryRunner';
import { DataShareManager } from '@/app/components/DataShareManager';

export function SyncArea() {
  const [sql, setSql] = useState<string>('SELECT 1');
  const [sourceTable, setSourceTable] = useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl mt-10 space-y-8">
      <QueryRunner
        sqlValue={sql}
        onSqlChange={setSql}
        onTableSelected={(table) => setSourceTable(table)}
      />
      <DataShareManager sql={sql} sourceTable={sourceTable ?? undefined} />
    </div>
  );
}
