// Study 119: the pictures, and what the check reads. Needs the studies server on 8794. One headless Chrome at a time.
//   node studies/iterations/119/shoot.mjs      every element at rest and after it is used, wide and phone -> shots/, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL_ = 'http://127.0.0.1:8794/studies/iterations/119/ui.html';
const c = await chrome();
const rest = async () => { await sleep(120); for (let i = 0; i < 80; i++) { if (await c.evaluate('window.__rest()')) break; await sleep(80); } await sleep(260); };
try {
  const report = { at: new Date().toISOString(), views: {} };
  for (const [w, h, tag] of [[1100, 900, 'wide'], [390, 844, 'phone']]) {
    await c.visit(URL_, w, h); await c.waitFor('window.__ready', 30000); await rest();
    const m = () => c.evaluate('window.__m()'), act = (s) => c.evaluate('(window.__act.' + s + ', 1)');
    const shot = async (id, name) => {
      const r = await c.evaluate(`(() => { const s = document.getElementById('${id}').closest('section').getBoundingClientRect(); return [s.left, s.top + scrollY, s.width, s.height]; })()`);
      const { data } = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: Math.max(0, r[0] - 10), y: r[1] - 10, width: r[2] + 20, height: r[3] + 20, scale: tag === 'wide' ? 1.5 : 2 } });
      fs.writeFileSync(path.join(here, 'shots', `${tag}-${name}.png`), Buffer.from(data, 'base64'));
    };
    const s = {}; s.rest = await m();
    for (const id of ['buttons', 'tabs', 'chips', 'menu', 'list', 'form', 'pile']) await shot(id, id + '-1');
    await act(`hover('buttons', 'work')`); await rest(); s.hover = await m(); await shot('buttons', 'buttons-2'); await act(`hover('buttons', null)`);
    await act(`click('tabs', 'Podcast')`); await rest(); s.tab = await m(); await shot('tabs', 'tabs-2');
    await act(`click('chips', 'Branding')`); await rest(); s.chip = await m(); await shot('chips', 'chips-2');
    await act(`click('chips', 'Strategy')`); await rest(); s.unchip = await m();
    await act(`click('menu', 'menu')`); await sleep(160); s.menuMid = await m(); await rest(); s.menuOpen = await m(); await shot('menu', 'menu-2');
    await act(`click('menu', 'menu')`); await rest(); s.menuClosed = await m();
    await act(`click('list', 'klydo')`); await rest(); s.listOpen = await m(); await shot('list', 'list-2');
    await act(`click('list', 'tomboyx')`); await rest(); s.listOther = await m(); await shot('list', 'list-3');
    await act(`type('name', 'Divya')`); await rest(); s.typing = await m(); await shot('form', 'form-2');
    await act(`type('email', 'someone@example.com')`); await act(`type('about', 'A brand')`); await act('blur()'); await rest(); s.filled = await m(); await shot('form', 'form-3');
    await act('add()'); await sleep(140); s.arriving = await m(); await rest(); await act('add()'); await rest(); s.added = await m(); await shot('pile', 'pile-2');
    await act(`click('pile', 'p1')`); await sleep(900); await rest(); s.removed = await m(); await shot('pile', 'pile-3');
    report.views[tag] = { ...s, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
    console.log(tag, 'errors', c.errors.length, c.errors[0] || '');
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
