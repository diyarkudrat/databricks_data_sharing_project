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
  /**
   * Parameters to bind to the query.
   * Currently reserved for future use.
   */
  params?: Record<string, unknown>;
}

export interface QueryResponse {
  result: QueryResult;
}

export interface WarehousesResponse {
  warehouses: Warehouse[];
}

export interface CatalogsResponse {
  catalogs: string[];
}

export interface TablesResponse {
  tables: TableInfo[];
}

export interface SampleSchemasResponse {
  schemas: string[];
}

export interface SyncStartRequest {
  sql: string;
  sourceTable?: string;
}

export interface SyncStartResponse {
  runId: string;
}

export interface QuerySyncRequest {
  columns: Column[];
  rows: unknown[][];
  /**
   * Optional target table name (without schema/database). Defaults to "query_results".
   */
  targetTable?: string;
  /**
   * Optional target schema. Defaults to SNOWFLAKE_SCHEMA env or PUBLIC.
   */
  targetSchema?: string;
  /**
   * If true, the target table will be truncated before insert. Defaults to true.
   */
  truncate?: boolean;
}

export interface QuerySyncResponse {
  database: string;
  schema: string;
  table: string;
  rowCount: number;
  message?: string;
}
