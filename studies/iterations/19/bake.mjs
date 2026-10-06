// Bakes the Voronoi J into mesh/<name>.json for the looks. Study 19 copy of Study 18's bake (adds timing). Same bake as
// Study 16 plus nrm=1 (keep the exact normals). Needs the studies server.
//   node studies/iterations/18/bake.mjs <query> <name>
// Study 19 used it to time the build and to compare blob counts (c15/c25/c35,
// rendered with Study 18's lab.html). The four meshes compared in Study 18:
//   a16    "layer=1&cells=15&fluff=55&res=0.6"         (Study 16's)
//   a-nrm  "layer=1&cells=15&fluff=55&res=0.6&nrm=1"
//   b-nrm  "layer=1&cells=15&fluff=55&res=1&nrm=1"
//   c-nrm  "layer=1&cells=15&fluff=55&res=1.4&nrm=1"
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chrome } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const [query, name] = process.argv.slice(2);
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/19/bake/bake.html?' + query);
  await c.waitFor('!!window.J', 240000);
  const J = await c.evaluate('window.J');
  fs.mkdirSync(path.join(here, 'mesh'), { recursive: true });   // not committed: the page builds its J live
  const file = path.join(here, 'mesh', name + '.json'), body = JSON.stringify(J);
  fs.writeFileSync(file, body);
  const verts = J.pieces.reduce((s, p) => s + p.pos.length / 3, 0), tris = J.pieces.reduce((s, p) => s + p.idx.length / 3, 0);
  console.log(`${name}: built in ${J.ms} ms, ${J.pieces.length} pieces, ${verts} verts, ${tris} tris, ${(body.length / 1024).toFixed(0)} KB, ${(zlib.gzipSync(body).length / 1024).toFixed(0)} KB gzipped`);
  if (c.errors.length) console.log('errors:', c.errors);
} finally { c.close(); }
