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

/**
 * Loads and validates backend configuration from environment variables.
 * Throws an error if required variables are missing.
 */
export function loadConfig(): BackendConfig {
  const config: BackendConfig = {
    databricksHost: requireEnv('DATABRICKS_HOST'),
    databricksToken: requireEnv('DATABRICKS_TOKEN'),
    databricksHttpPath: requireEnv('DATABRICKS_HTTP_PATH'),
    port: Number(process.env.PORT) || 4000,
  };

  if (isNaN(config.port)) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return config;
}
