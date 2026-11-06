// Study 84: each page (?v=a|b|c|d) whole, at 1440 and 390: img/case-<v>-<w>.png, from the nav to the end of
// the bet strip. Before the shot the reader's moves are made, so the reveals show: Thursday picked in the
// night picker, "something else" and the coffeeshop door (b §3), the run from the six (b §5), one of the six
// on the first domino (c §4), Tuesday tapped at the close (c §7, d §6). Reports page errors.
// Needs a server.   node studies/iterations/84/shoot.mjs [base]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
import build from './build.cjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/';
const only = process.argv[3];
const c = await chrome();
let bad = 0;
const MOVES = `(() => {
  const q = (s) => document.querySelector(s);
  const thu = q('.nights li[data-day="thu"]'); if (thu) thu.click();
  const ch = q('[data-choose] button:last-child'); if (ch) ch.click();
  const door = q('.doorb:not(.ewc)'); if (door) door.click();
  const run = q('.rsw [data-run="2"]'); if (run) run.click();
  const chip = q('.chip[data-chip="member"]'); if (chip) chip.click();
  const lit = q('[data-reply] li:nth-child(2)'); if (lit) lit.click();
  document.querySelectorAll('[data-anim]:not(.block), .doms.fall, .pace, .drop, .stand, .clubblock').forEach(x => x.classList.add('in'));
  window.scrollTo(0, 0);
})()`;
try {
  for (const v of build.OPTIONS) for (const w of [1440, 390]) {
    if (only && only !== v) continue;
    c.errors.length = 0;
    await c.visit(base + '84/six.html?v=' + v, w, 900); await sleep(600);
    await c.evaluate(MOVES); await sleep(400);
    await c.evaluate(`document.fonts.ready.then(() => true)`); await sleep(400);
    let h = 0;
    for (let i = 0; i < 3; i++) { // the page's height settles after fonts and the reveals; size to it until it holds
      const nh = await c.evaluate(`Math.ceil(document.querySelector('.case').getBoundingClientRect().bottom + scrollY)`);
      if (nh === h) break; h = nh;
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }); await sleep(2600);
    }
    await c.evaluate(`document.querySelectorAll('.block').forEach(b => b.classList.remove('in'))`); await sleep(1400);
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    fs.writeFileSync(path.join(here, 'img', `case-${v}-${w}.png`), Buffer.from(data, 'base64')); console.log(`case-${v}-${w}.png`, h);
    if (c.errors.length) { bad++; console.log('PROBLEMS', v, w, c.errors.join(' | ')); }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
