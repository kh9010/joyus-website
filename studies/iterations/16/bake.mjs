// Bakes the Voronoi J from brand-lab's geometry into j.json, which the
// coming-soon page loads. Needs the studies server (node studies/server.cjs).
//   node studies/iterations/16/bake.mjs [query] [outfile]
//   try 1: node studies/iterations/16/bake.mjs "" j-try1.json        (Solid tab defaults)
//   chosen: node studies/iterations/16/bake.mjs   (= "layer=1&cells=15&fluff=55&res=0.6" j.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const [query = 'layer=1&cells=15&fluff=55&res=0.6', out = 'j.json'] = process.argv.slice(2);
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/16/bake/bake.html?' + query);
  await c.waitFor('!!window.J', 120000);
  const J = await c.evaluate('window.J');
  fs.writeFileSync(path.join(here, out), JSON.stringify(J));
  const verts = J.pieces.reduce((s, p) => s + p.pos.length / 3, 0);
  console.log(`j.json: ${J.pieces.length} pieces, ${verts} vertices, ${(fs.statSync(path.join(here, out)).size / 1024).toFixed(0)} KB, font ${J.font}`);
  if (c.errors.length) console.log('errors:', c.errors);
} finally { c.close(); }
