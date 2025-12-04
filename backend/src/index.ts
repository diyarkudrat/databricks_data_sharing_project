import express from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { apiRouter } from './api';
import { closeClient } from './databricks/client';

const config = loadConfig();

const app = express();
app.use(cors());
app.use(express.json());

// Basic request logging for observability during development.
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

// Global 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Path not found' } });
});

const port = config.port;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend service listening on port ${port}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  server.close(async () => {
    await closeClient();
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
