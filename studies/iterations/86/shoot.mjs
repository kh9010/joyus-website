// Study 86: each variant (?v=a|b|c|d) whole, at 1440 and 390: img/case-<v>-<w>.png, from the nav to the end of
// the bet strip. Before the shot everything that plays on scroll is played, one beam is tapped (the Operator's,
// so its other wants and its answer light) and c's small tile is touched. Prints each page's height.
// Needs a server.   node studies/iterations/86/shoot.mjs [base] [only-option]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
import build from './build.cjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/';
const only = process.argv[3];
const c = await chrome();
let bad = 0;
const MOVES = `(() => {
  document.querySelectorAll('[data-anim]').forEach(x => x.classList.add('in'));
  const e = document.querySelector('.end[data-m="2"]'); if (e && !e.classList.contains('on')) e.click();
  const s = document.querySelector('[data-stand]'); if (s) s.click();
  window.scrollTo(0, 0);
})()`;
try {
  for (const v of build.OPTIONS) for (const w of [1440, 390]) {
    if (only && only !== v) continue;
    c.errors.length = 0;
    await c.visit(base + '86/case.html?v=' + v, w, 900); await sleep(800);
    await c.evaluate(`document.fonts.ready.then(() => true)`); await sleep(300);
    await c.evaluate(MOVES); await sleep(400);
    let h = 0;
    for (let i = 0; i < 3; i++) {
      const nh = await c.evaluate(`Math.ceil(document.querySelector('.case').getBoundingClientRect().bottom + scrollY)`);
      if (nh === h) break; h = nh;
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }); await sleep(3600);
    }
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    fs.writeFileSync(path.join(here, 'img', `case-${v}-${w}.png`), Buffer.from(data, 'base64')); console.log(`case-${v}-${w}.png`, h);
    if (c.errors.length) { bad++; console.log('PROBLEMS', v, w, c.errors.join(' | ')); }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
