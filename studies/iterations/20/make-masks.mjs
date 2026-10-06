// Draws the J in each candidate font (bake/mask.html) → masks/<font>.png and
// masks/masks.json (font string, whether it loaded, ink share). Needs the server.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/20/bake/mask.html');
  await c.waitFor('!!window.MASKS', 60000);
  const M = await c.evaluate('window.MASKS'), meta = {};
  for (const [name, m] of Object.entries(M)) {
    fs.writeFileSync(path.join(here, 'masks', name + '.png'), Buffer.from(m.url.split(',')[1], 'base64'));
    meta[name] = { font: m.font, loaded: m.loaded, ink: m.ink };
    console.log(name.padEnd(14), m.loaded ? 'loaded' : 'NOT LOADED', 'ink', m.ink, m.font);
  }
  fs.writeFileSync(path.join(here, 'masks', 'masks.json'), JSON.stringify(meta, null, 1));
} finally { c.close(); }
