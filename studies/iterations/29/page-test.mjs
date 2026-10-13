// Study 29: more stones. ?cells= 25 | 40 | 60 per J; the eleven fonts Divya
// kept, each built and shot at all three counts; three other seeds each for
// Calistoga, Abril and Sansita Swashed. Study 28's page test underneath: the
// J left and the words right (stacked on a phone); six seconds whole; the
// stones let go, drop, fade, the next font flies in; the bar; reduced
// motion; the sign and fallen stones; the pointer; random seeds.
// Headless Chrome (SwiftShader: CPU, not the GPU).
// Writes page-report.json (read by check.cjs, hashed against the page, the
// builder, the look and the masks) and img/*.png. Needs the studies server.
//   node studies/iterations/29/page-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/29/coming-soon.html';
const SEED = 'study29';
const FONTS = ['rubik', 'archivo-black', 'shrikhand', 'lilita', 'alfa-slab', 'bagel-fat', 'calistoga', 'abril', 'ultra', 'sansita-swashed', 'tilt-warp'];
const CELLS = [25, 40, 60];
const OTHER_BREAKS = { fonts: ['calistoga', 'abril', 'sansita-swashed'], seeds: ['break-a', 'break-b', 'break-c'] };
const HOLD = 6;
const FLOOR = -1.12;
const report = { tests: [], timing: {}, counts: {} };
const test = (name, pass, detail) => { report.tests.push({ name, pass: !!pass, detail }); console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail !== undefined ? '  (' + detail + ')' : '')); };
const STATE = `(() => { const T = window.__cs; const J = T.pieces.filter(P => !P.fallen);
  const V = T.pieces[0].m.position.constructor, B = Object.getPrototypeOf(T.pieces[0].m.geometry.boundingBox).constructor;
  const wp = (P) => { const v = P.m.getWorldPosition(new V()); return [v.x, v.y, v.z]; };
  const R = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  return { look: T.look, seed: T.seed, genSeed: T.genSeed, font: T.font, cells: T.cells, next: T.next, gen: T.gen, swaps: T.swaps || 0, phase: T.phase, phaseT: T.phaseT || 0, hold: T.hold, fonts: T.fonts.length,
    mode: T.mode, assembled: T.assembled, tau: T.tau, end: T.rate.END, buildMs: T.buildMs, fit: T.fit,
    jCount: J.length, fallen: T.fallen.length, visible: T.pieces.filter(P => P.m.visible).length,
    away: J.map(P => P.m.position.distanceTo(P.home)),
    fallenAway: T.fallen.map(P => P.m.position.distanceTo(P.home)),
    fallenBox: T.fallen.map(P => { const box = new B().setFromObject(P.m, true);
      return { low: +box.min.y.toFixed(3), h: +(box.max.y - box.min.y).toFixed(3), w: +Math.max(box.max.x - box.min.x, box.max.z - box.min.z).toFixed(3) }; }),
    layout: J.map(P => [+P.home.x.toFixed(3), +P.home.y.toFixed(3)]).slice(0, 6),
    world: J.map(wp), jLow: Math.min(...J.filter(P => P.m.visible).map(P => wp(P)[1])), jHigh: Math.max(...J.filter(P => P.m.visible).map(P => wp(P)[1])),
    pivot: [T.pivot.position.x, T.pivot.position.y, T.pivot.rotation.x, T.pivot.rotation.y],
    bg: getComputedStyle(document.body).backgroundColor,
    stage: R('#stage'), words: R('.below'), h1: R('h1'), lastLink: R('.links li:last-child a'), textAlign: getComputedStyle(document.querySelector('.below')).textAlign,
    lit: [...document.querySelectorAll('.study a[data-font][aria-current]')].map(a => a.dataset.font), litCells: [...document.querySelectorAll('.study a[data-cells][aria-current]')].map(a => +a.dataset.cells),
    barFonts: document.querySelectorAll('.study a[data-font]').length, barCells: document.querySelectorAll('.study a[data-cells]').length,
    looks: document.querySelectorAll('.study a[data-look]').length, reroll: !!document.getElementById('reroll'),
    /* the site: each floor object's lowest point, and whether any overlaps a fallen stone */
    site: (() => { const ground = T.fallen.length ? T.fallen[0].m.parent : null, objs = [];
      for (const o of ground ? ground.children : []) if (o.type === 'Group') objs.push(new B().setFromObject(o, true));
      const stones = T.fallen.map(P => new B().setFromObject(P.m, true));
      return { n: objs.length, lows: objs.map(b => +b.min.y.toFixed(3)), clash: objs.some(b => stones.some(s => b.intersectsBox(s))) }; })() }; })()`;
