"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queryService_1 = require("../databricks/queryService");
async function main() {
    try {
        const customersCount = await (0, queryService_1.executeQuery)('SELECT COUNT(*) AS cnt FROM analytics.customers');
        const ordersCount = await (0, queryService_1.executeQuery)('SELECT COUNT(*) AS cnt FROM analytics.sales_orders');
        const customers = customersCount.rows[0]?.[0] ?? 0;
        const orders = ordersCount.rows[0]?.[0] ?? 0;
        // eslint-disable-next-line no-console
        console.log('Sample data row counts:');
        // eslint-disable-next-line no-console
        console.log(`  analytics.customers:    ${customers}`);
        // eslint-disable-next-line no-console
        console.log(`  analytics.sales_orders: ${orders}`);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to query sample data tables:', err);
        process.exitCode = 1;
    }
}
void main();
