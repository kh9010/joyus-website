// Drives both forms in headless Chrome (software GL, no GPU): picks in a chosen order, checks the story follows it. Server up.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/61/about-' + n + '.html';
const img = f => path.join(__dirname, 'img', f);
const W = JSON.parse(fs.readFileSync(path.join(__dirname, '../59/words.json'), 'utf8'));
const D = W.D.flatMap(p => p.split(/(?<=\.)\s+(?=[A-Z])/));
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const m of ['letters', 'carved']) {
    await p.setViewport({ width: 1440, height: 900 });
    await p.goto(U(m), { waitUntil: 'load' });
    await p.waitForFunction(() => window.__ready || window.__failed, { timeout: 150000 });
    const failed = await p.evaluate(() => window.__failed);
    say(!failed, m + ': built' + (failed ? ': ' + failed : ' ' + JSON.stringify(await p.evaluate(() => window.__stones))));
    if (failed) continue;
    await sleep(1200); await p.screenshot({ path: img(m + '-a.png') });
    const order = ['K', 'D', 'K', 'K', 'D'];
    for (const s of order) await p.click('#pick-' + s.toLowerCase());
    await sleep(2300); await p.screenshot({ path: img(m + '-b.png') });
    const got = await p.$$eval('#log article', e => e.map(a => [a.dataset.who, a.querySelector('p').textContent]));
    say(got.map(g => g[0]).join('') === order.join(''), m + ': the story follows the picks: ' + got.map(g => g[0]).join(''));
    say(got[1][1] === D[0] && got[0][1] === W.K[0] && got[2][1] === W.K[1], m + ': each person speaks in their own order');
    // a real click on the canvas: on the D's side, then the K's
    const box = await (await p.$('#gl')).boundingBox();
    const before = await p.$$eval('#log article', e => e.length);
    let landed = 0;
    for (const x of [.27, .73]) { const n0 = await p.$$eval('#log article', e => e.length); for (const [fx, fy] of [[x, .5], [x - .05, .4], [x + .05, .6], [x, .32], [x, .66]]) { await p.mouse.click(box.x + box.width * fx, box.y + box.height * fy); if ((await p.$$eval('#log article', e => e.length)) > n0) { landed++; break; } } }
    say(landed === 2, m + ': clicking the stones themselves works, on both sides');
    await p.evaluate(() => { for (let i = 0; i < 40; i++) { window.__pick('D'); window.__pick('K'); } }); await sleep(300);
    const texts = await p.$$eval('#log p', e => e.map(x => x.textContent));
    say(new Set(texts).size === texts.length && texts.length === D.length + W.K.length + 1 + W.Y.length, m + ': everything can be told, once each (' + texts.length + ')');
    say(await p.$eval('#pick-d', e => e.disabled) && await p.$eval('#pick-k', e => e.disabled), m + ': when a person is all told, their button says so');
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await p.goto(U(m), { waitUntil: 'load' });
    await p.waitForFunction(() => window.__ready || window.__failed, { timeout: 150000 });
    const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    say(w[0] <= 390 && w[1] <= 390, m + ' phone: no sideways scroll (' + w.join(' at ') + ')');
    await sleep(800); await p.tap('#pick-d'); await sleep(500); await p.screenshot({ path: img(m + '-phone.png') });
  }
  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'both work');
  process.exitCode = bad ? 1 : 0;
})();
