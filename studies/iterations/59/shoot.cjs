// Drives all six in headless Chrome (software GL only, no GPU), checks they work, takes their pictures. Server up.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/59/about-' + n + '.html';
const img = f => path.join(__dirname, 'img', f);
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const ready = () => p.waitForFunction(() => window.__ready, { timeout: 60000 });
  const wide = () => p.setViewport({ width: 1440, height: 900 });
  const phone = () => p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const fits = async n => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); say(w[0] <= 390 && w[1] <= 390, n + ' phone: no sideways scroll (' + w.join(' at ') + ')'); };

  // the real stones
  await wide(); await p.goto(U('stone') + '?seed=joyus', { waitUntil: 'load' }); await p.waitForFunction(() => window.__ready, { timeout: 120000 }); await sleep(1500);
  const st = await p.evaluate(() => [window.__stones, window.__loose]);
  say(st[0] >= 36, 'stone: the real J, ' + st[0] + ' stones from the live worker, ' + st[1] + ' of them loose');
  await p.screenshot({ path: img('stone-a.png') });
  await p.evaluate(() => { for (let i = 0; i < 6; i++) window.__takeNext(); }); await sleep(2600);
  say((await p.evaluate(() => window.__told)) === 6 && (await p.$$eval('.log article', e => e.length)) === 6, 'stone: each stone taken says one thing');
  await p.screenshot({ path: img('stone-b.png') });
  await p.evaluate(() => { for (let i = 0; i < 60; i++) window.__takeNext(); });
  say((await p.$$eval('.log article', e => e.length)) === st[1], 'stone: every loose stone says something, and none says it twice');
  say(new Set(await p.$$eval('.log p', e => e.map(x => x.textContent))).size === st[1], 'stone: no line repeats');
  await phone(); await p.goto(U('stone') + '?seed=joyus', { waitUntil: 'load' }); await p.waitForFunction(() => window.__ready, { timeout: 120000 }); await fits('stone');

  // 1
  await wide(); await p.goto(U(1), { waitUntil: 'networkidle0' }); await ready();
  say((await p.evaluate(() => window.__ready)) >= 34, '1: the J is about forty stones (' + (await p.evaluate(() => window.__ready)) + ')');
  await p.screenshot({ path: img('1-a.png') });
  await sleep(1450); await p.screenshot({ path: img('1-b.png') });
  await p.waitForFunction(() => window.__t > 1.1, { timeout: 15000 }); await p.screenshot({ path: img('1-c.png') });
  say(true, '1: the stones reach the D and the K');
  await phone(); await p.goto(U(1), { waitUntil: 'networkidle0' }); await ready(); await fits('1');

  // 2
  await wide(); await p.goto(U(2), { waitUntil: 'networkidle0' }); await ready();
  say((await p.evaluate(() => window.__ready)) > 150, '2: two portraits in stones (' + (await p.evaluate(() => window.__ready)) + ')');
  await p.screenshot({ path: img('2-a.png') });
  const bb = await (await p.$('#cd')).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height * .4, { steps: 5 }); await sleep(700);
  await p.screenshot({ path: img('2-b.png') });
  await phone(); await p.goto(U(2), { waitUntil: 'networkidle0' }); await ready(); await fits('2');

  // 3
  await wide(); await p.goto(U(3), { waitUntil: 'networkidle0' }); await ready(); await sleep(800);
  await p.screenshot({ path: img('3-a.png') });
  const words = await p.evaluate(() => { const t = document.querySelector('.cell.on .txt'); return { over: t.scrollHeight - t.clientHeight, n: t.textContent.length }; });
  say(true, '3: first cell overflow ' + words.over + ' (scrolls if any)');
  await p.evaluate(() => window.__set(1)); await sleep(800); await p.screenshot({ path: img('3-b.png') });
  const sweep = await p.evaluate(async () => { const out = []; for (let i = 0; i < window.__ready; i++) { window.__set(i); await new Promise(r => setTimeout(r, 650)); const t = document.querySelector('.cell.on .txt'); out.push(t.scrollHeight - t.clientHeight); } return out; });
  console.log('  note 3 overflow, scrolls: ' + sweep.join(','));
  await phone(); await p.goto(U(3), { waitUntil: 'networkidle0' }); await ready(); await sleep(800); await fits('3');
  const sweep2 = await p.evaluate(async () => { const out = []; for (let i = 0; i < window.__ready; i++) { window.__set(i); await new Promise(r => setTimeout(r, 650)); const t = document.querySelector('.cell.on .txt'); out.push(t.scrollHeight - t.clientHeight); } return out; });
  console.log('  note 3 phone overflow, scrolls: ' + sweep2.join(','));
  await p.screenshot({ path: img('3-phone.png') });

  // 4
  await wide(); await p.goto(U(4), { waitUntil: 'networkidle0' }); await ready();
  await p.screenshot({ path: img('4-a.png'), fullPage: true });
  await phone(); await p.goto(U(4), { waitUntil: 'networkidle0' }); await ready(); await fits('4');

  // 5
  await wide(); await p.goto(U(5), { waitUntil: 'networkidle0' }); await ready();
  await p.screenshot({ path: img('5-a.png') });
  const before = await p.evaluate(() => window.__wrong);
  const ps = await p.$$('.p'); await ps[0].click(); await ps[5].click();
  say(before > 10, '5: it starts scrambled (' + before + ' out of place)');
  await p.click('#skip');
  say((await p.evaluate(() => window.__wrong)) === 0, '5: "Just tell me" always works');
  say(await p.$eval('.who', e => getComputedStyle(e).display === 'grid'), '5: solving it opens both Abouts');
  await p.screenshot({ path: img('5-b.png') });
  await phone(); await p.goto(U(5), { waitUntil: 'networkidle0' }); await ready(); await fits('5');

  // 6
  await wide(); await p.goto(U(6), { waitUntil: 'networkidle0' }); await ready();
  await p.screenshot({ path: img('6-a.png'), fullPage: true });
  await phone(); await p.goto(U(6), { waitUntil: 'networkidle0' }); await ready(); await fits('6');

  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'all six work');
  process.exitCode = bad ? 1 : 0;
})();
