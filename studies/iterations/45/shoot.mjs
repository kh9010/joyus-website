// Study 45: the five fusions, wide (1400px from the body down, for index.html) and on a
// phone (checked for anything past the edge, not kept). Reports page errors,
// so this is also the "all six render" check. The wide shot starts at the body
// (the head is the same on all five). Needs the server.
//   node studies/iterations/45/shoot.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const FILES = ['fuse-1-tuesday', 'fuse-2-instead', 'fuse-3-map', 'fuse-4-cast', 'fuse-5-verbs'];
const c = await chrome();
let bad = 0;
try {
  for (const f of FILES) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      c.errors.length = 0;
      await c.visit(`http://127.0.0.1:8794/studies/iterations/45/${f}.html`, w, h);
      await c.evaluate(`Promise.all([...document.images].map(i => (i.loading = 'eager', i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))))`);
      await sleep(400);
      const s = await c.evaluate(`({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src), web: document.querySelectorAll('#map .member').length, over: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('.scroll,.vg'); }).map(e => e.tagName + '.' + e.className).slice(0, 4) })`);
      const probs = [...c.errors, ...s.broken.map(b => 'broken image ' + b), ...(s.w > w ? ['page is ' + s.w + 'px wide: ' + s.over.join(', ')] : [])];
      if (f === 'fuse-3-map' && s.web !== 6) probs.push('the map has ' + s.web + ' members, not 6');
      if (probs.length) bad++;
      console.log(f, w + 'px', s.h + 'px tall', probs.length ? 'PROBLEMS: ' + probs.join(' | ') : 'ok' + (s.web ? ', ' + s.web + ' members' : ''));
      if (w === 1440) {
        // the map's picture is its last step, when every layer is on
        await c.evaluate(`document.getElementById('map') && document.querySelectorAll('.steps li')[6].querySelector('button').click()`);
        await sleep(700);
        const y = await c.evaluate(`Math.round(document.querySelector('.insight').getBoundingClientRect().top + scrollY)`);
        await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: Math.min(s.h, y + 1400), deviceScaleFactor: 1, mobile: false });
        await sleep(300);
        const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y, width: w, height: Math.min(1400, s.h - y), scale: 1 } });
        fs.writeFileSync(path.join(here, 'img', f + '.png'), Buffer.from(data, 'base64'));
      }
    }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
