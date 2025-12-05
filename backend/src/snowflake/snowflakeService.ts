import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Define the connection configuration
// Ensure these are set in your backend/.env file
const connectionOptions = {
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USERNAME || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
  database: process.env.SNOWFLAKE_DATABASE || '',
  schema: process.env.SNOWFLAKE_SCHEMA || '',
  role: process.env.SNOWFLAKE_ROLE || '',
};

// Allow configuring the stage (fully qualified or simple name). Default matches previous behavior.
const stageName = (process.env.SNOWFLAKE_STAGE || 'S3_SHARE_STAGE').replace(/^@/, '');
const targetDatabase = process.env.SNOWFLAKE_DATABASE || 'SNOWFLAKE_LEARNING_DB';

function getConnection(): snowflake.Connection {
  return snowflake.createConnection(connectionOptions);
}

/**
 * Executes a query using a dedicated connection.
 * Handles connection cycle (connect -> execute -> destroy).
 */
async function executeQuery(sqlText: string, binds: any[] = []): Promise<any[]> {
  const connection = getConnection();

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake: ' + err.message);
        reject(err);
        return;
      }

      conn.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Failed to execute statement due to the following error: ' + err.message);
            reject(err);
          } else {
            resolve(rows || []);
          }
          
          // Always destroy connection after execution to prevent leaks in this simple model
          connection.destroy((err) => {
             if (err) console.error('Error destroying connection:', err);
          });
        },
      });
    });
  });
}

/**
 * Idempotent Data Load:
 * 1. DELETE existing rows for this run_id (cleanup potential failed attempts)
 * 2. COPY INTO target table from S3 run-specific path
 */
export async function loadData(runId: string): Promise<void> {
  console.log(`[Snowflake] Starting load for run ${runId}...`);

  // Derive a schema name from the run id (sanitize to valid identifier); fallback to configured schema/public if runId missing
  const sanitizedRunId = (runId || '').trim();
  const runSchema = sanitizedRunId
    ? `run_${sanitizedRunId.replace(/[^A-Za-z0-9_]/g, '_')}`
    : (connectionOptions.schema || 'PUBLIC');
  const fqTable = `${targetDatabase}.${runSchema}.shared_forecasts`;
  const stagePath = sanitizedRunId
    ? `@${stageName}/runs/run_id=${sanitizedRunId}/`
    : `@${stageName}/runs/`;

  // 0. Ensure run-specific schema exists (idempotent)
  const createSchemaSql = `CREATE SCHEMA IF NOT EXISTS ${targetDatabase}.${runSchema}`;
  await executeQuery(createSchemaSql);

  // 0. Ensure target table exists (idempotent)
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${fqTable} (
      date DATE,
      city_name STRING,
      latitude DOUBLE,
      longitude DOUBLE,
      degree_days_cooling DOUBLE,
      humidity_relative_avg DOUBLE,
      cloud_cover_perc_avg DOUBLE,
      _sync_run_id STRING
    )
  `;
  await executeQuery(createTableSql);

  // 1. Cleanup (Idempotency)
  const deleteSql = `DELETE FROM ${fqTable} WHERE _sync_run_id = ?`;
  await executeQuery(deleteSql, [runId]);
  console.log(`[Snowflake] Cleaned up existing data for ${runId}`);

  // 2. Load (COPY INTO)
  // Note: Binds don't work well inside COPY INTO paths in some drivers, 
  // so we safely inject the runId into the string since it's a trusted UUID.
  const copySql = `
    COPY INTO ${fqTable}
    FROM (
      SELECT 
        $1:date, 
        $1:city_name, 
        $1:latitude, 
        $1:longitude, 
        $1:degree_days_cooling,
        $1:humidity_relative_avg,
        $1:cloud_cover_perc_avg,
        '${runId}' as _sync_run_id
      FROM ${stagePath}
    )
    FILE_FORMAT = (TYPE = PARQUET)
    ON_ERROR = 'ABORT_STATEMENT'
  `;
  
  await executeQuery(copySql);
  console.log(`[Snowflake] Successfully loaded data for ${runId}`);
}
