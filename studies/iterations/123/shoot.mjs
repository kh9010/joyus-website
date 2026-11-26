// Study 123: the pictures, and what the check reads. Study 99's beats, for each variant. Needs the studies server on 8794.
// One headless Chrome at a time (SwiftShader, never the GPU).
//   node studies/iterations/123/shoot.mjs [a b c d]      -> shots/<v>-<view>-<beat>.png, report-<v>.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const which = process.argv.slice(2).length ? process.argv.slice(2) : ['a', 'b', 'c', 'd'];
const BEATS = [['question', .02, 900], ['offer', .19, 1200], ['one', .29, 1600], ['empty', .39, 1600], ['third', .6, 1600], ['fifth', .77, 1600], ['pass', .93, 620], ['full', .97, 3200]];
const to = (at) => `(() => { const r = document.getElementById('run'); scrollTo(0, ${at} * (r.offsetHeight - innerHeight)); return 1 })()`;
const c = await chrome();
try {
  for (const v of which) {
    const report = { at: new Date().toISOString(), views: {} };
    for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone'], [390, 664, 'short']]) {
      c.errors.length = 0;
      await c.visit(`http://127.0.0.1:8794/studies/iterations/123/${v}.html`, w, h);
      await c.waitFor('window.__ready', 30000);
      const beats = {};
      for (const [name, at, wait] of BEATS) {
        await c.evaluate(to(at)); await sleep(wait);
        await c.shot(path.join(here, 'shots', `${v}-${tag}-${name}.png`));
        beats[name] = await c.evaluate('window.__measure()');
      }
      await c.evaluate('scrollTo(0, document.body.scrollHeight), 1'); await sleep(500);
      await c.shot(path.join(here, 'shots', `${v}-${tag}-end.png`));
      report.views[tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
      console.log(v, tag, 'errors', c.errors.length, c.errors[0] || '');
    }
    fs.writeFileSync(path.join(here, `report-${v}.json`), JSON.stringify(report, null, 1));
  }
} finally { c.close(); }
