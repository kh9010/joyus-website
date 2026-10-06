// Study 18's page test: drives coming-soon.html once per look in headless
// Chrome (SwiftShader: CPU, not the GPU) with the same checks as Study 16,
// screenshots each (img/page-<look>.png), and writes page-report.json,
// which check.cjs reads; the report carries a hash of the page, the looks
// and the mesh, so a stale report fails. Needs the studies server.
//   node studies/iterations/18/page-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/18/coming-soon.html';
export const LOOKS = ['plain', 'candy', 'studio', 'sugared', 'gummy', 'toon', 'print', 'painted', 'frosted'];
const report = { tests: [] };
const test = (name, pass, detail) => { report.tests.push({ name, pass: !!pass, detail }); console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail !== undefined ? '  (' + detail + ')' : '')); };
const STATE = `(() => { const T = window.__cs; return { look: T.look, assembled: T.assembled,
  away: T.pieces.map(P => P.m.position.distanceTo(P.home)), turn: [T.pivot.rotation.x, T.pivot.rotation.y],
  spread: T.pieces.map(P => P.off.length()), bg: getComputedStyle(document.body).backgroundColor }; })()`;
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
const c = await chrome();
try {
  for (const look of LOOKS) {
    c.errors.length = 0;
    await c.visit(URL + '?look=' + look, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    await c.waitFor('window.__cs.assembled', 60000);
    await sleep(300);
    const home = await c.evaluate(STATE);
    await c.shot(path.join(here, 'img', 'page-' + look + '.png'));
    await move(c, 1300, 120); await sleep(1500);
    const moved = await c.evaluate(STATE);
    /* wait for it to settle, up to 6 s: the page caps each frame's time step, so on a slow
       renderer (SwiftShader, busy CPU) the heavy looks settle later in wall-clock time.
       A fixed 2 s failed Frosted at 0.0102 on 6 Oct with the machine busy. */
    await move(c, 720, 450);
    const t0 = Date.now();
    /* settled = under the limit for 5 readings in a row (1 s): a spring swings back through
       zero while still moving, and a first try stopped at the first low reading */
    for (let calm = 0; calm < 5 && Date.now() - t0 < 6000; await sleep(200)) calm = Math.max(...(await c.evaluate(STATE)).spread) < 0.01 ? calm + 1 : 0;
    const settleS = ((Date.now() - t0) / 1000).toFixed(1);
    const back = await c.evaluate(STATE);
    const sp = moved.spread, min = Math.min(...sp), max = Math.max(...sp);
    test(`${look}: loads that look`, home.look === look, home.look);
    test(`${look}: pieces come together`, Math.max(...home.away) < 0.005, Math.max(...home.away).toFixed(4));
    test(`${look}: the J leans and pieces drift apart`, moved.turn[1] > 0.2 && min > 0.02 && max / min > 1.5, `turn ${moved.turn[1].toFixed(2)}, drift ${min.toFixed(3)}–${max.toFixed(3)}`);
    test(`${look}: settles back`, Math.max(...back.spread) < 0.01, Math.max(...back.spread).toFixed(4) + ' after ' + settleS + ' s');
    test(`${look}: white page`, home.bg === 'rgb(255, 255, 255)', home.bg);
    test(`${look}: no JavaScript errors`, c.errors.length === 0, c.errors.join(' / ') || 'none');
  }
  // phone + reduced motion, on the default look
  await c.visit(URL, 390, 844);
  await c.waitFor('window.__cs && window.__cs.assembled', 120000); await sleep(300);
  await c.shot(path.join(here, 'img', 'page-phone.png'));
  const phone = await c.evaluate(`({ over: document.documentElement.scrollWidth - innerWidth, last: document.querySelector('.links li:last-child a').getBoundingClientRect().bottom, h: innerHeight })`);
  test('phone: no sideways scroll, links on the first screen', phone.over <= 0 && phone.last <= phone.h, `overflow ${phone.over}, last link ${Math.round(phone.last)} of ${phone.h}`);
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.visit(URL, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(200);
  const rm = await c.evaluate(STATE);
  test('reduced motion: assembled from the first frame', rm.assembled && Math.max(...rm.away) < 0.005);
} catch (e) { test('run finished', false, e.message); }
finally { c.close(); }
report.hash = hashInputs();
report.when = new Date().toISOString();
fs.writeFileSync(path.join(here, 'page-report.json'), JSON.stringify(report, null, 1));
const failed = report.tests.filter(t => !t.pass).length;
console.log(failed ? failed + ' failed' : 'all passed (' + report.tests.length + ')');
process.exitCode = failed ? 1 : 0;

export function hashInputs() {
  const h = crypto.createHash('sha256');
  for (const f of ['coming-soon.html', 'mesh/p100-ao.json', ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
  return h.digest('hex');
}
