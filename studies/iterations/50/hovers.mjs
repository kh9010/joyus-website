// Study 49: the six cards, driven in a headless Chrome at 1440 and 390, without and with EWC.
// Taps each member (a tap is a hover on a phone) and reads where its card lands, how it shows
// (T-a: floating, over the column) and what it says; then "show all". Prints JSON; check.cjs
// holds it. Needs the server.   node studies/iterations/50/hovers.mjs [url]
import { chrome, sleep } from './cdp.mjs';
const url = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/50/six.html';
const c = await chrome();
const out = {};
try {
  for (const w of [1440, 390]) {
    for (const state of ['without', 'with']) {
      c.errors.length = 0;
      await c.visit(url, w, 900); await sleep(300);
      if (state === 'with') { await c.evaluate(`document.querySelector('.flip button[data-with="1"]').click()`); await sleep(150); }
      out[w + ' ' + state] = await c.evaluate(`(async () => {
        const vw = document.documentElement.clientWidth, cards = [];
        for (const col of document.querySelectorAll('.six .col')) {
          col.scrollIntoView({ block: 'center' });
          col.querySelector('h3').click();
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const h = col.querySelector('.hov'), s = getComputedStyle(h), r = h.getBoundingClientRect(), n = col.querySelector('h3').getBoundingClientRect();
          cards.push({ m: col.dataset.m, display: s.display, position: s.position, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
            belowName: Math.round(r.top - n.bottom), opts: [...h.querySelectorAll('.opt')].map(o => o.dataset.opt), text: h.textContent.trim(),
            othersShut: [...document.querySelectorAll('.six .col')].filter(x => x !== col).every(x => getComputedStyle(x.querySelector('.hov')).display === 'none') });
          col.querySelector('h3').click();
        }
        document.querySelector('.hint .all').click();
        const allOpen = [...document.querySelectorAll('.hov')].every(h => getComputedStyle(h).display === 'block');
        document.querySelector('.hint .all').click();
        return { vw, cards, allOpen, pageWidth: document.documentElement.scrollWidth };
      })()`);
      out[w + ' ' + state].errors = [...c.errors];
    }
  }
} finally { c.close(); }
console.log(JSON.stringify(out));
