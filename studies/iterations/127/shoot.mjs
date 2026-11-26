// Study 127: each typeface at the same moments (the host arriving, and the end), wide and on a phone; and what the check reads.
// Needs the studies server on 8794. One headless Chrome (SwiftShader, never the GPU).
//   node studies/iterations/127/shoot.mjs        -> shots/<id>-<view>-<beat>.png, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const IDS = ['space', 'bricolage', 'instrument', 'schibsted', 'familjen', 'dmsans'];
const VIEWS = [[1440, 900, 'wide'], [390, 844, 'phone'], [390, 664, 'short']];
const BEATS = [['third', .6, 1800], ['full', .97, 3200]];
const to = (at) => `(() => { const r = document.getElementById('run'); scrollTo(0, ${at} * (r.offsetHeight - innerHeight)); return 1 })()`;
const c = await chrome(), report = { at: new Date().toISOString(), pages: {} };
try {
  for (const id of IDS) {
    report.pages[id] = {};
    for (const [w, h, tag] of VIEWS) {
      c.errors.length = 0;
      await c.visit(`http://127.0.0.1:8794/studies/iterations/127/f-${id}.html`, w, h);
      await c.waitFor('window.__ready', 30000);
      const beats = {};
      for (const [name, at, wait] of BEATS) { await c.evaluate(to(at)); await sleep(wait); if (tag !== 'short') await c.shot(path.join(here, 'shots', `${id}-${tag}-${name}.png`)); beats[name] = await c.evaluate('window.__measure()'); }
      beats.font = await c.evaluate(`[...new Set([...document.querySelectorAll('#q, .t, .cap b, .cap span, .top .wm, .top nav a')].map(e => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))]`);
      beats.loaded = await c.evaluate(`document.fonts.check('700 20px "' + getComputedStyle(document.querySelector('.t')).fontFamily.split(',')[0].replace(/"/g, '') + '"')`);
      report.pages[id][tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
      console.log(id, tag, 'errors', c.errors.length, c.errors[0] || '');
    }
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
