// Study 48: the picking sheet and the hovers, driven in a headless Chrome at 1440 and 390.
// Taps a treatment and two members' options, reads the summary and the page in the frame,
// opens a hover by tap and "show all". Prints JSON; check.cjs holds it. Needs the server.
//   node studies/iterations/48/picks.mjs
import { chrome, sleep } from './cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/48/';
const c = await chrome();
const out = {};
try {
  for (const w of [1440, 390]) {
    c.errors.length = 0;
    await c.visit(base + 'index.html', w, 900); await sleep(500);
    await c.evaluate(`localStorage.clear(); [...document.querySelectorAll('.card[aria-pressed="true"]')].forEach(b => b.click())`);
    await c.evaluate(`['T-c', 'QC-b', 'QC-e', 'MCHE-d'].forEach(k => document.querySelector('.card[data-code="' + k + '"]').click())`);
    await sleep(200);
    out[w] = await c.evaluate(`(() => {
      const f = document.getElementById('page').contentDocument;
      const shown = (m) => [...f.querySelectorAll('#hov-' + m + ' .opt')].filter(x => !x.hidden).map(x => x.dataset.opt);
      const col = f.querySelector('.col[data-m="QC"]'); col.click();
      const open = getComputedStyle(col.querySelector('.hov')).display;
      const dim = getComputedStyle(f.querySelector('.col[data-m="CCG"]')).opacity;
      col.click();
      f.querySelector('.hint .all').click();
      const allOpen = [...f.querySelectorAll('.hov')].every(h => getComputedStyle(h).display === 'block');
      f.querySelector('.hint .all').click();
      return {
        summary: document.getElementById('summary').textContent,
        pressed: [...document.querySelectorAll('.card[aria-pressed="true"]')].map(b => b.dataset.code),
        treatment: [...f.body.classList].find(k => /^t-[abc]$/.test(k)),
        qc: shown('QC'), mche: shown('MCHE'), ccg: shown('CCG'),
        tapOpens: open, othersDim: +dim, showAll: allOpen,
        copy: !!document.querySelector('button#copy.copy'), dockVisible: getComputedStyle(document.querySelector('.dock')).position,
        stored: localStorage.getItem('joyus-study-48-picks'),
        wide: document.documentElement.scrollWidth, pageWide: f.documentElement.scrollWidth,
      };
    })()`);
    // a reload keeps the picks
    await c.visit(base + 'index.html', w, 900); await sleep(400);
    out[w].afterReload = await c.evaluate(`[...document.querySelectorAll('.card[aria-pressed="true"]')].map(b => b.dataset.code)`);
    out[w].errors = [...c.errors];
    await c.evaluate(`localStorage.clear()`);
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
