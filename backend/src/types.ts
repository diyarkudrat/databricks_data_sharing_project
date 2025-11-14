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

export interface Warehouse {
  id: string;
  name: string;
  state?: string;
  size?: string;
}

export interface TableInfo {
  catalog?: string | null;
  schema?: string | null;
  name: string;
  comment?: string | null;
}

export interface QueryRequest {
  sql: string;
  params?: Record<string, unknown>;
}

export interface QueryResponse {
  result: QueryResult;
}
