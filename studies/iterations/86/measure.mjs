// Study 86: loads case.html as each variant (and with no ?v) at 1440 and 390 in headless Chrome and prints which
// variant is shown, the page's width, the page's height at 390 (the sections alone, nav to the last section,
// and with the bet strip) and any page errors, as JSON, for check.cjs.
//   node studies/iterations/86/measure.mjs http://127.0.0.1:8794/studies/iterations/86/case.html
import { chrome, sleep } from './cdp.mjs';
const url = process.argv[2];
const c = await chrome();
const out = {};
try {
  for (const v of ['', 'a', 'b', 'c', 'd']) {
    out[v] = {};
    for (const w of [1440, 390]) {
      c.errors.length = 0;
      await c.visit(url + (v ? '?v=' + v : ''), w, 844); await sleep(900);
      await c.evaluate(`document.fonts.ready.then(() => true)`);
      const m = await c.evaluate(`({ shown: [...document.querySelectorAll('.case')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.dataset.opt),
        pageWidth: document.documentElement.scrollWidth,
        page: (() => { const s = [...document.querySelectorAll('.case .s')].pop(); return s ? Math.ceil(s.getBoundingClientRect().bottom + scrollY) : 0; })(),
        withBet: (() => { const b = document.querySelector('.case .bet'); return b ? Math.ceil(b.getBoundingClientRect().bottom + scrollY) : 0; })() })`);
      out[v][w] = { ...m, errors: [...c.errors] };
    }
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
