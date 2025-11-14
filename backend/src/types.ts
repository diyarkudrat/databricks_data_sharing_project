export interface Column {
  name: string;
  type: string;
  nullable: boolean | null;
}

export interface QueryResult {
  columns: Column[];
  rows: unknown[][];
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
