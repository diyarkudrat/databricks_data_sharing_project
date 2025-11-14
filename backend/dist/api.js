"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const queryService_1 = require("./databricks/queryService");
const warehousesService_1 = require("./databricks/warehousesService");
exports.apiRouter = express_1.default.Router();
exports.apiRouter.get('/warehouses', async (_req, res) => {
    try {
        const warehouses = await (0, warehousesService_1.listWarehouses)();
        return res.json({ warehouses });
    }
    catch (err) {
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
exports.apiRouter.post('/query', async (req, res) => {
    const { sql } = req.body ?? {};
    if (typeof sql !== 'string' || !sql.trim()) {
        const error = {
            code: 'INVALID_REQUEST',
            message: 'The "sql" field is required and must be a non-empty string.',
        };
        return res.status(400).json({ error });
    }
    try {
        const result = await (0, queryService_1.executeQuery)(sql);
        return res.json({ result });
    }
    catch (err) {
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
