// Adds baked per-vertex occlusion to a mesh: mesh/<name>.json → mesh/<name>-ao.json
// (each piece gains ao: 0..255). Needs the studies server.
//   node studies/iterations/18/bake-ao.mjs p100
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2] || 'p100';
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/18/bake/ao.html?mesh=' + name);
  await c.waitFor('!!window.AO', 600000);
  const AO = await c.evaluate('window.AO'), ms = await c.evaluate('window.AO_MS');
  const J = JSON.parse(fs.readFileSync(path.join(here, 'mesh', name + '.json'), 'utf8'));
  J.pieces.forEach((p, i) => { p.ao = AO[i]; });
  J.ao = 'baked per vertex, 64 rays, reach 0.35 (bake/ao.html)';
  const body = JSON.stringify(J);
  fs.writeFileSync(path.join(here, 'mesh', name + '-ao.json'), body);
  const flat = AO.flat(), mean = flat.reduce((a, b) => a + b, 0) / flat.length / 255, dark = flat.filter(v => v < 128).length / flat.length;
  console.log(`${name}-ao: ${Math.round(ms)} ms, mean openness ${mean.toFixed(2)}, ${(dark * 100).toFixed(1)}% of vertices under half open, ${(zlib.gzipSync(body).length / 1024).toFixed(0)} KB gzipped`);
  if (c.errors.length) console.log(c.errors);
} finally { c.close(); }
