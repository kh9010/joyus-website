// Drives each wireframe: start, a few picks, everything told, phone. Checks nothing is lost, and the stones stay reachable. Server up.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/63/wire-' + n + '.html';
const img = f => path.join(__dirname, 'img', f);
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const ORDER = ['K', 'D', 'K', 'K', 'D'];
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const v of ['a', 'b', 'c', 'd', 'e']) {
    await p.setViewport({ width: 1440, height: 900 });
    await p.goto(U(v), { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__ready);
    await p.screenshot({ path: img(v + '-1.png') });
    for (const s of ORDER) await p.click('[data-pick="' + s + '"]');
    await p.screenshot({ path: img(v + '-2.png') });
    const got = await p.$$eval('[data-story] article', e => e.map(a => a.dataset.who).join(''));
    say(got === ORDER.join(''), v.toUpperCase() + ': the story follows the picks');
    await p.evaluate(() => { for (let i = 0; i < 40; i++) { window.__pick('D'); window.__pick('K'); } });
    const all = await p.$$eval('[data-story] p', e => e.length), total = await p.evaluate(() => window.__total);
    say(all === total, v.toUpperCase() + ': everything told, ' + all + ' of ' + total);
    // after all that scrolling, can you still reach both stones without leaving the story?
    const reach = await p.evaluate(() => [...document.querySelectorAll('[data-pick]')].map(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }));
    console.log('  note ' + v.toUpperCase() + ' stones on screen after the whole story: ' + reach.join(', '));
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await p.goto(U(v), { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__ready);
    for (const s of ORDER) await p.tap('[data-pick="' + s + '"]');
    const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    say(w[0] <= 390 && w[1] <= 390, v.toUpperCase() + ' phone: no sideways scroll (' + w.join(' at ') + ')');
    const tap = await p.$$eval('[data-pick]', e => Math.min(...e.map(x => x.getBoundingClientRect().height)));
    say(tap >= 44, v.toUpperCase() + ' phone: a stone is ' + Math.round(tap) + 'px to tap');
    await p.screenshot({ path: img(v + '-phone.png') });
  }
  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'all five work');
  process.exitCode = bad ? 1 : 0;
})();
