// Study 50: "with EWC", 46 · 2 beside 50, at 1440 and 390 (img/with-46-1440.png, img/with-50-1440.png,
// img/with-46-390.png, img/with-50-390.png): the same columns, the give broken into paragraphs.
// As 49: a card open (T-a), at 1440 (img/card-1440.png, the last member's, at the right edge) and
// on a phone (img/card-390.png, the right-hand column's, slid back on screen), both "without EWC".
//
// Reports page errors. Needs the server.   node studies/iterations/50/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const U = 'http://127.0.0.1:8794/studies/iterations/50/six.html', U46 = 'http://127.0.0.1:8794/studies/iterations/46/tue-2-six.html';
const c = await chrome();
let bad = 0;
const save = async (file, clip) => { const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } }); fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64')); console.log(file); };
const tall = async (w, h) => { await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: w < 700 ? 2 : 1, mobile: w < 700 }); await sleep(300); };
try {
  for (const [w, m, withEwc, file, h, u = U] of [[1440, null, true, 'with-46-1440.png', 520, U46], [1440, null, true, 'with-50-1440.png', 560], [390, null, true, 'with-46-390.png', 1400, U46], [390, null, true, 'with-50-390.png', 1500], [1440, 'MCHE', false, 'card-1440.png', 560], [390, 'CCG', false, 'card-390.png', 620]]) {
    c.errors.length = 0;
    await c.visit(u, w, 900); await sleep(300);
    await tall(w, 2400);
    if (withEwc) { await c.evaluate(`document.querySelector('.flip button[data-with="1"]').click()`); await sleep(150); }
    if (m) { await c.evaluate(`document.querySelector('.col[data-m="${m}"] h3').click()`); await sleep(250); }
    const y = await c.evaluate(`Math.round(document.querySelector('.body').getBoundingClientRect().top + scrollY)`);
    await save(file, { x: 0, y, width: w, height: h });
    if (c.errors.length) { bad++; console.log('PROBLEMS', file, c.errors.join(' | ')); }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
