// Study 43: the six tellings, wide (1400px from the body down, for index.html) and on a
// phone (checked for anything past the edge, not kept). Reports page errors,
// so this is also the "all six render" check. The wide shot starts at the body
// (the head and hero are the same on all six). Needs the server.
//   node studies/iterations/43/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const FILES = ['telling-1-log', 'telling-2-lenses', 'telling-3-web', 'telling-4-record', 'telling-5-references', 'telling-6-voice'];
const c = await chrome();
let bad = 0;
try {
  for (const f of FILES) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      c.errors.length = 0;
      await c.visit(`http://127.0.0.1:8794/studies/iterations/43/${f}.html`, w, h);
      await c.evaluate(`Promise.all([...document.images].map(i => (i.loading = 'eager', i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))))`);
      await sleep(400);
      const s = await c.evaluate(`({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src), web: document.querySelectorAll('#web g.node').length, over: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('.scroll,.vg'); }).map(e => e.tagName + '.' + e.className).slice(0, 4) })`);
      const probs = [...c.errors, ...s.broken.map(b => 'broken image ' + b), ...(s.w > w ? ['page is ' + s.w + 'px wide: ' + s.over.join(', ')] : [])];
      if (f.includes('web') && !s.web) probs.push('the web drew no nodes');
      if (probs.length) bad++;
      console.log(f, w + 'px', s.h + 'px tall', probs.length ? 'PROBLEMS: ' + probs.join(' | ') : 'ok' + (s.web ? ', ' + s.web + ' nodes' : ''));
      if (w === 1440) {
        const y = await c.evaluate(`Math.round(document.querySelector('.borrow').getBoundingClientRect().top + scrollY)`);
        await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: Math.min(s.h, y + 1400), deviceScaleFactor: 1, mobile: false });
        await sleep(300);
        const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y, width: w, height: Math.min(1400, s.h - y), scale: 1 } });
        fs.writeFileSync(path.join(here, 'img', f + '.png'), Buffer.from(data, 'base64'));
      }
    }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
