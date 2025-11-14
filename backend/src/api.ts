import express from 'express';
import type { ApiError } from './types';
import { executeQuery } from './databricks/queryService';
import { listWarehouses } from './databricks/warehousesService';
import { listTables } from './databricks/tablesService';
import { listSampleSchemas } from './databricks/samplesService';
import { listCatalogs } from './databricks/catalogsService';

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

apiRouter.get('/catalogs', async (_req, res) => {
  try {
    const catalogs = await listCatalogs();
    return res.json({ catalogs });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalogs from Databricks:', err);
    const error: ApiError = {
      code: 'CATALOGS_FETCH_FAILED',
      message: 'Failed to list Databricks catalogs.',
      details:
        process.env.NODE_ENV === 'development' && err instanceof Error
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
    // eslint-disable-next-line no-console
    console.error('Error fetching schemas under samples catalog:', err);
    const error: ApiError = {
      code: 'SAMPLES_SCHEMAS_FAILED',
      message: 'Failed to list schemas under samples catalog.',
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
