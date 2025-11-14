import express from 'express';
import type { ApiError } from './types';
import { executeQuery } from './databricks/queryService';
import { listWarehouses } from './databricks/warehousesService';
import { listTables } from './databricks/tablesService';

export const apiRouter = express.Router();

apiRouter.get('/warehouses', async (_req, res) => {
  try {
    const warehouses = await listWarehouses();
    return res.json({ warehouses });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching warehouses from Databricks:', err);
    const error: ApiError = {
      code: 'WAREHOUSES_FETCH_FAILED',
      message: 'Failed to list Databricks warehouses.',
      details: process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : undefined,
    };
    return res.status(500).json({ error });
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
    // eslint-disable-next-line no-console
    console.error('Error fetching tables from Databricks:', err);
    const error: ApiError = {
      code: 'TABLES_FETCH_FAILED',
      message: 'Failed to list Databricks tables.',
      details: process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : undefined,
    };
    return res.status(500).json({ error });
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
    // For now, params are accepted for future extensibility but not yet
    // forwarded to the Databricks driver in this MVP implementation.
    const result = await executeQuery(sql);
    return res.json({ result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error executing query against Databricks:', err);
    const error: ApiError = {
      code: 'QUERY_FAILED',
      message: 'Failed to execute query against Databricks.',
      details: process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : undefined,
    };
    return res.status(500).json({ error });
  }
});
