// Study 49 (as 47, 48): the "with EWC" state's spacing, measured in a headless Chrome at 1440 and 390.
// Prints JSON per width: the narrowest gap between two evenings side by side, the
// narrowest gap between two rows, the gives' line height (as a ratio), the narrowest
// give, and the widest gap between a name's text and its give. check.cjs holds the numbers.
// Needs the server.   node studies/iterations/49/measure.mjs [url]
import { chrome, sleep } from './cdp.mjs';
const url = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/49/six.html';
const c = await chrome();
const out = {};
try {
  for (const w of [1440, 390]) {
    await c.visit(url, w, 900); await sleep(300);
    await c.evaluate(`document.querySelector('.flip button[data-with="1"]').click()`);
    await sleep(200);
    out[w] = await c.evaluate(`(() => {
      const cols = [...document.querySelectorAll('.six .col')].map(c => ({ r: c.getBoundingClientRect(), h: (() => { const r = document.createRange(); r.selectNodeContents(c.querySelector('h3')); return r.getBoundingClientRect(); })(), p: c.querySelector('.with p') }));
      const rows = {}; cols.forEach(c => (rows[Math.round(c.r.top)] ||= []).push(c));
      const tops = Object.keys(rows).map(Number).sort((a, b) => a - b);
      let colGap = Infinity, rowGap = Infinity;
      for (const t of tops) { const rs = rows[t].sort((a, b) => a.r.left - b.r.left); for (let i = 1; i < rs.length; i++) colGap = Math.min(colGap, rs[i].r.left - rs[i - 1].r.right); }
      for (let i = 1; i < tops.length; i++) rowGap = Math.min(rowGap, tops[i] - Math.max(...rows[tops[i - 1]].map(c => c.r.bottom)));
      const ps = cols.map(c => c.p), cs = ps.map(p => getComputedStyle(p));
      return {
        perRow: Math.max(...tops.map(t => rows[t].length)),
        colGap: colGap === Infinity ? null : Math.round(colGap),
        rowGap: rowGap === Infinity ? null : Math.round(rowGap),
        lineHeight: Math.min(...cs.map(s => parseFloat(s.lineHeight) / parseFloat(s.fontSize))),
        fontSize: Math.min(...cs.map(s => parseFloat(s.fontSize))),
        giveWidth: Math.round(Math.min(...ps.map(p => p.getBoundingClientRect().width))),
        nameToGive: Math.round(Math.max(...cols.map(c => c.p.getBoundingClientRect().top - c.h.bottom))),
        pageWidth: document.documentElement.scrollWidth,
      };
    })()`);
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
