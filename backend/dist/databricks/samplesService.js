"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSampleSchemas = listSampleSchemas;
const queryService_1 = require("./queryService");
// List schemas ("databases") under the `samples` catalog.
async function listSampleSchemas() {
    const sql = 'SHOW SCHEMAS IN samples';
    return (0, queryService_1.executeQuery)(sql);
}
