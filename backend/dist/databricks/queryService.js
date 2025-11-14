"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabricksQueryError = void 0;
exports.executeQuery = executeQuery;
const client_1 = require("./client");
const config_1 = require("../config");
class DatabricksQueryError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'DatabricksQueryError';
    }
}
exports.DatabricksQueryError = DatabricksQueryError;
async function executeQuery(sql, options = {}) {
    const { maxRetries = 2 } = options;
    const client = (0, client_1.getClient)();
    const config = (0, config_1.loadConfig)();
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            // The SDK types are loosely modeled here using 'any' to avoid
            // tight coupling to a specific driver version.
            await client.connect({
                host: config.databricksHost,
                path: config.databricksHttpPath,
                token: config.databricksToken,
            });
            const session = await client.openSession();
            const operation = await session.executeStatement(sql, {
                runAsync: false,
            });
            const allRows = (await operation.fetchAll?.()) ?? [];
            const metaColumns = operation.getSchema?.().columns ??
                operation.metadata?.columns ??
                [];
            const columns = metaColumns.map((col) => ({
                name: col.name ?? '',
                type: col.type ?? 'string',
                nullable: col.nullable ?? null,
            }));
            await operation.close?.();
            await session.close?.();
            return { columns, rows: allRows };
        }
        catch (error) {
            attempt += 1;
            const isLastAttempt = attempt > maxRetries;
            if (isLastAttempt) {
                throw new DatabricksQueryError('QUERY_FAILED', error instanceof Error ? error.message : 'Unknown Databricks error');
            }
            // Simple linear backoff between retries.
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
    }
}
