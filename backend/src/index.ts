import express from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { apiRouter } from './api';

const config = loadConfig();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

const port = config.port;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend service listening on port ${port}`);
});
