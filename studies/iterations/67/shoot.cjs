// Pictures first: the trail in headless Chrome (SwiftShader, no GPU). Server up. Also checks what the idea depends on.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = 'http://127.0.0.1:8794/studies/iterations/67/trail.html';
const img = f => path.join(__dirname, 'img', f);
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });
  const open = async (v) => { await p.setViewport(v); await p.goto(U, { waitUntil: 'networkidle2', timeout: 90000 }); await p.waitForFunction(() => window.__ready || window.__failed, { timeout: 200000 }); await sleep(1500); };
  await open({ width: 1440, height: 900 });
  const st = await p.evaluate(() => window.__stones || window.__failed);
  console.log('  stones', JSON.stringify(st));
  say(st.D === st.lines.D, 'D has one stone per line (' + st.D + ' / ' + st.lines.D + ')');
  say(st.K === st.lines.K, 'K has one stone per line (' + st.K + ' / ' + st.lines.K + ')');
  say(st.J === st.lines.D + st.lines.K, 'J has one stone per line (' + st.J + ')');
  await p.screenshot({ path: img('a-letters.png') });
  // a real click on a stone: the middle of D's left stem
  const k0 = await p.evaluate(() => window.__told);
  await p.mouse.click(1440 * .22, 480); await sleep(300);
  console.log('  click on a stone took', (await p.evaluate(() => window.__told)) - k0);
  for (const s of ['K', 'D', 'K']) { await p.click('#pick-' + s); await sleep(500); }
  await sleep(3500);
  await p.evaluate(() => scrollTo(0, 0)); await sleep(1200);
  await p.setViewport({ width: 1440, height: 1500 }); await sleep(2500);
  await p.screenshot({ path: img('b-trail.png') });
  await p.setViewport({ width: 1440, height: 900 }); await sleep(800);
  await p.click('#all');
  await p.waitForFunction(() => window.__gathered, { timeout: 120000 });
  const texts = await p.$$eval('.say', e => e.map(x => x.textContent));
  say(new Set(texts).size === texts.length && texts.length === st.lines.D + st.lines.K, 'everything said, once each (' + texts.length + ')');
  await sleep(9000);
  await p.screenshot({ path: img('c-joyus.png') });
  await open({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.screenshot({ path: img('phone-a.png') });
  for (const s of ['K', 'D']) { await p.tap('#pick-' + s); await sleep(600); }
  await sleep(3000); await p.screenshot({ path: img('phone-b.png') });
  const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  say(w[0] <= 390 && w[1] <= 390, 'phone: no sideways scroll (' + w.join(' at ') + ')');
  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0].slice(0, 200) : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'the trail works');
  process.exitCode = bad ? 1 : 0;
})();
