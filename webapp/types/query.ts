export interface Column {
  name: string;
  type: string;
  nullable: boolean | null;
}

export interface QueryResult {
  columns: Column[];
  rows: unknown[][];
}

export interface TableInfo {
  catalog?: string | null;
  schema?: string | null;
  name: string;
  comment?: string | null;
}
