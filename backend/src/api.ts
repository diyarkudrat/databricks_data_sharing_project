import express from 'express';
import type { ApiError } from './types';
import { executeQuery } from './databricks/queryService';

export const apiRouter = express.Router();

apiRouter.post('/query', async (req, res) => {
  const { sql } = req.body ?? {};

  if (typeof sql !== 'string' || !sql.trim()) {
    const error: ApiError = {
      code: 'INVALID_REQUEST',
      message: 'The "sql" field is required and must be a non-empty string.',
    };
    return res.status(400).json({ error });
  }

  try {
    const result = await executeQuery(sql);
    return res.json({ result });
  } catch (err) {
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
