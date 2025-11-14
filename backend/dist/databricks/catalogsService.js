"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCatalogs = listCatalogs;
const queryService_1 = require("./queryService");
// List catalogs visible in the connected SQL warehouse.
async function listCatalogs() {
    const sql = 'SHOW CATALOGS';
    return (0, queryService_1.executeQuery)(sql);
}
