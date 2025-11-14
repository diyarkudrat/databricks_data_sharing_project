import dotenv from 'dotenv';

dotenv.config();

export interface BackendConfig {
  databricksHost: string;
  databricksToken: string;
  databricksHttpPath: string;
  port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): BackendConfig {
  return {
    databricksHost: requireEnv('DATABRICKS_HOST'),
    databricksToken: requireEnv('DATABRICKS_TOKEN'),
    databricksHttpPath: requireEnv('DATABRICKS_HTTP_PATH'),
    port: Number(process.env.PORT) || 4000,
  };
}
