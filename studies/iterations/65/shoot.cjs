// Drives the three fused ideas in headless Chrome, checks the words are all there, takes pictures. Server up.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/65/about-' + n + '.html';
const img = f => path.join(__dirname, 'img', f);
const W = JSON.parse(fs.readFileSync(path.join(__dirname, '../59/words.json'), 'utf8'));
const TOTAL = W.D.flatMap(p => p.split(/(?<=\.)\s+(?=[A-Z])/)).length + W.K.length + 1 + W.Y.length;
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const wide = () => p.setViewport({ width: 1440, height: 900 });
  const phone = () => p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const ready = () => p.waitForFunction(() => window.__ready, { timeout: 90000 });
  const fits = async n => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); say(w[0] <= 390 && w[1] <= 390, n + ' phone: no sideways scroll (' + w.join(' at ') + ')'); };

  // the wall
  await wide(); await p.goto(U('wall'), { waitUntil: 'networkidle0' }); await ready(); await sleep(300);
  await p.screenshot({ path: img('wall-a.png') });
  const n0 = await p.evaluate(() => window.__stones);
  say(n0 > 100, 'wall: ' + n0 + ' stones');
  // a real sweep with the pointer, down the left and across
  await p.mouse.move(180, 150); for (let i = 0; i < 26; i++) await p.mouse.move(180 + (i % 2) * 350, 150 + i * 16);
  await sleep(1400); await p.screenshot({ path: img('wall-b.png') });
  const n1 = await p.evaluate(() => window.__left);
  say(n1 < n0, 'wall: moving across knocks stones away (' + (n0 - n1) + ')');
  await p.evaluate(() => document.getElementById('all').click()); await sleep(1600);
  say((await p.evaluate(() => window.__left)) === 0, 'wall: it can all be cleared, and the words are there');
  { const kt = await p.$eval('#k', e => e.textContent), dt = await p.$eval('#d', e => e.textContent); say(W.K.every(t => kt.includes(t)) && W.D.every(t => dt.includes(t)), 'wall: both Abouts whole behind it'); }
  await p.screenshot({ path: img('wall-c.png') });
  await phone(); await p.goto(U('wall'), { waitUntil: 'networkidle0' }); await ready(); await fits('wall'); await sleep(200); await p.screenshot({ path: img('wall-phone.png') });

  // the cairn
  await wide(); await p.goto(U('cairn'), { waitUntil: 'networkidle0' }); await ready();
  await p.screenshot({ path: img('cairn-a.png') });
  for (const s of ['K', 'D', 'K', 'K', 'D', 'D', 'K']) await p.click('#pick-' + s);
  await sleep(1000); await p.screenshot({ path: img('cairn-b.png'), fullPage: true });
  say((await p.$$eval('.stone', e => e.map(x => x.dataset.who).join(''))) === 'KDKKDDK', 'cairn: the pile follows the picks');
  await p.evaluate(() => { for (let i = 0; i < 40; i++) { window.__pick('D'); window.__pick('K'); } });
  const texts = await p.$$eval('.stone', e => e.map(x => x.textContent));
  say(texts.length === TOTAL && new Set(texts).size === TOTAL, 'cairn: everything said, once each (' + texts.length + ')');
  await phone(); await p.goto(U('cairn'), { waitUntil: 'networkidle0' }); await ready(); for (const s of ['K', 'D', 'K']) await p.tap('#pick-' + s); await sleep(800); await fits('cairn'); await p.screenshot({ path: img('cairn-phone.png') });

  // the trail
  await wide(); await p.goto(U('trail'), { waitUntil: 'networkidle0' }); await ready();
  await p.screenshot({ path: img('trail-a.png') });
  for (const s of ['K', 'D', 'K', 'D']) { await p.click('#pick-' + s); await sleep(200); }
  await sleep(1100); await p.screenshot({ path: img('trail-b.png'), fullPage: true });
  say((await p.$$eval('.step', e => e.map(x => x.dataset.who).join(''))) === 'KDKD', 'trail: the stones land in the order picked');
  await p.mouse.click(1440 * .28, 240); await sleep(100);
  say((await p.evaluate(() => window.__told)) === 5, 'trail: clicking a stone takes that stone');
  await p.evaluate(() => { for (let i = 0; i < 40; i++) { window.__pick('D'); window.__pick('K'); } });
  const tt = await p.$$eval('.step .say', e => e.length);
  console.log('  note trail: letters run out of stones before words if D or K holds fewer: ' + tt + ' of ' + TOTAL);
  say(tt === TOTAL, 'trail: everything said');
  await phone(); await p.goto(U('trail'), { waitUntil: 'networkidle0' }); await ready(); for (const s of ['K', 'D']) { await p.tap('#pick-' + s); } await sleep(900); await fits('trail'); await p.screenshot({ path: img('trail-phone.png') });

  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'all three work');
  process.exitCode = bad ? 1 : 0;
})();
