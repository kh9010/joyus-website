// Study 38: the pictures only, before the long test (Divya, 13 Oct: the images
// were slow to come). The page wide and on a phone, and the words block in
// each of the twelve subtitle fonts. About two minutes. Needs the server.
//   node studies/iterations/38/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/38/coming-soon.html';
const SEED = 'study38';
const LINES = ['grotesk', 'serif', 'fraunces', 'newsreader', 'playfair', 'cormorant', 'mono', 'plex', 'hand', 'lilita', 'nunito', 'bricolage'];
const RECTS = `(() => { const R = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  return { words: R('.below'), h1: R('h1'), last: R('.links li:last-child a'), stage: R('#stage') }; })()`;
const c = await chrome();
try {
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });   // built at once
  for (const line of LINES) {
    await c.visit(`${URL}?seed=${SEED}&line=${line}`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(900);   // the font
    const r = await c.evaluate(RECTS);
    const clip = { x: Math.round(r.words.l - 8), y: Math.round(r.h1.t - 28), width: Math.round(r.words.w + 8), height: Math.round(r.last.b - r.h1.t + 56), scale: 1 };
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip });
    fs.writeFileSync(path.join(here, 'img', `line-${line}.png`), Buffer.from(data, 'base64'));
    if (line === 'grotesk') await c.shot(path.join(here, 'img', 'page-gummy.png'));
    console.log('shot', line);
  }
  await c.visit(`${URL}?seed=${SEED}`, 390, 844);
  await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(600);
  await c.shot(path.join(here, 'img', 'page-phone.png'));
  console.log('shot phone');
} finally { c.close(); }
