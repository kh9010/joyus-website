// Study 83: each answer to why a Tuesday (?v=a|b|c|d), at 1440 and 390: img/why-<v>-<w>.png, from the
// insight down to the six Tuesdays' first row, so the piece is seen in its place on Study 50's page.
// Reports page errors. Needs the server.   node studies/iterations/83/shoot.mjs [base]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
import build from './build.cjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:8794/studies/iterations/';
const c = await chrome();
let bad = 0;
const save = async (file, clip) => { const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } }); fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64')); console.log(file); };
try {
  for (const v of build.OPTIONS) for (const w of [1440, 390]) {
    c.errors.length = 0;
    await c.visit(base + '83/six.html?v=' + v, w, 900); await sleep(300);
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: 2400, deviceScaleFactor: w < 700 ? 2 : 1, mobile: w < 700 }); await sleep(300);
    const box = await c.evaluate(`(() => { const top = document.querySelector('.insight').getBoundingClientRect().top + scrollY;
      const why = document.querySelector('.why[data-opt="${v}"]').getBoundingClientRect(); return { top: Math.round(top), bottom: Math.round(why.bottom + scrollY + 120) }; })()`);
    await save(`why-${v}-${w}.png`, { x: 0, y: box.top, width: w, height: box.bottom - box.top });
    if (c.errors.length) { bad++; console.log('PROBLEMS', v, w, c.errors.join(' | ')); }
  }
} finally { c.close(); }
process.exitCode = bad ? 1 : 0;
