"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catalogsService_1 = require("../databricks/catalogsService");
async function main() {
    try {
        const result = await (0, catalogsService_1.listCatalogs)();
        // For SHOW CATALOGS the first column usually contains the catalog name.
        const catalogs = result.rows.map((row, idx) => {
            const cell = row[0];
            if (cell && typeof cell === 'object') {
                const anyCell = cell;
                return anyCell.catalog_name ?? anyCell.name ?? JSON.stringify(cell);
            }
            return cell == null ? `row_${idx}` : String(cell);
        });
        // eslint-disable-next-line no-console
        console.log('Catalogs visible in this warehouse:');
        catalogs.forEach((name, i) => {
            // eslint-disable-next-line no-console
            console.log(`  [${i}] ${name}`);
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to list catalogs:', err);
        process.exitCode = 1;
    }
}
void main();
