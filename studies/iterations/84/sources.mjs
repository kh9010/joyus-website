// Study 84: the "what we made" thumbnails, from the real work (needs ~/dev/ewc on this machine).
// voice.png = the brand guide's "Voice & tone · How we sound" slide; kit.png = the sales kit's header and
// its "Thirty seconds" routing (cropped above the plays, whose first notes carry a client person's name);
// values.png = two rows of the session 4 values board (cropped from Study 43's figjam-session4-values.jpg,
// right of the persona cards, which carry income figures); site.png = Study 43's site-home.png, as is.
//   node studies/iterations/84/sources.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const ewc = path.join(os.homedir(), 'dev/ewc/src');
const c = await chrome();
// box: an expression returning {top, bottom} in page px for what to keep
const grab = async (file, url, w, box) => {
  await c.visit('file://' + url, w, 900); await sleep(1500);
  const b = await c.evaluate(`(() => { document.querySelectorAll('.reveal').forEach(x => { x.style.opacity = 1; x.style.transform = 'none'; }); ${box} })()`);
  if (b.bottom > 900) await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: Math.ceil(b.bottom) + 10, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: b.left || 0, y: b.top, width: b.width || w, height: b.bottom - b.top, scale: 1 } });
  fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64')); console.log(file, JSON.stringify(b));
};
try {
  await grab('voice.png', path.join(ewc, 'brand-guide.html'), 1440,
    `const e = document.querySelector('section[aria-label="Voice and tone — how we sound"]'); e.parentElement.scrollTo({ left: e.offsetLeft, behavior: 'instant' }); return { top: 0, bottom: 900 };`);
  await grab('kit.png', path.join(ewc, 'sales-kit.html'), 1200,
    `const s = document.querySelector('section'); const r = s.getBoundingClientRect(); return { top: 0, bottom: Math.round(r.bottom + scrollY) };`);
} finally { c.close(); }
