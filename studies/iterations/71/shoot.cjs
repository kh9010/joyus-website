// Pictures first: the two pages at their beats, wide and on a phone. Server up. One headless Chrome.
const path = require('node:path');
const puppeteer = require(path.resolve(__dirname, '../../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const U = n => 'http://127.0.0.1:8794/studies/iterations/71/' + n + '.html';
const BEATS = {
  packaging: [['q1', .03], ['q2', .15], ['table', .27], ['gather', .39], ['ring', .445], ['label', .52], ['bottle', .66], ['row', .8], ['all', .97]],
  branding: [['q', .05], ['sketches', .25], ['gather', .37], ['s', .46], ['five', .57], ['flood', .7], ['lid', .78], ['leave', .815], ['pull', .88], ['box', .97]]
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('node:fs');
const report = { squished: [], wide: {} };
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const only = process.argv[2];
  for (const [vp, tag] of [[{ width: 1440, height: 900 }, ''], [{ width: 390, height: 844, isMobile: true, hasTouch: true }, 'phone-']]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.setViewport(vp);
    for (const page of Object.keys(BEATS)) {
      if (only && only !== page) continue;
      await p.goto(U(page), { waitUntil: 'networkidle0' });
      await sleep(300);
      for (const [name, at] of BEATS[page]) {
        await p.evaluate(a => { const r = document.getElementById('run'); scrollTo(0, a * (r.offsetHeight - innerHeight)); }, at);
        await sleep(260);
        await p.screenshot({ path: path.join(__dirname, 'shots', tag + page + '-' + name + '.png') });
        // the sanctity of the label: drawn proportion against the file's own, at every beat
        const off = await p.$$eval('#label,.lb', es => es.filter(e => e.style.visibility !== 'hidden').map(e => [e.id, Math.abs((parseFloat(e.style.width) / parseFloat(e.style.height)) / (e.naturalWidth / e.naturalHeight) - 1)]).filter(a => a[1] > .01));
        off.forEach(o => report.squished.push([tag + page, name, o[0], o[1]]));
      }
      const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await sleep(300);
      await p.screenshot({ path: path.join(__dirname, 'shots', tag + page + '-end.png') });
      const broken = await p.$$eval('img', i => i.filter(x => !x.naturalWidth).map(x => x.src));
      report.wide[tag + page] = { width: w, broken: broken.length, errors: errs.length };
      console.log(tag + page, 'width', w, 'broken', broken.length, 'errors', errs.length, errs[0] || '');
    }
    await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 1));
})().catch(e => { console.error(e.message); process.exit(1); });
