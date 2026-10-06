// Screenshots each sign variant in a look (same seed) → img/sign-<variant>-<look>.png, plus a close crop.
//   node studies/iterations/22/shots.mjs [look ...]
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const LOOKS = process.argv.slice(2).length ? process.argv.slice(2) : ['sugared'];
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
const c = await chrome();
try {
  for (const look of LOOKS) for (const sign of (process.env.SIGNS || 'soft,stones,worker,pile').split(',')) {
    c.errors.length = 0;
    await c.visit(`http://127.0.0.1:8794/studies/iterations/22/coming-soon.html?look=${look}&sign=${sign}&seed=study22`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    for (let k = 0; !(await c.evaluate('window.__cs.assembled')) && k < 400; k++) { await move(c, 720 + 300 * Math.sin(k / 3), 450 + 150 * Math.cos(k / 4)); await sleep(30); }
    await move(c, 720, 450); await sleep(1800);
    await c.shot(path.join(here, 'img', `sign-${sign}-${look}.png`));
    console.log(sign, look, await c.evaluate('window.__cs.signStones'), c.errors.length ? c.errors : 'ok');
  }
} finally { c.close(); }
