"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
const sql_1 = require("@databricks/sql");
const config_1 = require("../config");
let cachedClient = null;
function getClient() {
    if (cachedClient) {
        return cachedClient;
    }
    const config = (0, config_1.loadConfig)();
    const client = new sql_1.DBSQLClient();
    // Connection configuration is applied when connecting in the query service.
    // Keeping this module focused on client construction and reuse.
    cachedClient = client;
    return client;
}
