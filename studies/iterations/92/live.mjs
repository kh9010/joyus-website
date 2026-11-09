// Study 92: drives the desk in headless Chrome at 390 (a phone) and 1280, and prints JSON for check.cjs:
// the desk's width and smallest text, the draft's smallest text with option 1s and with every row's last
// option, whether a tap changes the draft and the "see the draft" button opens it full width, and any page
// errors. SHOOT=1 also writes img/desk-390.png (the first phone screen), img/draft-390.png (the draft opened
// over it), img/desk-1280.png.
//   node studies/iterations/92/live.mjs http://127.0.0.1:<port>/studies/iterations/92/index.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const c = await chrome();
const out = {};
const minFont = (doc) => `Math.min(...[...${doc}.querySelectorAll('body *')].filter(e => e.getClientRects().length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize)))`;
const draftReady = `(() => { const d = document.getElementById('draft').contentDocument; return d && d.readyState === 'complete' && d.querySelector('h1') })()`;
try {
  for (const w of [1280, 390]) {
    c.errors.length = 0;
    await c.visit(url, w, 844); await sleep(600);
    await c.evaluate(`document.fonts.ready.then(() => true)`);
    await c.waitFor(`document.getElementById('status').textContent.includes('changed from 91 a')`);
    await c.waitFor(draftReady);
    const r = {};
    r.pageWidth = await c.evaluate(`document.documentElement.scrollWidth`);
    r.deskFont = await c.evaluate(minFont('document'));
    r.draftFont = await c.evaluate(minFont(`document.getElementById('draft').contentDocument`));
    r.h1 = await c.evaluate(`document.getElementById('draft').contentDocument.querySelector('h1').textContent`);
    if (w === 390) {
      r.draftHiddenAtFirst = await c.evaluate(`getComputedStyle(document.querySelector('.preview')).display === 'none'`);
      if (process.env.SHOOT) await c.shot(path.join(here, 'img', 'desk-390.png'));
    } else if (process.env.SHOOT) await c.shot(path.join(here, 'img', 'desk-1280.png'));
    // tap every row's last option, then read the draft
    await c.evaluate(`document.querySelectorAll('section.row').forEach(s => { const b = [...s.querySelectorAll('.opt')].pop(); b.click(); }), true`);
    await sleep(800); await c.waitFor(draftReady);
    r.status = await c.evaluate(`document.getElementById('status').textContent`);
    r.h1After = await c.evaluate(`document.getElementById('draft').contentDocument.querySelector('h1').textContent`);
    r.draftFontLast = await c.evaluate(minFont(`document.getElementById('draft').contentDocument`));
    r.draftWidthLast = await c.evaluate(`document.getElementById('draft').contentDocument.documentElement.scrollWidth`);
    if (w === 390) {
      await c.evaluate(`document.getElementById('see').click(), true`); await sleep(400);
      r.drafting = await c.evaluate(`(() => { const f = document.getElementById('draft').getBoundingClientRect(); return { shown: getComputedStyle(document.querySelector('.preview')).display !== 'none', width: Math.round(f.width) } })()`);
      if (process.env.SHOOT) await c.shot(path.join(here, 'img', 'draft-390.png'));
      await c.evaluate(`document.getElementById('back').click(), true`); await sleep(200);
      r.backHides = await c.evaluate(`getComputedStyle(document.querySelector('.preview')).display === 'none'`);
    }
    // back to 91 a: tap every first option
    await c.evaluate(`document.querySelectorAll('section.row').forEach(s => s.querySelector('.opt').click()), true`);
    await sleep(800);
    r.statusReset = await c.evaluate(`document.getElementById('status').textContent`);
    r.errors = [...c.errors];
    out[w] = r;
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