/* where the J's stones land on screen: the box of their projected centres, in pixels */
const SCREEN = `(() => { const T = window.__cs; const V = T.pieces[0].m.position.constructor;
  const pts = T.pieces.filter(P => !P.fallen).map(P => { const v = P.m.getWorldPosition(new V()); v.project(T.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
  return { l: Math.min(...pts.map(p => p[0])), r: Math.max(...pts.map(p => p[0])), t: Math.min(...pts.map(p => p[1])), b: Math.max(...pts.map(p => p[1])) }; })()`;
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
async function wiggle(c, ms) {                       // keep the pointer moving, like a visitor would
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < ms) { k++; await move(c, 720 + 300 * Math.sin(k / 3), 450 + 160 * Math.cos(k / 4)); await sleep(30); }
}
async function whole(c) { await wiggle(c, 2500); await c.waitFor('window.__cs.assembled', 60000); await move(c, 720, 450); }
async function stageShot(c, r, file) {
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 70, width: Math.round(r.stage.w), height: 690, scale: 1 } });
  fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64'));
}
const c = await chrome();
try {
  // 1. the page, gummy, seed study29, 25 stones: build, wiggle to assemble, check the scene and the layout
  c.errors.length = 0;
  await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  await whole(c); await sleep(1200);
  let s = await c.evaluate(STATE);
  const sc = await c.evaluate(SCREEN);
  await c.shot(path.join(here, 'img', 'page-gummy.png'));
  test(`gummy, seed ${SEED}, rubik first, 25 stones`, s.look === 'gummy' && s.seed === SEED && s.font === 'rubik' && s.cells === 25, s.look + ' ' + s.seed + ' ' + s.font + ' ' + s.cells);
  test('wide: the stage is a left column, the words to its right, left-aligned', s.stage.r <= s.words.l + 1 && s.stage.w > s.words.w && s.stage.h >= 880 && s.textAlign === 'left', `stage ${Math.round(s.stage.w)}×${Math.round(s.stage.h)} ends ${Math.round(s.stage.r)}, words start ${Math.round(s.words.l)}, ${s.textAlign}`);
  test('wide: the words sit mid-height', Math.abs((s.h1.t + s.lastLink.b) / 2 - 450) < 120, `headline top ${Math.round(s.h1.t)}, last link bottom ${Math.round(s.lastLink.b)}`);
  test('wide: the J is inside the stage column, not under the words', sc.l > s.stage.l && sc.r < s.stage.r && sc.t > 60 && sc.b < s.stage.b, `J spans ${Math.round(sc.l)}–${Math.round(sc.r)} of the ${Math.round(s.stage.l)}–${Math.round(s.stage.r)} column`);
  test('the bar: 11 fonts, 3 stone counts, no looks, no "new J"', s.barFonts === 11 && s.fonts === 11 && s.barCells === 3 && s.looks === 0 && !s.reroll, `${s.barFonts} fonts, ${s.barCells} counts, ${s.looks} looks, reroll ${s.reroll}`);
  test('the bar lights the font on stage and the count', s.lit.length === 1 && s.lit[0] === 'rubik' && s.litCells.length === 1 && s.litCells[0] === 25, s.lit.join(',') + ' ' + s.litCells.join(','));
  test(`${s.jCount + s.fallen} stones: ${s.jCount} in the J, ${s.fallen} on the floor`, s.jCount + s.fallen >= 22 && s.fallen === 2, `built in ${s.buildMs} ms`);
  test('J stones home, fallen stones landed', Math.max(...s.away) < 0.005 && Math.max(...s.fallenAway) < 0.005);
  test('fallen stones rest on the floor', s.fallenBox.every(b => Math.abs(b.low - FLOOR) < 0.02), s.fallenBox.map(b => b.low).join(', '));
  test('and lie down (wider than tall)', s.fallenBox.every(b => b.w > b.h), s.fallenBox.map(b => b.w + ' wide, ' + b.h + ' tall').join(' | '));
  test('the sign lies on the floor', s.site.n === 1 && s.site.lows.every(y => Math.abs(y - FLOOR) < 0.01), `${s.site.n} object, at ${s.site.lows.join(', ')}`);
  test('the sign clears the fallen stones', !s.site.clash);
  test('white page, no JavaScript errors', s.bg === 'rgb(255, 255, 255)' && c.errors.length === 0, c.errors.join(' / ') || s.bg);

  // 2. the cycle, same visit: whole for six seconds, then the stones let go, land, fade; the next font flies in
  await sleep(1200);
  const mid = await c.evaluate(STATE);
  test('still whole at 3 s: same font, every stone home', mid.phase === 'hold' && mid.font === 'rubik' && Math.max(...mid.away) < 0.005, `phase ${mid.phase} at ${mid.phaseT.toFixed(1)} s`);
  await c.waitFor("window.__cs.phase !== 'hold'", 20000);
  const letGo = await c.evaluate(`(() => { const T = window.__cs; return { phase: T.phase, heldFor: (performance.now() - T.wholeAt) / 1000 }; })()`);
  test(`lets go ${HOLD} seconds after it is whole`, letGo.phase === 'fall' && letGo.heldFor >= HOLD && letGo.heldFor < HOLD + 1.5, `fall at ${letGo.heldFor.toFixed(2)} s`);
  let low = 9, lowest = 9, k = 0, fading = false, landedAll = false;
  while (await c.evaluate("window.__cs.phase === 'fall'") && k < 200) {
    const f = await c.evaluate(STATE);
    low = Math.min(low, f.jLow); lowest = Math.min(lowest, f.jLow);
    if (k === 2) await c.shot(path.join(here, 'img', 'fall-1.png'));
    if (f.jHigh < FLOOR + 0.5 && f.jHigh > -9 && !landedAll) { landedAll = true; await c.shot(path.join(here, 'img', 'fall-2.png')); }
    if (f.visible < f.jCount + f.fallen && !fading) { fading = true; await c.shot(path.join(here, 'img', 'fall-3.png')); }
    k++; await sleep(120);
  }
  test('the stones drop to the floor', low < FLOOR + 0.35 && landedAll, `lowest stone centre ${low.toFixed(2)} (floor ${FLOOR}); all down: ${landedAll}`);
  test('and not through it', lowest > FLOOR - 0.25, lowest.toFixed(2));
  test('then fade away', fading);
  await c.waitFor("window.__cs.phase === 'build'", 30000);
  const nx = await c.evaluate(STATE);
  test('the next font takes the stage: archivo-black, a fresh J', nx.font === 'archivo-black' && nx.gen === 1 && nx.swaps === 1 && nx.genSeed === SEED + '/archivo-black' && nx.jCount + nx.fallen >= 22 && nx.fallen === 2, `${nx.font} gen ${nx.gen} ${nx.jCount}+${nx.fallen} stones, seed ${nx.genSeed}`);
  test('its stones start away, not in the J', Math.min(...nx.away) > 0.5, 'min ' + Math.min(...nx.away).toFixed(2));
  test('the bar follows', nx.lit.length === 1 && nx.lit[0] === 'archivo-black' && nx.next === 'shrikhand', nx.lit.join(',') + ' → ' + nx.next);
  await c.shot(path.join(here, 'img', 'next-start.png'));
  await whole(c); await sleep(1200);
  const nw = await c.evaluate(STATE);
  test('and it comes whole', nw.assembled && nw.font === 'archivo-black' && Math.max(...nw.away) < 0.005 && Math.max(...nw.fallenAway) < 0.005 && nw.fallenBox.every(b => Math.abs(b.low - FLOOR) < 0.02), nw.fallenBox.map(b => b.low).join(', '));
  test('no JavaScript errors through a cycle', c.errors.length === 0, c.errors.join(' / '));

  // 3. the bar brings a font next, now
  await c.evaluate(`document.querySelector('.study a[data-font="ultra"]').click()`);
  await sleep(150);
  const cl = await c.evaluate(STATE);
  test('click Ultra: the J lets go, Ultra is next', cl.phase === 'fall' && cl.next === 'ultra', `phase ${cl.phase}, next ${cl.next}`);
  await c.waitFor("window.__cs.phase === 'build'", 30000);
  const cj = await c.evaluate(STATE);
  test('Ultra takes the stage, Sansita after it', cj.font === 'ultra' && cj.next === 'sansita-swashed' && cj.lit[0] === 'ultra', `${cj.font} → ${cj.next}`);

  // 4. the order wraps: the last font is followed by the first
  await c.visit(`${URL}?font=tilt-warp&seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  const wr = await c.evaluate(STATE);
  test('?font=tilt-warp: on stage, Rubik next', wr.font === 'tilt-warp' && wr.next === 'rubik', `${wr.font} → ${wr.next}`);

  // 5. more stones: 60, a full cycle through the fall; the build takes about the same time as 25
  c.errors.length = 0;
  await c.visit(`${URL}?seed=${SEED}&cells=60&font=ultra`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  const t60 = Date.now(); await c.waitFor('window.__cs.assembled', 40000); report.timing.idle60 = (Date.now() - t60) / 1000;
  await sleep(600);
  const s60 = await c.evaluate(STATE);
  test('?cells=60: about 60 stones, 2 on the floor, the bar lights 60', s60.cells === 60 && s60.jCount + s60.fallen >= 54 && s60.fallen === 2 && s60.litCells[0] === 60, `${s60.jCount}+${s60.fallen}, built in ${s60.buildMs} ms`);
  test('60 stones: every J stone home, the J inside the column', Math.max(...s60.away) < 0.005 && (await c.evaluate(SCREEN)).r < s60.stage.r);
  await c.shot(path.join(here, 'img', 'page-60.png'));
  await c.waitFor("window.__cs.phase === 'build' && window.__cs.gen === 1", 40000);
  const n60 = await c.evaluate(STATE);
  test('60 stones: they let go and the next font follows, still 60, no errors', n60.cells === 60 && n60.gen === 1 && n60.jCount + n60.fallen >= 54 && c.errors.length === 0, `${n60.font} ${n60.jCount}+${n60.fallen}; ` + (c.errors.join(' / ') || 'no errors'));

  // 6. the build follows the pointer: idle vs moving, same seed, 25 stones
  for (const mode of ['idle', 'moving']) {
    await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    const t1 = Date.now();
    if (mode === 'moving') { while (!(await c.evaluate('window.__cs.assembled')) && Date.now() - t1 < 30000) await wiggle(c, 200); }
    else await c.waitFor('window.__cs.assembled', 30000);
    report.timing[mode] = (Date.now() - t1) / 1000;
  }
  test('moving the pointer builds it faster', report.timing.moving * 2.5 < report.timing.idle, `idle ${report.timing.idle.toFixed(1)} s, moving ${report.timing.moving.toFixed(1)} s`);
  test('it still finishes with no pointer at all', report.timing.idle < 12, report.timing.idle.toFixed(1) + ' s');
  test('60 stones build in about the time 25 do, idle', Math.abs(report.timing.idle60 - report.timing.idle) < 3.5, `25: ${report.timing.idle.toFixed(1)} s, 60: ${report.timing.idle60.toFixed(1)} s`);

  // 7. the J moves as one: while it follows the pointer, every stone keeps its place in the J
  await move(c, 1350, 120); await sleep(700);
  const a = await c.evaluate(STATE);
  await move(c, 150, 800); await sleep(700);
  const b = await c.evaluate(STATE);
  const local = await c.evaluate(`window.__cs.pieces.filter(P => !P.fallen).map(P => P.m.position.distanceTo(P.home))`);
  const moved = Math.hypot(a.world[0][0] - b.world[0][0], a.world[0][1] - b.world[0][1]);
  test('the J follows the pointer', moved > 0.1 && Math.abs(a.pivot[3] - b.pivot[3]) > 0.3, `moved ${moved.toFixed(2)}, turned ${(a.pivot[3] - b.pivot[3]).toFixed(2)}`);
  test('as one: no stone moves within the J', Math.max(...local) < 1e-6, 'max ' + Math.max(...local).toExponential(1));

  // 8. random: two visits with no seed give two different Js
  const js = [];
  for (let k = 0; k < 2; k++) { await c.visit(URL, 1440, 900); await c.waitFor('window.__cs && window.__cs.ready', 120000); js.push(await c.evaluate(STATE)); }
  test('no seed: a new J each visit', js[0].seed !== js[1].seed && JSON.stringify(js[0].layout) !== JSON.stringify(js[1].layout), js.map(j => j.seed).join(' vs '));
  report.randomSeed = js[1].seed;

  // 9. phone: stacked, the J above the words
  await c.visit(`${URL}?seed=${SEED}`, 390, 844);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  await wiggle(c, 2000); await c.waitFor('window.__cs.assembled', 60000); await sleep(800);
  await c.shot(path.join(here, 'img', 'page-phone.png'));
  const ph = await c.evaluate(STATE);
  const over = await c.evaluate(`document.documentElement.scrollWidth - innerWidth`);
  test('phone: stacked, the J above the words, centred', ph.stage.b <= ph.words.t + 1 && ph.stage.w >= 388 && ph.textAlign === 'center', `stage ends ${Math.round(ph.stage.b)}, words start ${Math.round(ph.words.t)}, ${ph.textAlign}`);
  test('phone: no sideways scroll, links on the first screen', over <= 0 && ph.lastLink.b <= 844, `overflow ${over}, last link ${Math.round(ph.lastLink.b)} of 844`);

  // 10. reduced motion: built from the first frame; the cycle is a cut, no fall
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(300);
  const rm = await c.evaluate(STATE);
  test('reduced motion: built from the first frame', rm.assembled);
  await c.waitFor("window.__cs.font === 'archivo-black'", 20000);
  const rc = await c.evaluate(STATE);
  test(`reduced motion: ${HOLD} seconds on, a cut to the next font, whole at once`, rc.font === 'archivo-black' && rc.assembled && rc.swaps === 1 && rc.phase === 'hold' && Math.max(...rc.away) < 0.005, `${rc.font} ${rc.phase}`);
  const bad = [];
  for (let k = 0; k < 8; k++) {
    c.errors.length = 0;
    await c.visit(URL, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(200);
    const r = await c.evaluate(STATE);
    if (!r.assembled || r.fallen !== 2 || r.jCount < 22 || c.errors.length) bad.push(r.seed + ': ' + JSON.stringify({ assembled: r.assembled, fallen: r.fallen, j: r.jCount, errors: c.errors }));
  }
  test('8 random seeds build, finish, drop 2 stones', !bad.length, bad.join(' | ') || 'all fine');
  /* every font at every count: builds, finishes, drops 2 stones, no errors; one shot each (the stage column) */
  const fbad = [];
  for (const cells of CELLS) for (const font of FONTS) {
    c.errors.length = 0;
    await c.visit(`${URL}?font=${font}&seed=${SEED}&cells=${cells}`, 1100, 760);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(400);
    const r = await c.evaluate(STATE);
    report.counts[font + '@' + cells] = { j: r.jCount, fallen: r.fallen, ms: r.buildMs };
    if (r.font !== font || r.cells !== cells || !r.assembled || r.fallen !== 2 || r.jCount < cells * 0.8 || c.errors.length) fbad.push(`${font}@${cells}: ` + JSON.stringify({ font: r.font, fallen: r.fallen, j: r.jCount, errors: c.errors }));
    await stageShot(c, r, `font-${font}-${cells}.png`);
  }
  test('11 fonts × 3 counts build', !fbad.length, fbad.join(' | ') || '33 builds');
  /* other breaks: three more seeds for the three fonts Divya asked about, at 25 */
  const obad = [];
  for (const font of OTHER_BREAKS.fonts) for (const seed of OTHER_BREAKS.seeds) {
    c.errors.length = 0;
    await c.visit(`${URL}?font=${font}&seed=${seed}&cells=25`, 1100, 760);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(400);
    const r = await c.evaluate(STATE);
    if (r.font !== font || r.seed !== seed || !r.assembled || r.fallen !== 2 || c.errors.length) obad.push(`${font}/${seed}`);
    await stageShot(c, r, `break-${font}-${seed}.png`);
  }
  test('three other breaks each for Calistoga, Abril, Sansita', !obad.length, obad.join(' | ') || OTHER_BREAKS.seeds.join(', '));

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
