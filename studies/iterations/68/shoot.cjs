// Pictures first: three case study wireframes in headless Chrome. Server up.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/68/case-' + n + '.html';
const shot = f => path.join(__dirname, 'shots', f);
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => { if (!/fonts/.test(r.url())) errs.push('failed ' + r.url()); });
  const wide = { width: 1440, height: 900 }, phone = { width: 390, height: 844, isMobile: true, hasTouch: true };
  const go = async (n, v) => { await p.setViewport(v); await p.goto(U(n), { waitUntil: 'networkidle0', timeout: 60000 }); await sleep(300); };
  const to = async f => { await p.evaluate(f => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f); await sleep(500); };
  const fits = async n => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); say(w[0] <= 390 && w[1] <= 390, n + ' phone: no sideways scroll (' + w.join(' at ') + ')'); };

  // Pull back: stops, scrolled to where each shot lands
  await go('pull', wide);
  say(Math.abs((await p.evaluate(() => window.__labelAspect)) - 1891 / 2764) < .001, 'pull: the label is at its own proportions');
  const stops = [0, .14, .25, .42, .6, 1];
  for (let i = 0; i < stops.length; i++) { await to(stops[i] * .9); await p.screenshot({ path: shot('pull-' + i + '.png') }); }
  await go('pull', phone); await fits('pull'); await to(0); await p.screenshot({ path: shot('pull-phone-0.png') }); await to(.5); await p.screenshot({ path: shot('pull-phone-1.png') });

  // The label is the page
  await go('frame', wide);
  const f = await p.$eval('#frame', e => { const s = getComputedStyle(e); return [parseFloat(s.borderLeftWidth), parseFloat(s.borderTopWidth)]; });
  say(Math.abs(f[0] / f[1] - 220 / 135) < .02, 'frame: border cut at the label\'s own proportions');
  for (let i = 0; i < 5; i++) { await p.evaluate(i => document.querySelectorAll('section')[i].scrollIntoView({ block: 'center' }), i); await sleep(300); await p.screenshot({ path: shot('frame-' + i + '.png') }); }
  await go('frame', phone); await fits('frame'); await p.screenshot({ path: shot('frame-phone-0.png') }); await p.evaluate(() => document.querySelectorAll('section')[3].scrollIntoView({ block: 'center' })); await sleep(300); await p.screenshot({ path: shot('frame-phone-1.png') });

  // The motifs gather
  await go('gather', wide);
  for (const [i, v] of [0, .3, .62, .78].entries()) { await to(v); await p.screenshot({ path: shot('gather-' + i + '.png') }); }
  await to(1); await p.screenshot({ path: shot('gather-4.png') });
  await go('gather', phone); await fits('gather'); await p.screenshot({ path: shot('gather-phone-0.png') }); await to(.72); await p.screenshot({ path: shot('gather-phone-1.png') });

  say(!errs.length, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await b.close();
  console.log(bad ? bad + ' failure(s)' : 'all three work');
  process.exitCode = bad ? 1 : 0;
})();
