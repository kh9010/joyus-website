// Study 88: loads case.html as each option (and with no ?v) at 1440 and 390 in headless Chrome and prints, as
// JSON for check.cjs: which option is shown, the page's width, its full height at 390 (header to footer,
// nothing tapped), the smallest text on it, and any page errors. With SHOOT=1 it also writes
// img/case-<v>-390.png (the whole phone page) and img/case-<v>-1440.png (the first screen).
//   node studies/iterations/88/measure.mjs http://127.0.0.1:8823/studies/iterations/88/case.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const c = await chrome();
const out = {};
try {
  for (const v of ['', 'a', 'b', 'c', 'd']) {
    out[v] = {};
    for (const w of [1440, 390]) {
      c.errors.length = 0;
      await c.visit(url + (v ? '?v=' + v : ''), w, 844); await sleep(700);
      await c.evaluate(`document.fonts.ready.then(() => true)`);
      const m = await c.evaluate(`({ shown: [...document.querySelectorAll('.case')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.dataset.opt),
        styles: [...document.querySelectorAll('style[data-opt]')].map(s => s.dataset.opt),
        pageWidth: document.documentElement.scrollWidth,
        page: Math.ceil(document.documentElement.scrollHeight),
        minFont: Math.min(...[...document.querySelectorAll('.case *')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize))) })`);
      out[v][w] = { ...m, errors: [...c.errors] };
      if (process.env.SHOOT && v) {
        if (w === 390) {
          await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: m.page, deviceScaleFactor: 1, mobile: true }); await sleep(300);
        }
        await c.shot(path.join(here, 'img', `case-${v}-${w}.png`));
      }
    }
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
