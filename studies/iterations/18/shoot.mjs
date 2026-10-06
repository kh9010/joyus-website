// Screenshots lab.html for each look:mesh pair → img/<look>--<mesh>.png
// (900×900 at 2×, headless Chrome on SwiftShader: CPU, not the GPU).
// Records into shots.json: no errors, the J actually drew (non-white pixels),
// and the share of the frame it covers. Needs the studies server.
//   node studies/iterations/18/shoot.mjs plain:a16 plain:a-nrm ...
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const log = path.join(here, 'shots.json');
const shots = fs.existsSync(log) ? JSON.parse(fs.readFileSync(log, 'utf8')) : {};
const c = await chrome();
try {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 900, height: 900, deviceScaleFactor: 2, mobile: false });
  for (const pair of process.argv.slice(2)) {
    const [look, mesh, turn = '0.35'] = pair.split(':');
    const name = `${look}--${mesh}${turn !== '0.35' ? '--t' + turn : ''}`;
    c.errors.length = 0;
    await c.visit(`http://127.0.0.1:8794/studies/iterations/18/lab.html?look=${look}&mesh=${mesh}&turn=${turn}`, 900, 900);
    await c.send('Emulation.setDeviceMetricsOverride', { width: 900, height: 900, deviceScaleFactor: 2, mobile: false });
    await c.waitFor('window.__lab && window.__lab.ready && window.__lab.frames > 3', 240000);
    await sleep(400);
    // how much of the frame is not white: did the J draw at all?
    const ink = await c.evaluate(`(() => { const cv = document.getElementById('gl'), s = document.createElement('canvas'); s.width = 90; s.height = 90; const x = s.getContext('2d'); x.drawImage(cv, 0, 0, 90, 90); const d = x.getImageData(0, 0, 90, 90).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i+1] + d[i+2] < 735) n++; return n / 8100; })()`);
    await c.shot(path.join(here, 'img', name + '.png'));
    shots[name] = { look, mesh, turn: +turn, ink: +ink.toFixed(3), errors: [...c.errors], when: new Date().toISOString() };
    console.log(`${name}: ink ${(ink * 100).toFixed(0)}%${c.errors.length ? '  ERRORS ' + c.errors.join(' / ') : ''}`);
  }
} finally { c.close(); fs.writeFileSync(log, JSON.stringify(shots, null, 1)); }
