// Study 115: the pictures, and what the check reads, for the three versions. Needs the studies server on 8794.
// One headless Chrome at a time.
//   node studies/iterations/115/shoot.mjs      a.html, b.html, c.html at their beats, wide and phone -> shots/, report.json
// Each version has four beats standing in a room, one caught halfway between two rooms (the movement itself), and the end.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const PAGES = {
  a: [['question', .02], ['room1', .19], ['moving', .295], ['room2', .4], ['room3', .61], ['room4', .81], ['all', .985]],
  b: [['question', .02], ['room1', .19], ['moving', .297], ['room2', .4], ['room3', .6], ['room4', .8], ['all', .985]],
  c: [['question', .02], ['room1', .19], ['moving', .29], ['room2', .4], ['room3', .61], ['room4', .8], ['turning', .93], ['all', .999]],
};
const to = (at) => `(() => { const r = document.getElementById('run'); scrollTo(0, ${at} * (r.offsetHeight - innerHeight)); return 1 })()`;
const c = await chrome();
try {
  const report = { at: new Date().toISOString(), pages: {} };
  for (const [v, BEATS] of Object.entries(PAGES)) {
    report.pages[v] = {};
    for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone']]) {
      c.errors.length = 0;
      await c.visit(`http://127.0.0.1:8794/studies/iterations/115/${v}.html`, w, h);
      await c.waitFor('window.__ready', 30000);
      const beats = {};
      for (const [name, at] of BEATS) {
        await c.evaluate(to(at)); await sleep(1100);
        await c.shot(path.join(here, 'shots', `${v}-${tag}-${name}.png`));
        beats[name] = await c.evaluate('window.__measure()');
      }
      report.pages[v][tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
      console.log(v, tag, 'errors', c.errors.length, c.errors[0] || '');
    }
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
