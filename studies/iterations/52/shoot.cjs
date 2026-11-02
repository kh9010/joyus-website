// Pictures of the four layouts at 1440 and 390, to img/. Server up. One headless Chrome.
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
(async () => {
  fs.mkdirSync(path.join(__dirname, 'img'), { recursive: true });
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  for (const v of ['a', 'b', 'c', 'd']) for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone']]) {
    await p.setViewport({ width: w, height: h });
    await p.goto('http://127.0.0.1:8794/studies/iterations/52/about-' + v + '.html', { waitUntil: 'networkidle0' });
    await p.screenshot({ path: path.join(__dirname, 'img', v + '-' + tag + '.png'), fullPage: true });
  }
  await b.close();
})();
