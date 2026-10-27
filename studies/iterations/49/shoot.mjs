// Study 49: pictures of a card open (T-a), at 1440 (img/card-1440.png, the last member's, at the
// right edge) and on a phone (img/card-390.png, the right-hand column's, slid back on screen),
// both "without EWC"; and the page "with EWC" with a card open (img/card-with-1440.png).
// Reports page errors. Needs the server.   node studies/iterations/49/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const U = 'http://127.0.0.1:8794/studies/iterations/49/six.html';
const c = await chrome();
let bad = 0;
const save = async (file, clip) => { const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } }); fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64')); console.log(file); };
const tall = async (w, h) => { await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: w < 700 ? 2 : 1, mobile: w < 700 }); await sleep(300); };
try {
  for (const [w, m, withEwc, file, h] of [[1440, 'MCHE', false, 'card-1440.png', 560], [390, 'CCG', false, 'card-390.png', 620], [1440, 'CCG', true, 'card-with-1440.png', 640]]) {
    c.errors.length = 0;
    await c.visit(U, w, 900); await sleep(300);
    await tall(w, 2400);
    if (withEwc) { await c.evaluate(`document.querySelector('.flip button[data-with="1"]').click()`); await sleep(150); }
    await c.evaluate(`document.querySelector('.col[data-m="${m}"] h3').click()`); await sleep(250);
    const y = await c.evaluate(`Math.round(document.querySelector('.body').getBoundingClientRect().top + scrollY)`);
    await save(file, { x: 0, y, width: w, height: h });
    if (c.errors.length) { bad++; console.log('PROBLEMS', file, c.errors.join(' | ')); }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
