// Study 117: the pictures, and what the check reads. Needs the studies server on 8794. One headless Chrome at a time.
//   node studies/iterations/117/shoot.mjs      the page in each view and caught mid-move, wide and phone -> shots/, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL_ = 'http://127.0.0.1:8794/studies/iterations/117/site.html';
const settle = async (c) => { for (let i = 0; i < 80; i++) { if (!(await c.evaluate('!!window.__moving'))) return; await sleep(100); } };
const hash = (h) => `(location.hash = ${JSON.stringify(h)}, 1)`;
const c = await chrome();
try {
  const report = { at: new Date().toISOString(), views: {} };
  for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone']]) {
    await c.visit(URL_, w, h);
    await c.waitFor('window.__ready', 30000);
    await c.evaluate('clearInterval(0), 1');
    const beats = {};
    const take = async (name) => { await sleep(350); await c.shot(path.join(here, 'shots', `${tag}-${name}.png`)); beats[name] = await c.evaluate('window.__measure()'); };
    await take('j1');
    await c.evaluate('window.__j(1), 1'); await sleep(tag === 'wide' ? 700 : 700); beats.between = await c.evaluate('window.__measure()'); await c.shot(path.join(here, 'shots', `${tag}-between.png`));
    await settle(c); await take('j2');
    await c.evaluate(hash('work')); await sleep(650); await c.shot(path.join(here, 'shots', `${tag}-leaving.png`)); beats.leaving = await c.evaluate('window.__measure()');
    await settle(c); await take('work');
    await c.evaluate(hash('type/Strategy')); await settle(c); await take('strategy');
    await c.evaluate(hash('client/klydo')); await settle(c); await take('klydo');
    await c.evaluate(hash('client/tomboyx')); await settle(c); await take('tomboyx');
    await c.evaluate(hash('client/armoire')); await settle(c); await take('armoire');
    await c.evaluate(hash('')); await settle(c); await take('back');
    report.views[tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
    console.log(tag, 'errors', c.errors.length, c.errors[0] || '');
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
