// Study 95: the pictures, and what the check reads. Needs the studies server on 8794. One headless Chrome at a time.
//   node studies/iterations/95/shoot.mjs      the page at its beats: wide, phone, and a short phone (browser bars showing) -> shots/, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL_ = 'http://127.0.0.1:8794/studies/iterations/95/case.html';
const BEATS = [['question', .02], ['offer', .19], ['one', .29], ['empty', .39], ['third', .6], ['fifth', .77], ['full', .97]];
const c = await chrome();
try {
  const report = { at: new Date().toISOString(), views: {} };
  for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone'], [390, 664, 'short']]) {
    await c.visit(URL_, w, h);
    await c.waitFor('window.__ready', 30000);
    const beats = {};
    for (const [name, at] of BEATS) {
      await c.evaluate(`(() => { const r = document.getElementById('run'); scrollTo(0, ${at} * (r.offsetHeight - innerHeight)); return 1 })()`);
      await sleep(600);
      await c.shot(path.join(here, 'shots', `${tag}-${name}.png`));
      beats[name] = await c.evaluate('window.__measure()');
    }
    await c.evaluate('scrollTo(0, document.body.scrollHeight), 1'); await sleep(400);
    await c.shot(path.join(here, 'shots', `${tag}-end.png`));
    report.views[tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
    console.log(tag, 'errors', c.errors.length, c.errors[0] || '');
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
