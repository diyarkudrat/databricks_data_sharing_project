"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTables = listTables;
const queryService_1 = require("./queryService");
async function listTables(options = {}) {
    const { catalog, schema } = options;
    // For the MVP we use SHOW TABLES, optionally scoped to a schema or catalog.schema.
    let target = '';
    if (catalog && schema) {
        target = `${catalog}.${schema}`;
    }
    else if (schema) {
        target = schema;
    }
    const sql = target ? `SHOW TABLES IN ${target}` : 'SHOW TABLES';
    const result = await (0, queryService_1.executeQuery)(sql);
    // Try to locate indices for schema/catalog and table name columns based on
    // common Databricks column names.
    const lowerNames = result.columns.map((c) => c.name.toLowerCase());
    const schemaIndex = lowerNames.findIndex((n) => ['database', 'namespace', 'schema'].includes(n));
    const nameIndex = lowerNames.findIndex((n) => ['tablename', 'table_name', 'name'].includes(n));
    return result.rows.map((row) => {
        const schemaValue = schemaIndex >= 0 && schemaIndex < row.length
            ? row[schemaIndex]
            : schema ?? null;
        const nameValue = nameIndex >= 0 && nameIndex < row.length
            ? row[nameIndex]
            : row[0];
        return {
            catalog: catalog ?? null,
            schema: schemaValue,
            name: nameValue ?? '',
            comment: null,
        };
    });
}
