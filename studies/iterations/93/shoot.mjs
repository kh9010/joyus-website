// Study 93: the pictures. Needs the studies server (or BASE=http://127.0.0.1:<port>/ serving the repo root).
//   node studies/iterations/93/shoot.mjs           each option, whole page, at 390 and 1280 -> img/case-<v>-<w>.png
//   node studies/iterations/93/shoot.mjs --stones  the brand's real stones from stones.html -> img/stone-1..6.png, img/j.png
//   node studies/iterations/93/shoot.mjs --hers    Divya's agemo case study (work/agemo.html), first screens, for the side by side
// One headless Chrome at a time (CLAUDE.md).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://127.0.0.1:8794/';
const img = (f) => path.join(here, 'img', f);
const c = await chrome();
async function whole(url, w, out, maxH = 8000, prep = '1') {
  await c.visit(url, w, w < 700 ? 844 : 900);
  await c.evaluate('document.fonts.ready.then(() => 1)');
  await c.evaluate(prep); await sleep(600);
  const h = Math.min(maxH, await c.evaluate('Math.ceil(document.documentElement.scrollHeight)'));
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  fs.writeFileSync(out, Buffer.from(data, 'base64')); console.log(path.relative(here, out), w + 'x' + h);
}
try {
  if (process.argv.includes('--stones')) {
    await c.visit(BASE + 'studies/iterations/93/stones.html', 900, 900);
    await c.waitFor('window.__stones', 120000);
    const s = await c.evaluate('window.__stones');
    s.forEach((u, i) => fs.writeFileSync(img(i < 6 ? 'stone-' + (i + 1) + '.png' : 'j.png'), Buffer.from(u.split(',')[1], 'base64')));
    console.log('stones: ' + s.length);
  } else if (process.argv.includes('--hers')) {
    // agemo reveals its sections on scroll; show them all so the picture is the page as read
    const reveal = "document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')); const st = document.createElement('style'); st.textContent = '.reveal{opacity:1!important;transform:none!important}'; document.head.appendChild(st); 1";
    await whole(BASE + 'work/agemo.html', 1280, img('hers-agemo-1280.png'), 2600, reveal);
    await whole(BASE + 'work/agemo.html', 390, img('hers-agemo-390.png'), 2600, reveal);
  } else {
    for (const v of ['a', 'b', 'c', 'd']) for (const w of [390, 1280]) await whole(BASE + 'studies/iterations/93/case.html?v=' + v, w, img(`case-${v}-${w}.png`));
  }
  if (c.errors.length) { console.log('page errors:', c.errors); process.exitCode = 1; }
} finally { c.close(); }
