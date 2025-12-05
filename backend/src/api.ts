import express from 'express';
import type { ApiError } from './types';
import { executeQuery, DatabricksQueryError } from './databricks/queryService';
import { listWarehouses } from './databricks/warehousesService';
import { listTables } from './databricks/tablesService';
import { listSampleSchemas } from './databricks/samplesService';
import { listCatalogs } from './databricks/catalogsService';
import { triggerJob, getRunStatus } from './databricks/jobsService';
import { startSync } from './orchestrator/syncService';
import { syncStore } from './orchestrator/syncStore';

export const apiRouter = express.Router();

// Unified error handler helper
const handleApiError = (res: express.Response, error: unknown, code: string, message: string) => {
  console.error(`${message}:`, error);
  
  // If the error is already a structured API-friendly error (like DatabricksQueryError),
  // we might want to expose specific codes. For now, we wrap it.
  const apiError: ApiError = {
    code,
    message,
    details: process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : undefined,
  };

  res.status(500).json({ error: apiError });
};

apiRouter.get('/warehouses', async (_req, res) => {
  try {
    const warehouses = await listWarehouses();
    return res.json({ warehouses });
  } catch (err) {
    return handleApiError(res, err, 'WAREHOUSES_FETCH_FAILED', 'Failed to list Databricks warehouses');
  }
});

apiRouter.get('/catalogs', async (_req, res) => {
  try {
    const catalogs = await listCatalogs();
    return res.json({ catalogs });
  } catch (err) {
    return handleApiError(res, err, 'CATALOGS_FETCH_FAILED', 'Failed to list Databricks catalogs');
  }
});

apiRouter.get('/tables', async (req, res) => {
  const { catalog, schema } = req.query;

  if (Array.isArray(catalog) || Array.isArray(schema)) {
    const error: ApiError = {
      code: 'INVALID_REQUEST',
      message: 'Only single values are allowed for catalog and schema.',
    };
    return res.status(400).json({ error });
  }

  try {
    const tables = await listTables({
      catalog: catalog as string | undefined,
      schema: schema as string | undefined,
    });

    return res.json({ tables });
  } catch (err) {
    return handleApiError(res, err, 'TABLES_FETCH_FAILED', 'Failed to list Databricks tables');
  }
});

apiRouter.get('/samples/schemas', async (_req, res) => {
  try {
    const result = await listSampleSchemas();

    // The SHOW SCHEMAS result for samples can return either:
    // - rows as arrays, where one column contains the schema/database name, or
    // - rows as objects like { databaseName: 'accuweather' }.
    // We normalize this into a simple string[] of schema names.
    const lowerNames = result.columns.map((c) => c.name.toLowerCase());
    const schemaIndex = lowerNames.findIndex((n) =>
      ['namespace', 'database', 'schema', 'name'].includes(n),
    );

    const schemas: string[] = result.rows
      .map((rawRow) => {
        const row: any = rawRow;

        let cell: unknown;

        if (Array.isArray(row)) {
          if (schemaIndex >= 0 && schemaIndex < row.length) {
            cell = row[schemaIndex];
          } else {
            cell = row[0];
          }
        } else {
          // Row is an object like { databaseName: 'accuweather' }
          cell = row;
        }

        if (cell && typeof cell === 'object') {
          const anyCell = cell as { databaseName?: string; schemaName?: string; name?: string };
          return anyCell.databaseName ?? anyCell.schemaName ?? anyCell.name ?? '';
        }

        return cell == null ? '' : String(cell);
      })
      .filter((name) => name && name.trim().length > 0);

    return res.json({ schemas });
  } catch (err) {
    return handleApiError(res, err, 'SAMPLES_SCHEMAS_FAILED', 'Failed to list schemas under samples catalog');
  }
});

apiRouter.post('/query', async (req, res) => {
  const { sql, params } = req.body ?? {};

  if (typeof sql !== 'string' || !sql.trim()) {
    const error: ApiError = {
      code: 'INVALID_REQUEST',
      message: 'The "sql" field is required and must be a non-empty string.',
    };
    return res.status(400).json({ error });
  }

  if (
    typeof params !== 'undefined' &&
    (typeof params !== 'object' || Array.isArray(params))
  ) {
    const error: ApiError = {
      code: 'INVALID_REQUEST',
      message: 'If provided, "params" must be an object.',
    };
    return res.status(400).json({ error });
  }

  try {
    const result = await executeQuery(sql);
    return res.json({ result });
  } catch (err) {
    return handleApiError(res, err, 'QUERY_FAILED', 'Failed to execute query against Databricks');
  }
});

apiRouter.post('/jobs/:jobId/run', async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Job ID is required' } });
  }

  try {
    const result = await triggerJob(jobId);
    return res.json(result);
  } catch (err) {
    return handleApiError(res, err, 'JOB_TRIGGER_FAILED', `Failed to trigger job ${jobId}`);
  }
});

apiRouter.get('/jobs/runs/:runId', async (req, res) => {
  const { runId } = req.params;
  if (!runId) {
    return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Run ID is required' } });
  }

  try {
    const status = await getRunStatus(runId);
    return res.json({ status });
  } catch (err) {
    return handleApiError(res, err, 'JOB_STATUS_FAILED', `Failed to get status for run ${runId}`);
  }
});

// Sync Endpoints
apiRouter.post('/sync', async (_req, res) => {
  try {
    const runId = await startSync();
    return res.json({ runId });
  } catch (err) {
    return handleApiError(res, err, 'SYNC_START_FAILED', 'Failed to start sync process');
  }
});

apiRouter.get('/sync', async (_req, res) => {
  try {
    const runs = syncStore.listRuns();
    return res.json({ runs });
  } catch (err) {
    return handleApiError(res, err, 'SYNC_LIST_FAILED', 'Failed to list sync runs');
  }
});

apiRouter.get('/sync/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const run = syncStore.getRun(id);
    if (!run) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Sync run not found' } });
    }
    return res.json({ run });
  } catch (err) {
    return handleApiError(res, err, 'SYNC_GET_FAILED', `Failed to get sync run ${id}`);
  }
});
