"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const queryService_1 = require("./databricks/queryService");
const warehousesService_1 = require("./databricks/warehousesService");
const tablesService_1 = require("./databricks/tablesService");
exports.apiRouter = express_1.default.Router();
exports.apiRouter.get('/warehouses', async (_req, res) => {
    try {
        const warehouses = await (0, warehousesService_1.listWarehouses)();
        return res.json({ warehouses });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching warehouses from Databricks:', err);
        const error = {
            code: 'WAREHOUSES_FETCH_FAILED',
            message: 'Failed to list Databricks warehouses.',
            details: process.env.NODE_ENV === 'development' && err instanceof Error
                ? err.message
                : undefined,
        };
        return res.status(500).json({ error });
    }
});
exports.apiRouter.get('/tables', async (req, res) => {
    const { catalog, schema } = req.query;
    if (Array.isArray(catalog) || Array.isArray(schema)) {
        const error = {
            code: 'INVALID_REQUEST',
            message: 'Only single values are allowed for catalog and schema.',
        };
        return res.status(400).json({ error });
    }
    try {
        const tables = await (0, tablesService_1.listTables)({
            catalog: catalog,
            schema: schema,
        });
        return res.json({ tables });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching tables from Databricks:', err);
        const error = {
            code: 'TABLES_FETCH_FAILED',
            message: 'Failed to list Databricks tables.',
            details: process.env.NODE_ENV === 'development' && err instanceof Error
                ? err.message
                : undefined,
        };
        return res.status(500).json({ error });
    }
});
exports.apiRouter.post('/query', async (req, res) => {
    const { sql, params } = req.body ?? {};
    if (typeof sql !== 'string' || !sql.trim()) {
        const error = {
            code: 'INVALID_REQUEST',
            message: 'The "sql" field is required and must be a non-empty string.',
        };
        return res.status(400).json({ error });
    }
    if (typeof params !== 'undefined' &&
        (typeof params !== 'object' || Array.isArray(params))) {
        const error = {
            code: 'INVALID_REQUEST',
            message: 'If provided, "params" must be an object.',
        };
        return res.status(400).json({ error });
    }
    try {
        // For now, params are accepted for future extensibility but not yet
        // forwarded to the Databricks driver in this MVP implementation.
        const result = await (0, queryService_1.executeQuery)(sql);
        return res.json({ result });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error executing query against Databricks:', err);
        const error = {
            code: 'QUERY_FAILED',
            message: 'Failed to execute query against Databricks.',
            details: process.env.NODE_ENV === 'development' && err instanceof Error
                ? err.message
                : undefined,
        };
        return res.status(500).json({ error });
    }
});
