import { loadConfig } from '../config';

async function debugDataSources() {
  const config = loadConfig();
  const base = config.databricksHost.startsWith('http') ? config.databricksHost : `https://${config.databricksHost}`;
  
  const headers = {
    Authorization: `Bearer ${config.databricksToken}`,
    'Content-Type': 'application/json',
  };

  console.log('--- Listing Warehouses (SQL Endpoints) ---');
  try {
    const wRes = await fetch(`${base}/api/2.0/sql/warehouses`, { headers });
    if (!wRes.ok) throw new Error(await wRes.text());
    const wData = await wRes.json();
    console.log(JSON.stringify(wData, null, 2));
  } catch (e) {
    console.error('Error listing warehouses:', e);
  }

  console.log('\n--- Listing Data Sources ---');
  try {
    const dRes = await fetch(`${base}/api/2.0/preview/sql/data_sources`, { headers });
    if (!dRes.ok) throw new Error(await dRes.text());
    const dData = await dRes.json();
    console.log(JSON.stringify(dData, null, 2));
  } catch (e) {
    console.error('Error listing data sources:', e);
  }
}

debugDataSources().catch(console.error);
