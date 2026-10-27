// Study 42: the pictures. Two kinds:
//   --sources  the EWC brand guide's slides (from ~/dev/ewc, Kahran's machine)
//              and eastwestclub.com, into img/ for the pages to use
//   (default)  the two wireframes, wide and on a phone, for index.html
// Needs the server for the wireframes. One headless Chrome at a time.
//   node studies/iterations/42/shoot.mjs --sources
//   node studies/iterations/42/shoot.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => path.join(here, 'img', f);
const c = await chrome();
try {
  if (process.argv.includes('--sources')) {
    const guide = pathToFileURL(path.join(os.homedir(), 'dev/ewc/src/brand-guide.html')).href;
    // slide index by aria-label; the deck scrolls sideways one viewport per slide
    for (const [label, file] of [["Who it's for — detail, first three", 'guide-audience.png'], ['Colour palette', 'guide-palette.png']]) {
      await c.visit(guide, 1440, 900); await sleep(800);
      await c.evaluate(`(() => { const d = document.getElementById('deck'); const s = [...d.querySelectorAll('.slide')]; const i = s.findIndex(x => x.getAttribute('aria-label') === ${JSON.stringify(label)}); if (i < 0) throw new Error('no slide ' + ${JSON.stringify(label)}); d.style.scrollBehavior = 'auto'; d.style.scrollSnapType = 'none'; d.blur(); d.style.outline = 'none'; s[i].scrollIntoView({ inline: 'start', block: 'nearest' }); s[i].querySelectorAll('.reveal').forEach(r => r.classList.add('is-in', 'in', 'visible')); })()`);
      await sleep(1500); await c.shot(img(file)); console.log(file);
    }
    await c.visit('https://eastwestclub.com/', 1440, 900); await sleep(3000);
    await c.shot(img('site-home.png')); console.log('site-home.png');
  } else {
    for (const f of ['piece-a-rounds', 'piece-b-strategy']) {
      for (const [w, h, sfx] of [[1440, 900, ''], [390, 844, '-phone']]) {
        await c.visit(`http://127.0.0.1:8794/studies/iterations/42/${f}.html`, w, h);
        await c.evaluate(`Promise.all([...document.images].map(i => (i.loading = 'eager', i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))))`);
        await sleep(400);
        const size = await c.evaluate(`({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, over: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.tagName + '.' + e.className).slice(0, 5) })`);
        await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: size.h, deviceScaleFactor: 1, mobile: w < 700 });
        await sleep(300); await c.shot(img(f + sfx + '.png'));
        console.log(f + sfx, w + '×' + size.h, 'page width ' + size.w, size.over.length ? 'past the edge: ' + size.over.join(', ') : 'nothing past the edge');
      }
    }
  }
  if (c.errors.length) console.log('page errors:', c.errors.slice(0, 5));
} finally { c.close(); }
