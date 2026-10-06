// Runs bake/legible.html for a set of configs → legible-<name>.json, prints a table.
//   node studies/iterations/23/legible.mjs <name> '<configs json>'
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const [name, configs] = process.argv.slice(2);
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/23/bake/legible.html?seeds=5&configs=' + encodeURIComponent(configs));
  await c.waitFor('!!window.LEGIBLE', 600000);
  const rows = await c.evaluate('window.LEGIBLE');
  fs.writeFileSync(path.join(here, 'legible-' + name + '.json'), JSON.stringify(rows, null, 1));
  console.table(rows);
  const ov = await c.evaluate('window.OVERLAYS || {}');
  fs.mkdirSync(path.join(here, 'overlays'), { recursive: true });
  for (const [k, u] of Object.entries(ov)) fs.writeFileSync(path.join(here, 'overlays', k + '.png'), Buffer.from(u.split(',')[1], 'base64'));
  if (c.errors.length) console.log(c.errors);
} finally { c.close(); }
