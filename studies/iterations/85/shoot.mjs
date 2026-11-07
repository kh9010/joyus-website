// Study 85: each page (?v=a|b|c|d) whole, at 1440 and 390: img/case-<v>-<w>.png, from the nav to the end of
// the bet strip. Before the shot the reader's moves are made so the reveals show: a cut ticked (b, c), the
// six rows and trays revealed, a give opened (a §3), one of the eight evenings tapped (b §3), the right piece
// set (b §4), the first tile pushed (d §3), and everything that plays on scroll played. On a phone, a's sort
// plays itself. localStorage is cleared first so every shot starts as a first visit. Reports page errors.
// Needs a server.   node studies/iterations/85/shoot.mjs [base] [only-option]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
import build from './build.cjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/';
const only = process.argv[3];
const c = await chrome();
let bad = 0;
const MOVES = (w) => `(() => {
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  qa('[data-anim], .ourgrid, .bars, .b3, .c5, .a3').forEach(x => x.classList.add('in'));
  const dp = q('[data-domplay]'); if (dp) dp.classList.add('p1', 'p2');
  const row = q('.ourgrid .row:nth-child(4)'); if (row) row.click();
  ${w < 700 ? `const ag = q('[data-trays]'); if (ag) qa('[data-knot] .chip').forEach((c, i) => { const t = q('[data-tray="' + c.dataset.kind + '"] .in-tray'); t.appendChild(c); });` : ''}
  const blk = q('[data-block]'); if (blk) { const r = blk.getBoundingClientRect(); blk.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * .38, clientY: r.top + r.height / 2, bubbles: true })); const s = q('[data-scrub]'); s.value = 2; s.dispatchEvent(new Event('input')); }
  const one = q('.t14.one'); if (one) one.click();
  const set = q('[data-set]'); if (set) set.click();
  const lump = q('[data-lump]'); if (lump) { const r = lump.getBoundingClientRect(); lump.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * .42, clientY: r.top + 20, bubbles: true })); lump.style.setProperty('--lx', (r.width * .3) + 'px'); lump.style.setProperty('--ly', '34px'); lump.classList.add('looking'); }
  const sil = q('.wrow:nth-child(4) .wsil'); if (sil) sil.click();
  const end = q('.end[data-m="2"]'); if (end) end.click();
  const first = q('[data-first]'); if (first) first.click();
  window.scrollTo(0, 0);
})()`;
try {
  for (const v of build.OPTIONS) for (const w of [1440, 390]) {
    if (only && only !== v) continue;
    c.errors.length = 0;
    await c.visit(base + '85/case.html?v=' + v, w, 900);
    await c.evaluate(`localStorage.clear(); true`);
    await c.visit(base + '85/case.html?v=' + v, w, 900); await sleep(800);
    await c.evaluate(`document.fonts.ready.then(() => true)`); await sleep(300);
    await c.evaluate(MOVES(w)); await sleep(500);
    let h = 0;
    for (let i = 0; i < 3; i++) {
      const nh = await c.evaluate(`Math.ceil(document.querySelector('.case').getBoundingClientRect().bottom + scrollY)`);
      if (nh === h) break; h = nh;
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }); await sleep(3200);
    }
    await c.evaluate(`window.dispatchEvent(new Event('resize')); true`); await sleep(600);
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    fs.writeFileSync(path.join(here, 'img', `case-${v}-${w}.png`), Buffer.from(data, 'base64')); console.log(`case-${v}-${w}.png`, h);
    if (c.errors.length) { bad++; console.log('PROBLEMS', v, w, c.errors.join(' | ')); }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
