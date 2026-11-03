// Pictures first: what a visitor sees in the first screen, live and on the Study 13 one page. Server up.
const path = require('node:path');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const first = async (url, file, wait) => {
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
    await sleep(wait);
    await p.screenshot({ path: path.join(__dirname, 'shots', file) });
    const words = await p.evaluate(() => {
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const t = w.currentNode.textContent.trim(); if (!t) continue;
        const e = w.currentNode.parentElement; const s = getComputedStyle(e); const r = e.getBoundingClientRect();
        if (s.display !== 'none' && s.visibility !== 'hidden' && r.top < innerHeight && r.bottom > 0 && r.width && !['SCRIPT','STYLE'].includes(e.tagName)) out.push(t);
      }
      return out.join(' | ');
    });
    console.log(file + ': ' + words);
  };
  await first('http://127.0.0.1:8794/studies/iterations/13/onepager.html', 'first-13.png', 1500);
  await first('https://joyus.studio/', 'first-live.png', 20000);
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
