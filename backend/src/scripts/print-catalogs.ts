import { listCatalogs } from '../databricks/catalogsService';

async function main() {
  try {
    const catalogs = await listCatalogs();

    // eslint-disable-next-line no-console
    console.log('Catalogs visible in this warehouse:');
    catalogs.forEach((name, i) => {
      // eslint-disable-next-line no-console
      console.log(`  [${i}] ${name}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to list catalogs:', err);
    process.exitCode = 1;
  }
}

void main();
