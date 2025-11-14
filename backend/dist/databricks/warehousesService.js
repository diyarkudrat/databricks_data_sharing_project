"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWarehouses = listWarehouses;
const config_1 = require("../config");
async function listWarehouses() {
    const config = (0, config_1.loadConfig)();
    // Ensure we have a fully qualified URL. The host in config is expected to be
    // something like `dbc-xxxx.cloud.databricks.com` (without protocol).
    const base = config.databricksHost.startsWith('http')
        ? config.databricksHost
        : `https://${config.databricksHost}`;
    const url = new URL('/api/2.0/sql/warehouses', base);
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${config.databricksToken}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Databricks warehouses request failed with status ${response.status}`);
    }
    const data = (await response.json());
    const items = data.warehouses ?? [];
    return items.map((w) => ({
        id: w.id ?? w.warehouse_id ?? '',
        name: w.name ?? '',
        state: w.state,
        size: w.size,
    }));
}
