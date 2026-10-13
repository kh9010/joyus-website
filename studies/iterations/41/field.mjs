// Study 34: the glyph field, chamfer vs exact, for one font → field.json and
// img/field-chamfer.png, img/field-exact.png (contour lines), plus the
// 1024px mask's field for the numbers. Needs the server.
//   node studies/iterations/41/field.mjs [font]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const font = process.argv[2] || 'rubik';
const c = await chrome();
try {
  const out = { font };
  for (const [key, dir] of [['m320', 'masks'], ['m1024', 'masks1024']]) {
    await c.visit(`http://127.0.0.1:8794/studies/iterations/41/bake/field.html?font=${font}&dir=${dir}`);
    await c.waitFor('!!window.FIELD', 120000);
    const F = await c.evaluate('window.FIELD');
    out[key] = { maskR: F.maskR, ...F.stats };
    if (key === 'm320') {
      fs.writeFileSync(path.join(here, 'img', 'field-chamfer.png'), Buffer.from(F.chamferPng.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(here, 'img', 'field-exact.png'), Buffer.from(F.exactPng.split(',')[1], 'base64'));
    }
    console.log(key, JSON.stringify(out[key]));
  }
  out.when = new Date().toISOString();
  fs.writeFileSync(path.join(here, 'field.json'), JSON.stringify(out, null, 1));
  if (c.errors.length) console.log(c.errors);
} finally { c.close(); }
