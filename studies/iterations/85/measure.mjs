// Study 85: loads case.html as each option (and with no ?v) at 1440 and 390 in headless Chrome and prints
// which option is shown, the page's width and any page errors, as JSON, for check.cjs.
//   node studies/iterations/85/measure.mjs http://127.0.0.1:8794/studies/iterations/85/case.html
import { chrome, sleep } from './cdp.mjs';
const url = process.argv[2];
const c = await chrome();
const out = {};
try {
  for (const v of ['', 'a', 'b', 'c', 'd']) {
    out[v] = {};
    for (const w of [1440, 390]) {
      c.errors.length = 0;
      await c.visit(url + (v ? '?v=' + v : ''), w, 900); await sleep(900);
      const m = await c.evaluate(`({ shown: [...document.querySelectorAll('.case')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.dataset.opt), pageWidth: document.documentElement.scrollWidth })`);
      out[v][w] = { ...m, errors: [...c.errors] };
    }
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
