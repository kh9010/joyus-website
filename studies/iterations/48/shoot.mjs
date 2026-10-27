// Study 48: the three hover treatments on the page (QC open, 1440, img/hover-t-*.png), the
// picking sheet on a phone (img/sheet-390.png: the first members' cards, two picked) and
// the picks block with the copy button (img/picks-390.png). Reports page errors.
// Needs the server.   node studies/iterations/48/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const B = 'http://127.0.0.1:8794/studies/iterations/48/';
const c = await chrome();
let bad = 0;
const save = async (file, clip) => { const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } }); fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64')); console.log(file); };
const tall = async (w, h) => { await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }); await sleep(300); };
try {
  for (const t of ['T-a', 'T-b', 'T-c']) {
    c.errors.length = 0;
    await c.visit(B + 'six.html?picks=' + t, 1440, 900); await sleep(300);
    await tall(1440, 2000);
    await c.evaluate(`document.querySelector('.col[data-m="QC"]').click()`); await sleep(200);
    const y = await c.evaluate(`Math.round(document.querySelector('.body').getBoundingClientRect().top + scrollY)`);
    await save('hover-' + t.toLowerCase() + '.png', { x: 0, y, width: 1440, height: 640 });
    if (c.errors.length) { bad++; console.log('PROBLEMS', t, c.errors.join(' | ')); }
  }
  await c.visit(B + 'index.html', 390, 844); await sleep(500);
  await c.evaluate(`localStorage.clear(); ['T-b', 'QC-c'].forEach(k => document.querySelector('.card[data-code="' + k + '"]').click())`); await sleep(200);
  // phone-sized screenshots of the viewport, scrolled to the sheet and to the picks block (the dock shows as on a phone)
  await c.evaluate(`window.scrollTo(0, document.querySelector('.pickset').getBoundingClientRect().top + scrollY - 10)`); await sleep(300);
  await c.shot(path.join(here, 'img', 'sheet-390.png')); console.log('sheet-390.png');
  await c.evaluate(`window.scrollTo(0, document.querySelector('.picks').getBoundingClientRect().top + scrollY - 10)`); await sleep(300);
  await c.shot(path.join(here, 'img', 'picks-390.png')); console.log('picks-390.png');
  await c.evaluate(`localStorage.clear()`);
  if (c.errors.length) { bad++; console.log('PROBLEMS sheet', c.errors.join(' | ')); }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
