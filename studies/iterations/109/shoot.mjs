// Study 109: the pictures, and what the check reads, for both versions. Needs the studies server on 8794. One headless Chrome at a time.
//   node studies/iterations/109/shoot.mjs      a.html and b.html at their beats, wide and phone -> shots/, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const PAGES = {
  a: [['question', .02], ['first', .2], ['note', .31], ['swapped', .48], ['hand', .6], ['line', .8], ['page', .97]],
  b: [['question', .02], ['x', .15], ['three', .3], ['nine', .55], ['note', .65], ['line', .82], ['page', .97]],
};
const to = (at) => `(() => { const r = document.getElementById('run'); scrollTo(0, ${at} * (r.offsetHeight - innerHeight)); return 1 })()`;
const c = await chrome();
try {
  const report = { at: new Date().toISOString(), pages: {} };
  for (const [v, BEATS] of Object.entries(PAGES)) {
    report.pages[v] = {};
    for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone']]) {
      c.errors.length = 0;
      await c.visit(`http://127.0.0.1:8794/studies/iterations/109/${v}.html`, w, h);
      await c.waitFor('window.__ready', 30000);
      const beats = {};
      for (const [name, at] of BEATS) {
        await c.evaluate(to(at)); await sleep(1300);
        await c.shot(path.join(here, 'shots', `${v}-${tag}-${name}.png`));
        beats[name] = await c.evaluate('window.__measure()');
      }
      await c.evaluate('scrollTo(0, document.body.scrollHeight), 1'); await sleep(600);
      await c.shot(path.join(here, 'shots', `${v}-${tag}-end.png`));
      report.pages[v][tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
      console.log(v, tag, 'errors', c.errors.length, c.errors[0] || '');
    }
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
