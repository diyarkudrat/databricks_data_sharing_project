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
const accuweatherService_1 = require("./databricks/accuweatherService");
const samplesService_1 = require("./databricks/samplesService");
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
exports.apiRouter.get('/samples/schemas', async (_req, res) => {
    try {
        const result = await (0, samplesService_1.listSampleSchemas)();
        // The SHOW SCHEMAS result for samples returns a single column whose cell
        // values are objects like { databaseName: 'accuweather' }. We normalize
        // that into a simple string[].
        const schemas = result.rows
            .map((row) => {
            const cell = row[0];
            if (cell && typeof cell === 'object') {
                const anyCell = cell;
                return anyCell.databaseName ?? anyCell.schemaName ?? anyCell.name ?? '';
            }
            return cell == null ? '' : String(cell);
        })
            .filter((name) => name && name.trim().length > 0);
        return res.json({ schemas });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching schemas under samples catalog:', err);
        const error = {
            code: 'SAMPLES_SCHEMAS_FAILED',
            message: 'Failed to list schemas under samples catalog.',
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
exports.apiRouter.get('/accuweather', async (req, res) => {
    const { city, startDate, endDate, limit } = req.query;
    if (Array.isArray(city) ||
        Array.isArray(startDate) ||
        Array.isArray(endDate) ||
        Array.isArray(limit)) {
        const error = {
            code: 'INVALID_REQUEST',
            message: 'Only single values are allowed for city, startDate, endDate, and limit.',
        };
        return res.status(400).json({ error });
    }
    let parsedLimit;
    if (typeof limit === 'string' && limit.trim() !== '') {
        const asNumber = Number(limit);
        if (!Number.isFinite(asNumber) || asNumber <= 0) {
            const error = {
                code: 'INVALID_REQUEST',
                message: '"limit" must be a positive number when provided.',
            };
            return res.status(400).json({ error });
        }
        parsedLimit = asNumber;
    }
    try {
        const result = await (0, accuweatherService_1.queryAccuWeather)({
            city: city,
            startDate: startDate,
            endDate: endDate,
            limit: parsedLimit,
        });
        return res.json({ result });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error querying AccuWeather sample data:', err);
        const error = {
            code: 'ACCUEWEATHER_QUERY_FAILED',
            message: 'Failed to query AccuWeather sample data.',
            details: process.env.NODE_ENV === 'development' && err instanceof Error
                ? err.message
                : undefined,
        };
        return res.status(500).json({ error });
    }
});
