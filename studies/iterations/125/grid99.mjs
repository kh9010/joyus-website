// Study 125: Study 99's grid, measured live, the thing every version here has to keep. Writes grid99.json.
//   node studies/iterations/125/grid99.mjs      (server on 8794; one headless Chrome)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const c = await chrome(), out = {};
try {
  for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone'], [390, 664, 'short']]) {
    await c.visit('http://127.0.0.1:8794/studies/iterations/99/case.html', w, h);
    await c.waitFor('window.__ready', 30000);
    await c.evaluate(`(() => { const r = document.getElementById('run'); scrollTo(0, .6 * (r.offsetHeight - innerHeight)); return 1 })()`); await sleep(1200);
    out[tag] = await c.evaluate(`(() => { const g = document.getElementById('grid'), gr = g.getBoundingClientRect(), t = [...g.children];
      return { cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, width: Math.round(gr.width), left: Math.round(gr.left), top: Math.round(gr.top),
        gap: parseFloat(getComputedStyle(g).columnGap), row: +parseFloat(getComputedStyle(g).gridAutoRows).toFixed(1),
        cells: t.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left - gr.left), Math.round(r.top - gr.top), Math.round(r.width), Math.round(r.height)]; }),
        words: t.map(e => e.textContent), type: getComputedStyle(t[0]).fontFamily.split(',')[0].replace(/"/g, ''), size: parseFloat(getComputedStyle(t[0]).fontSize), weight: getComputedStyle(t[0]).fontWeight,
        rule: getComputedStyle(t[0]).borderTopWidth }; })()`);
    console.log(tag, JSON.stringify({ ...out[tag], cells: out[tag].cells.length + ' cells', words: undefined }));
  }
  fs.writeFileSync(path.join(here, 'grid99.json'), JSON.stringify(out, null, 1));
} finally { c.close(); }
