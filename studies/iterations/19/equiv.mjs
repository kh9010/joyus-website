// Runs bake/equiv.html: live builder vs Study 18's baked mesh. Writes equiv.json.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/19/bake/equiv.html');
  await c.waitFor('!!window.EQUIV', 120000);
  const r = await c.evaluate('window.EQUIV'); r.errors = c.errors;
  fs.writeFileSync(path.join(here, 'equiv.json'), JSON.stringify(r, null, 1));
  console.log(r);
} finally { c.close(); }
