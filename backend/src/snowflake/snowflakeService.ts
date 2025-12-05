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

  // 1. Cleanup (Idempotency)
  const deleteSql = `DELETE FROM shared_forecasts WHERE _sync_run_id = ?`;
  await executeQuery(deleteSql, [runId]);
  console.log(`[Snowflake] Cleaned up existing data for ${runId}`);

  // 2. Load (COPY INTO)
  // Note: Binds don't work well inside COPY INTO paths in some drivers, 
  // so we safely inject the runId into the string since it's a trusted UUID.
  const copySql = `
    COPY INTO shared_forecasts
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
      FROM @s3_share_stage/runs/run_id=${runId}/
    )
    FILE_FORMAT = (TYPE = PARQUET)
    ON_ERROR = 'ABORT_STATEMENT'
  `;
  
  await executeQuery(copySql);
  console.log(`[Snowflake] Successfully loaded data for ${runId}`);
}
