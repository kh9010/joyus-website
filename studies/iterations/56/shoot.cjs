// Drives all four About ideas in headless Chrome, checks they work, and takes their pictures. Server up.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/56/about-' + n + '.html';
const img = f => path.join(__dirname, 'img', f);
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const wide = () => p.setViewport({ width: 1440, height: 900 });
  const phone = () => p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const nosideways = async n => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); say(w[0] <= 390 && w[1] <= 390, n + ' phone: no sideways scroll (' + w.join(' at ') + ')'); };

  // A
  await wide(); await p.goto(U('a'), { waitUntil: 'networkidle0' });
  await p.screenshot({ path: img('a-1.png') });
  const box = await (await p.$('#line')).boundingBox();
  await p.mouse.move(box.x + 22, 300); await p.mouse.down(); await p.mouse.move(1150, 300, { steps: 8 }); await p.mouse.up();
  const pa = await p.evaluate(() => window.__p);
  say(pa > 75, 'A: dragging moves the divide (' + Math.round(pa) + '%)');
  await p.screenshot({ path: img('a-2.png') });
  await p.focus('#line'); await p.keyboard.press('ArrowLeft');
  say((await p.evaluate(() => window.__p)) < pa, 'A: arrow keys move it too');
  await phone(); await p.goto(U('a'), { waitUntil: 'networkidle0' }); await nosideways('A');
  await p.screenshot({ path: img('a-phone.png') });

  // B
  await wide(); await p.goto(U('b'), { waitUntil: 'networkidle0' });
  await p.screenshot({ path: img('b-1.png') });
  const n = await p.$$eval('.st', s => s.length);
  await p.evaluate(() => { [3, 9, 14, 20, 6].forEach(i => document.querySelectorAll('.st')[i].click()); });
  await new Promise(r => setTimeout(r, 900));
  say((await p.$$eval('.log p', e => e.length)) === 5 && (await p.$$eval('.st.gone', e => e.length)) === 5, 'B: each stone taken says one thing (' + n + ' stones)');
  await p.screenshot({ path: img('b-2.png') });
  await p.evaluate(() => { document.querySelectorAll('.st:not(.gone)').forEach(s => s.click()); });
  say((await p.$$eval('.log p', e => e.length)) === n, 'B: every stone can be taken');
  await phone(); await p.goto(U('b'), { waitUntil: 'networkidle0' }); await nosideways('B');
  await p.screenshot({ path: img('b-phone.png') });

  // C
  await wide(); await p.goto(U('c'), { waitUntil: 'networkidle0' });
  say((await p.$$eval('#sv path', e => e.length)) === 2, 'C: two lines drawn');
  await p.screenshot({ path: img('c-1.png'), fullPage: true });
  await phone(); await p.goto(U('c'), { waitUntil: 'networkidle0' }); await nosideways('C');
  await p.screenshot({ path: img('c-phone.png') });

  // D
  await wide(); await p.goto(U('d'), { waitUntil: 'networkidle0' });
  await p.screenshot({ path: img('d-1.png') });
  for (const pick of [0, 1, 0, 1]) { const bs = await p.$$('.pair button'); await bs[pick].click(); }
  say((await p.$$eval('.got p', e => e.length)) === 4 && !!(await p.$('#again')), 'D: four choices make an About');
  await p.screenshot({ path: img('d-2.png'), fullPage: true });
  await p.click('#again');
  say((await p.$$eval('.got p', e => e.length)) === 0, 'D: choose again starts over');
  await phone(); await p.goto(U('d'), { waitUntil: 'networkidle0' }); await nosideways('D');
  await p.screenshot({ path: img('d-phone.png') });

  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'all four work');
  process.exitCode = bad ? 1 : 0;
})();
