// Screenshots each sign placement (same seed) → img/site-<site>-<look>.png
//   node studies/iterations/25/shots.mjs [look ...]
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const LOOKS = process.argv.slice(2).length ? process.argv.slice(2) : ['sugared'];
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
const c = await chrome();
try {
  for (const look of LOOKS) for (const site of (process.env.SITES || 'toppled,flat,lean').split(',')) {
    c.errors.length = 0;
    await c.visit(`http://127.0.0.1:8794/studies/iterations/25/coming-soon.html?look=${look}&site=${site}&seed=study25`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    for (let k = 0; !(await c.evaluate('window.__cs.assembled')) && k < 400; k++) { await move(c, 720 + 300 * Math.sin(k / 3), 450 + 150 * Math.cos(k / 4)); await sleep(30); }
    await move(c, 720, 450); await sleep(1800);
    await c.shot(path.join(here, 'img', `site-${site}-${look}.png`));
    console.log(site, look, c.errors.length ? c.errors : 'ok');
  }
} finally { c.close(); }
