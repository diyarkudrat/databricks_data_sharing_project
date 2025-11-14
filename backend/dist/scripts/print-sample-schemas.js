"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const samplesService_1 = require("../databricks/samplesService");
async function main() {
    try {
        const result = await (0, samplesService_1.listSampleSchemas)();
        const lowerNames = result.columns.map((c) => c.name.toLowerCase());
        const schemaIndex = lowerNames.findIndex((n) => ['namespace', 'database', 'schema', 'name'].includes(n));
        // eslint-disable-next-line no-console
        console.log('Schemas under catalog `samples`:');
        result.rows.forEach((row, idx) => {
            const schemaName = schemaIndex >= 0 && schemaIndex < row.length
                ? row[schemaIndex]
                : null;
            // eslint-disable-next-line no-console
            console.log(`  [${idx}] ${schemaName ?? JSON.stringify(row)}`);
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to list schemas under samples:', err);
        process.exitCode = 1;
    }
}
void main();
