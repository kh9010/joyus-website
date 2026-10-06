// Screenshots the page for each font × 2D/3D (same seed, same look) → img/f-<font>-<mode>.png
// Needs the studies server.  node studies/iterations/20/shots.mjs [look]
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const LOOK = process.argv[2] || 'sugared';
const FONTS = ['unbounded', 'baloo', 'space-grotesk', 'fraunces', 'bricolage', 'arial-black'];
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
const c = await chrome();
try {
  for (const font of FONTS) for (const mode of ['2d', '3d']) {
    c.errors.length = 0;
    await c.visit(`http://127.0.0.1:8794/studies/iterations/20/coming-soon.html?look=${LOOK}&font=${font}&mode=${mode}&seed=study20`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    for (let k = 0; !(await c.evaluate('window.__cs.assembled')) && k < 400; k++) { await move(c, 720 + 300 * Math.sin(k / 3), 450 + 150 * Math.cos(k / 4)); await sleep(30); }
    await move(c, 720, 450); await sleep(1800);
    await c.shot(path.join(here, 'img', `f-${font}-${mode}.png`));
    console.log(font, mode, c.errors.length ? c.errors : 'ok');
  }
} finally { c.close(); }
