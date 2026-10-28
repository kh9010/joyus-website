// Study 50: the columns and the room inside them, measured in a headless Chrome at 1440 and 390,
// without and with EWC. Prints JSON per state and width: every column's left and width (to the
// pixel), how many sit in a row, and inside the columns, with EWC, the narrowest gap between two
// paragraphs of a give and the fewest paragraphs any give has. check.cjs runs this on 46 · 2 and
// on 50 and holds 50's columns equal to 46 · 2's ("You cannot move the columns").
// Needs the server.   node studies/iterations/50/measure.mjs [url]
import { chrome, sleep } from './cdp.mjs';
const url = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/50/six.html';
const c = await chrome();
const out = {};
try {
  for (const state of ['without', 'with']) for (const w of [1440, 390]) {
    await c.visit(url, w, 900); await sleep(300);
    if (state === 'with') { await c.evaluate(`document.querySelector('.flip button[data-with="1"]').click()`); await sleep(200); }
    out[state + '-' + w] = await c.evaluate(`(() => {
      const cols = [...document.querySelectorAll('.six .col')];
      const rs = cols.map(c => c.getBoundingClientRect());
      const rows = {}; rs.forEach(r => (rows[Math.round(r.top)] ||= 0, rows[Math.round(r.top)]++));
      const ps = cols.map(c => [...c.querySelectorAll('.with p')]);
      let gap = Infinity;
      for (const list of ps) for (let i = 1; i < list.length; i++) gap = Math.min(gap, list[i].getBoundingClientRect().top - list[i - 1].getBoundingClientRect().bottom);
      return {
        cols: rs.map(r => [Math.round(r.left), Math.round(r.width)]),
        perRow: Math.max(...Object.values(rows)),
        paraGap: gap === Infinity ? null : Math.round(gap),
        fewestParas: Math.min(...ps.map(l => l.length)),
        pageWidth: document.documentElement.scrollWidth,
      };
    })()`);
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
