// Study 47: the page wide (img/six.png, "without EWC", from the body down) and "with EWC"
// at 1440 and 390 (img/after-with-*.png). img/before-with-*.png are 46 · 2 shot the same
// way on 27 Oct, kept as they were. Reports page errors and anything past the edge.
// Needs the server.   node studies/iterations/47/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/47/six.html';
const c = await chrome();
let bad = 0;
const clip = async (w, file) => {
  const y = await c.evaluate(`Math.round(document.querySelector('.body').getBoundingClientRect().top + scrollY)`);
  const h = await c.evaluate(`Math.round(document.querySelector('.body').getBoundingClientRect().height)`);
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: y + h + 20, deviceScaleFactor: 1, mobile: w < 700 });
  await sleep(300);
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y, width: w, height: h, scale: 1 } });
  fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64'));
};
try {
  for (const w of [1440, 390]) for (const on of [false, true]) {
    c.errors.length = 0;
    await c.visit(URL, w, 900); await sleep(300);
    if (on) { await c.evaluate(`document.querySelector('.flip button[data-with="1"]').click()`); await sleep(200); }
    const s = await c.evaluate(`({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight })`);
    const probs = [...c.errors, ...(s.w > w ? ['page is ' + s.w + 'px wide'] : [])];
    if (probs.length) bad++;
    console.log(w + 'px', on ? 'with' : 'without', s.h + 'px tall', probs.length ? 'PROBLEMS: ' + probs.join(' | ') : 'ok');
    if (on) await clip(w, `after-with-${w}.png`); else if (w === 1440) await clip(w, 'six.png');
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
