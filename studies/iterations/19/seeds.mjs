// Runs bake/seeds.html (60 random seeds) → seeds.json, prints a summary.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/19/bake/seeds.html');
  await c.waitFor('!!window.SEEDS', 600000);
  const rows = await c.evaluate('window.SEEDS');
  fs.writeFileSync(path.join(here, 'seeds.json'), JSON.stringify(rows, null, 1));
  const ms = rows.map(r => r.ms).sort((a, b) => a - b);
  console.log('errors', rows.filter(r => r.error).length, '| ms median', ms[ms.length >> 1], 'max', ms[ms.length - 1]);
  const hist = {}; rows.forEach(r => hist[r.made] = (hist[r.made] || 0) + 1); console.log('stones made:', hist);
  const mins = rows.map(r => r.min).sort((a, b) => a - b); console.log('smallest stone: p10', mins[6], 'median', mins[30], 'p90', mins[54]);
  console.log('worst 8:', rows.slice().sort((a, b) => a.min - b.min).slice(0, 8).map(r => r.seed + ' ' + r.made + ' ' + r.min).join(' | '));
} finally { c.close(); }
