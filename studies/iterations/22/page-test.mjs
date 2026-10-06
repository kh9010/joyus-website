// Study 22's page test (Study 21's, the site now one sign on a spring stand, in four versions):
// Study 21's page test: Study 20's, minus the font sweep (decided: Unbounded 3D),
// plus the site: the sign and both cones stand on the floor, clear of the fallen stones, in headless Chrome (SwiftShader: CPU, not the GPU).
// Writes page-report.json (read by check.cjs, hashed against the page, the
// builder and the looks) and img/page-*.png. Needs the studies server.
//   node studies/iterations/19/page-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/22/coming-soon.html';
const LOOKS = ['plain', 'sugared', 'gummy', 'toon', 'print'];
const SEED = 'study22';
const report = { tests: [], timing: {} };
const test = (name, pass, detail) => { report.tests.push({ name, pass: !!pass, detail }); console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail !== undefined ? '  (' + detail + ')' : '')); };
const STATE = `(() => { const T = window.__cs; const J = T.pieces.filter(P => !P.fallen);
  const wp = (P) => { const v = P.m.getWorldPosition(new P.m.position.constructor()); return [v.x, v.y, v.z]; };
  return { look: T.look, seed: T.seed, font: T.font, mode: T.mode, variant: T.sign, signStones: T.signStones, assembled: T.assembled, tau: T.tau, end: T.rate.END, buildMs: T.buildMs, sign: !!T.sign,
    jCount: J.length, fallen: T.fallen.length,
    away: J.map(P => P.m.position.distanceTo(P.home)),
    fallenAway: T.fallen.map(P => P.m.position.distanceTo(P.home)),
    fallenBox: T.fallen.map(P => { const box = new (Object.getPrototypeOf(P.m.geometry.boundingBox).constructor)().setFromObject(P.m, true);
      return { low: +box.min.y.toFixed(3), h: +(box.max.y - box.min.y).toFixed(3), w: +Math.max(box.max.x - box.min.x, box.max.z - box.min.z).toFixed(3) }; }),
    layout: J.map(P => [+P.home.x.toFixed(3), +P.home.y.toFixed(3)]).slice(0, 6),
    world: J.map(wp), pivot: [T.pivot.position.x, T.pivot.position.y, T.pivot.rotation.x, T.pivot.rotation.y],
    bg: getComputedStyle(document.body).backgroundColor,
    /* the site: each object's lowest point, and whether any overlaps a fallen stone */
    site: (() => { const B = (o) => new (Object.getPrototypeOf(T.pieces[0].m.geometry.boundingBox).constructor)().setFromObject(o, true);
      const objs = [];
      T.pieces[0].m.parent.parent && null;
      const ground = T.fallen.length ? T.fallen[0].m.parent : null;
      for (const o of ground ? ground.children : []) if (o.type === 'Group') objs.push(B(o));
      const stones = T.fallen.map(P => B(P.m));
      return { n: objs.length, lows: objs.map(b => +b.min.y.toFixed(3)), clash: objs.some(b => stones.some(s => b.intersectsBox(s))) }; })() }; })()`;
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
async function wiggle(c, ms) {                       // keep the pointer moving, like a visitor would
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < ms) { k++; await move(c, 720 + 300 * Math.sin(k / 3), 450 + 160 * Math.cos(k / 4)); await sleep(30); }
}
const c = await chrome();
try {
  // 1. each look, same seed: build, wiggle to assemble, check the scene
  for (const look of LOOKS) {
    c.errors.length = 0;
    await c.visit(`${URL}?look=${look}&seed=${SEED}`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    await wiggle(c, 2500);
    await c.waitFor('window.__cs.assembled', 60000);
    await move(c, 720, 450); await sleep(1800);
    const s = await c.evaluate(STATE);
    await c.shot(path.join(here, 'img', 'page-' + look + '.png'));
    test(`${look}: loads, seed ${SEED}`, s.look === look && s.seed === SEED, s.look + ' ' + s.seed);
    /* since the fix, a stone too small to mesh is dropped, so "about 25" */
    test(`${look}: ${s.jCount + s.fallen} stones: ${s.jCount} in the J, ${s.fallen} on the floor`, s.jCount + s.fallen >= 22 && s.fallen === 2, `${s.font} ${s.mode}, built in ${s.buildMs} ms`);
    test(`${look}: J stones home, fallen stones landed`, Math.max(...s.away) < 0.005 && Math.max(...s.fallenAway) < 0.005);
    test(`${look}: fallen stones rest on the floor`, s.fallenBox.every(b => Math.abs(b.low - (-1.12)) < 0.02), s.fallenBox.map(b => b.low).join(', '));
    /* added after try 1 passed "rests on the floor" with both stones standing up like pillars */
    test(`${look}: and lie down (wider than tall)`, s.fallenBox.every(b => b.w > b.h * 1.3), s.fallenBox.map(b => b.w + ' wide, ' + b.h + ' tall').join(' | '));
    test(`${look}: the sign stands on the floor`, s.site.n === 1 && s.site.lows.every(y => Math.abs(y - (-1.12)) < 0.01), `${s.site.n} object, feet at ${s.site.lows.join(', ')}`);
    test(`${look}: nothing on the floor overlaps a fallen stone`, !s.site.clash);
    test(`${look}: white page, no JavaScript errors`, s.bg === 'rgb(255, 255, 255)' && c.errors.length === 0, c.errors.join(' / ') || s.bg);
  }

  // 2. the build follows the pointer: idle vs moving, same seed
  for (const mode of ['idle', 'moving']) {
    await c.visit(`${URL}?look=plain&seed=${SEED}`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    const t0 = Date.now();
    if (mode === 'moving') { while (!(await c.evaluate('window.__cs.assembled')) && Date.now() - t0 < 30000) await wiggle(c, 200); }
    else await c.waitFor('window.__cs.assembled', 30000);
    report.timing[mode] = (Date.now() - t0) / 1000;
  }
  test('moving the pointer builds it faster', report.timing.moving * 2.5 < report.timing.idle, `idle ${report.timing.idle.toFixed(1)} s, moving ${report.timing.moving.toFixed(1)} s`);
  test('it still finishes with no pointer at all', report.timing.idle < 12, report.timing.idle.toFixed(1) + ' s');

  // 3. the J moves as one: while it follows the pointer, every stone keeps its place in the J
  await move(c, 1350, 120); await sleep(700);
  const a = await c.evaluate(STATE);
  await move(c, 150, 800); await sleep(700);
  const b = await c.evaluate(STATE);
  const local = await c.evaluate(`window.__cs.pieces.filter(P => !P.fallen).map(P => P.m.position.distanceTo(P.home))`);
  const moved = Math.hypot(a.world[0][0] - b.world[0][0], a.world[0][1] - b.world[0][1]);
  test('the J follows the pointer', moved > 0.1 && Math.abs(a.pivot[3] - b.pivot[3]) > 0.3, `moved ${moved.toFixed(2)}, turned ${(a.pivot[3] - b.pivot[3]).toFixed(2)}`);
  test('as one: no stone moves within the J', Math.max(...local) < 1e-6, 'max ' + Math.max(...local).toExponential(1));
  await c.shot(path.join(here, 'img', 'page-pointer.png'));

  // 4. random: two visits with no seed give two different Js
  const js = [];
  for (let k = 0; k < 2; k++) { await c.visit(URL, 1440, 900); await c.waitFor('window.__cs && window.__cs.ready', 120000); js.push(await c.evaluate(STATE)); }
  test('no seed: a new J each visit', js[0].seed !== js[1].seed && JSON.stringify(js[0].layout) !== JSON.stringify(js[1].layout), js.map(j => j.seed).join(' vs '));
  await wiggle(c, 2500); await c.waitFor('window.__cs.assembled', 60000); await move(c, 720, 450); await sleep(1500);
  for (const f of fs.readdirSync(path.join(here, 'img'))) if (f.startsWith('page-random-')) fs.unlinkSync(path.join(here, 'img', f));   // one per run, not a pile
  await c.shot(path.join(here, 'img', 'page-random-' + js[1].seed + '.png'));
  report.randomSeed = js[1].seed;

  // 5. phone and reduced motion
  await c.visit(`${URL}?seed=${SEED}`, 390, 844);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  await wiggle(c, 2000); await c.waitFor('window.__cs.assembled', 60000); await sleep(800);
  await c.shot(path.join(here, 'img', 'page-phone.png'));
  const ph = await c.evaluate(`({ over: document.documentElement.scrollWidth - innerWidth, last: document.querySelector('.links li:last-child a').getBoundingClientRect().bottom, h: innerHeight })`);
  test('phone: no sideways scroll, links on the first screen', ph.over <= 0 && ph.last <= ph.h, `overflow ${ph.over}, last link ${Math.round(ph.last)} of ${ph.h}`);
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(300);
  const rm = await c.evaluate(STATE);
  test('reduced motion: built from the first frame', rm.assembled);
  /* random seeds found a bug (rqec8q never finished), so: 8 more, each must
     build, drop 2 stones on the floor and finish. Reduced motion, so it's instant. */
  const bad = [];
  for (let k = 0; k < 8; k++) {
    c.errors.length = 0;
    await c.visit(URL + '?look=plain', 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(200);
    const r = await c.evaluate(STATE);
    if (!r.assembled || r.fallen !== 2 || r.jCount < 22 || c.errors.length) bad.push(r.seed + ': ' + JSON.stringify({ assembled: r.assembled, fallen: r.fallen, j: r.jCount, errors: c.errors }));
  }
  test('8 random seeds build, finish, drop 2 stones', !bad.length, bad.join(' | ') || 'all fine');
  /* the four signs: each builds, with the stones it should have */
  const want = { soft: [0, 0], stones: [10, 14], worker: [20, 30], pile: [6, 9] }, sbad = [];
  for (const [v, [lo, hi]] of Object.entries(want)) {
    c.errors.length = 0;
    await c.visit(`${URL}?look=plain&sign=${v}&seed=${SEED}`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(200);
    const r = await c.evaluate(STATE);
    if (r.variant !== v || r.signStones < lo || r.signStones > hi || r.site.n !== 1 || c.errors.length) sbad.push(`${v}: ` + JSON.stringify({ variant: r.variant, stones: r.signStones, n: r.site.n, errors: c.errors }));
  }
  test('the four signs build', !sbad.length, sbad.join(' | ') || 'soft, stones, worker, pile');

} catch (e) { test('run finished', false, e.message); }
finally { c.close(); }
report.hash = hashInputs();
report.when = new Date().toISOString();
fs.writeFileSync(path.join(here, 'page-report.json'), JSON.stringify(report, null, 1));
const failed = report.tests.filter(t => !t.pass).length;
console.log(failed ? failed + ' failed' : 'all passed (' + report.tests.length + ')');
process.exitCode = failed ? 1 : 0;

function hashInputs() {
  const h = crypto.createHash('sha256');
  for (const f of ['coming-soon.html', 'jbuilder.js', 'site.js', ...fs.readdirSync(path.join(here, 'masks')).filter(f => f.endsWith('.png')).sort().map(f => 'masks/' + f), ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
  return h.digest('hex');
}
