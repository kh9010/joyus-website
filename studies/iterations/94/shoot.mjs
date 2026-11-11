// Study 94: the pictures. Needs the studies server on 8794. One headless Chrome at a time (SwiftShader, no GPU).
//   node studies/iterations/94/shoot.mjs --stones [seed]   the six stones cut from one whole -> img/s<i>-grey.png, s<i>-col.png, stones.json, img/whole*.png
//   node studies/iterations/94/shoot.mjs                   the page at its beats, wide and phone -> shots/, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8794/studies/iterations/94/';
const save = (f, url) => fs.writeFileSync(path.join(here, f), Buffer.from(url.split(',')[1], 'base64'));
const BEATS = [['question', .02], ['one', .16], ['parting', .37], ['six', .4], ['first', .5], ['third', .64], ['all', .97]];
const c = await chrome();
try {
  if (process.argv.includes('--stones')) {
    const seed = process.argv[process.argv.indexOf('--stones') + 1];
    await c.visit(BASE + 'stones.html' + (seed ? '?seed=' + seed : ''), 900, 900);
    await c.waitFor('window.__stones', 180000);
    const s = await c.evaluate('window.__stones');
    s.stones.forEach((st, i) => { save(`img/s${i + 1}-grey.png`, st.grey); save(`img/s${i + 1}-col.png`, st.col); });
    save('img/whole.png', s.whole); save('img/whole-grey.png', s.wholeGrey);
    fs.writeFileSync(path.join(here, 'stones.json'), JSON.stringify({ seed: s.seed, frame: s.frame, grey: s.grey, stones: s.stones.map(st => ({ colour: st.colour, box: st.box.map(v => +v.toFixed(5)), px: st.px, same: st.same })) }, null, 1));
    console.log('stones:', s.stones.length, s.stones.map(st => st.colour + (st.same ? '' : ' (grey box differs)')).join(' '));
  } else {
    const report = { at: new Date().toISOString(), views: {} };
    for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone']]) {
      await c.visit(BASE + 'case.html', w, h);
      await c.waitFor('window.__ready', 30000);
      await c.evaluate('document.fonts.ready.then(() => 1)');
      const beats = {};
      for (const [name, at] of BEATS) {
        await c.evaluate(`(() => { const r = document.getElementById('run'); scrollTo(0, ${at} * (r.offsetHeight - innerHeight)); return 1 })()`);
        await sleep(350);
        await c.shot(path.join(here, 'shots', `${tag}-${name}.png`));
        beats[name] = await c.evaluate('window.__measure()');
      }
      await c.evaluate('scrollTo(0, document.body.scrollHeight), 1'); await sleep(350);
      await c.shot(path.join(here, 'shots', `${tag}-end.png`));
      report.views[tag] = { beats, scrollWidth: await c.evaluate('document.documentElement.scrollWidth'), innerWidth: w, errors: c.errors.slice() };
      console.log(tag, 'errors', c.errors.length, c.errors[0] || '');
    }
    fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
  }
} finally { c.close(); }
