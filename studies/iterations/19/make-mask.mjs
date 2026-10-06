// Saves j-mask.png (the J outline, Arial Black, from bake/mask.html). Needs the server.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/19/bake/mask.html');
  await c.waitFor('!!window.MASK');
  const url = await c.evaluate('window.MASK');
  fs.writeFileSync(path.join(here, 'j-mask.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('j-mask.png', fs.statSync(path.join(here, 'j-mask.png')).size, 'bytes,', await c.evaluate('window.FONT'));
} finally { c.close(); }
