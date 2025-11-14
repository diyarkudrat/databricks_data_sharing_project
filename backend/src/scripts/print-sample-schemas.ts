import { listSampleSchemas } from '../databricks/samplesService';

async function main() {
  try {
    const result = await listSampleSchemas();

    const lowerNames = result.columns.map((c) => c.name.toLowerCase());
    const schemaIndex = lowerNames.findIndex((n) =>
      ['namespace', 'database', 'schema', 'name'].includes(n),
    );

    // eslint-disable-next-line no-console
    console.log('Schemas under catalog `samples`:');

    result.rows.forEach((row, idx) => {
      const schemaName =
        schemaIndex >= 0 && schemaIndex < row.length
          ? (row[schemaIndex] as string | null)
          : null;

      // eslint-disable-next-line no-console
      console.log(`  [${idx}] ${schemaName ?? JSON.stringify(row)}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to list schemas under samples:', err);
    process.exitCode = 1;
  }
}

void main();
