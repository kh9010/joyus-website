// Study 40: the font order alternates sans/not-sans; the sign further right; white text under the band; more air; heavier headline; the Drive deck.
// Study 39: decided words; the hover sweep; the sign alone under the words, the blocks under the J; the J smaller.
// Study 37: the fallen stones come from inside the outline, every font, so
// the silhouette keeps; checked on every font and six Sansita seeds.
// Study 36: the sign and the fallen stones under the words, bottom right, on
// wide screens; in front of the J on a phone.
// Study 35: the words after Divya's sketch: the headline wider, "under
// construction" whole; C's links stacked; ?line= dresses line and links.
// Study 34: the glyph field: ?edge= chamfer | exact | exact1024 at the same mesh
// resolution; triangles stay put, build time measured, close-ups at 2×.
// Study 33: treatment C by default; its line in four fonts (?line=), each shot.
// Study 32: smoother stones: ?res= 0.6 | 1 | 1.5, the same J built at each,
// measured (triangles, build ms) and shot up close at 2×.
// Study 31: the words. The headline bigger; the new second line; the links
// four ways (?words=a|b|c|d), each shot on wide and on a phone. Study 30's
// page test underneath (40 stones, ten fonts, Sansita from the tail, the
// cycle, the bar, reduced motion, the pointer, random seeds).
// Headless Chrome (SwiftShader: CPU, not the GPU).
//   node studies/iterations/40/page-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/40/coming-soon.html';
const SEED = 'study40';
const LINES = ['grotesk', 'serif', 'fraunces', 'newsreader', 'playfair', 'cormorant', 'mono', 'plex', 'hand', 'lilita', 'nunito', 'bricolage'];
const EDGES = ['chamfer', 'exact', 'exact1024'];
const RESS = [0.6, 1, 1.5];
const FONTS = ['rubik', 'alfa-slab', 'archivo-black', 'shrikhand', 'lilita', 'calistoga', 'bagel-fat', 'abril', 'sansita-swashed', 'ultra'];
const SANS = new Set(['rubik', 'archivo-black', 'lilita', 'bagel-fat', 'sansita-swashed']);
const WORDS = ['a', 'b', 'c', 'd'];
const N = 40, JH = 1.6;
const HOLD = 6;
const FLOOR = -1.12;
const H1_STUDY30 = 41.6;   // px at 1440: clamp(1.6rem, 4.2vw, 2.6rem) → 2.6rem
const report = { tests: [], timing: {}, counts: {} };
const test = (name, pass, detail) => { report.tests.push({ name, pass: !!pass, detail }); console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail !== undefined ? '  (' + detail + ')' : '')); };
const STATE = `(() => { const T = window.__cs; const J = T.pieces.filter(P => !P.fallen);
  const V = T.pieces[0].m.position.constructor, B = Object.getPrototypeOf(T.pieces[0].m.geometry.boundingBox).constructor;
  const wp = (P) => { const v = P.m.getWorldPosition(new V()); return [v.x, v.y, v.z]; };
  const R = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  return { look: T.look, seed: T.seed, genSeed: T.genSeed, font: T.font, cells: T.cells, words: T.words, line: T.line, res: T.res, edge: T.edge, tris: T.tris, fieldMs: T.fieldMs, maskR: T.maskR, next: T.next, gen: T.gen, swaps: T.swaps || 0, phase: T.phase, phaseT: T.phaseT || 0, hold: T.hold, fonts: T.fonts.length,
    mode: T.mode, assembled: T.assembled, tau: T.tau, end: T.rate.END, buildMs: T.buildMs, fit: T.fit,
    jCount: J.length, fallen: T.fallen.length, visible: T.pieces.filter(P => P.m.visible).length,
    away: J.map(P => P.m.position.distanceTo(P.home)),
    fallenAway: T.fallen.map(P => P.m.position.distanceTo(P.home)),
    fallenFrom: T.fallen.map(P => +P.origin.y.toFixed(3)), fallenEdge: T.fallen.map(P => +P.edge.toFixed(3)), insideCount: T.pieces.filter(P => P.edge < -0.06).length,
    fallenBox: T.fallen.map(P => { const box = new B().setFromObject(P.m, true);
      return { low: +box.min.y.toFixed(3), h: +(box.max.y - box.min.y).toFixed(3), w: +Math.max(box.max.x - box.min.x, box.max.z - box.min.z).toFixed(3) }; }),
    layout: J.map(P => [+P.home.x.toFixed(3), +P.home.y.toFixed(3)]).slice(0, 6),
    world: J.map(wp), jLow: Math.min(...J.filter(P => P.m.visible).map(P => wp(P)[1])), jHigh: Math.max(...J.filter(P => P.m.visible).map(P => wp(P)[1])),
    pivot: [T.pivot.position.x, T.pivot.position.y, T.pivot.rotation.x, T.pivot.rotation.y],
    bg: getComputedStyle(document.body).backgroundColor,
    stage: R('#stage'), words_: R('.below'), h1: R('h1'), lastLink: R('.links li:last-child a'), links: R('.links'), textAlign: getComputedStyle(document.querySelector('.below')).textAlign,
    h1px: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize), note: document.querySelector('.note').textContent,
    h1lines: Math.round(document.querySelector('h1').getBoundingClientRect().height / parseFloat(getComputedStyle(document.querySelector('h1')).lineHeight)), keepRects: document.querySelector('h1 .keep').getClientRects().length,
    linkFont: getComputedStyle(document.querySelector('.links li:first-child a')).fontFamily,
    noteFont: getComputedStyle(document.querySelector('.note')).fontFamily, noteStyle: getComputedStyle(document.querySelector('.note')).fontStyle,
    linkShape: (() => { const a = document.querySelector('.links li:first-child a'), cs = getComputedStyle(a); return { radius: cs.borderRadius, border: cs.borderTopWidth, bg: cs.backgroundColor, underline: cs.textDecorationLine, flex: cs.flexDirection, dot: getComputedStyle(a.querySelector('.dot')).display, arrow: getComputedStyle(a.querySelector('.arrow')).display, small: getComputedStyle(a.querySelector('small')).display }; })(),
    linkBoxes: [...document.querySelectorAll('.links a')].map(a => { const r = a.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom, w: r.width }; }),
    lit: [...document.querySelectorAll('.study a[data-font][aria-current]')].map(a => a.dataset.font), litWords: [...document.querySelectorAll('.study a[data-words][aria-current]')].map(a => a.dataset.words),
    barFonts: document.querySelectorAll('.study a[data-font]').length, barWords: document.querySelectorAll('.study a[data-words]').length,
    looks: document.querySelectorAll('.study a[data-look]').length, reroll: !!document.getElementById('reroll'),
    site: (() => { const ground = T.fallen.length ? T.fallen[0].m.parent : null, objs = [];
      for (const o of ground ? ground.children : []) if (o.type === 'Group') objs.push(new B().setFromObject(o, true));
      const stones = T.fallen.map(P => new B().setFromObject(P.m, true));
      return { n: objs.length, lows: objs.map(b => +b.min.y.toFixed(3)), clash: objs.some(b => stones.some(s => b.intersectsBox(s))) }; })() }; })()`;
const SCREEN = `(() => { const T = window.__cs; const V = T.pieces[0].m.position.constructor;
  const pts = T.pieces.filter(P => !P.fallen).map(P => { const v = P.m.getWorldPosition(new V()); v.project(T.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
  return { l: Math.min(...pts.map(p => p[0])), r: Math.max(...pts.map(p => p[0])), t: Math.min(...pts.map(p => p[1])), b: Math.max(...pts.map(p => p[1])) }; })()`;
/* where the site lands on screen: the sign's and the fallen stones' centres, in pixels */
const SITE = `(() => { const T = window.__cs; const V = T.pivot.position.constructor;
  const pr = (o) => { const v = o.getWorldPosition(new V()); v.project(T.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
  const ground = T.fallen[0].m.parent, sign = ground.children.find(o => o.type === 'Group');
  return { sign: pr(sign), stones: T.fallen.map(P => pr(P.m)), links: document.querySelector('.links').getBoundingClientRect().bottom, words: document.querySelector('.below').getBoundingClientRect().left, at: T.siteAt }; })()`;
/* the same stones: each centre within 0.03 of its twin (the cut field moves a centre by a hair) */
const sameStones = (A, B) => { const a = JSON.parse(A), b = JSON.parse(B); return a.length === b.length && a.every((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1]) < 0.03); };
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
async function wiggle(c, ms) {
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < ms) { k++; await move(c, 720 + 300 * Math.sin(k / 3), 450 + 160 * Math.cos(k / 4)); await sleep(30); }
}
async function whole(c) { await wiggle(c, 2500); await c.waitFor('window.__cs.assembled', 60000); await move(c, 720, 450); }
async function stageShot(c, r, file) { return clipShot(c, { x: 0, y: 70, width: Math.round(r.stage.w), height: 690 }, file); }
async function clipShot(c, clip, file) {
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
  fs.writeFileSync(path.join(here, 'img', file), Buffer.from(data, 'base64'));
}
const c = await chrome();
try {
  // 1. the page, gummy, seed study31, 40 stones, words A: build, assemble, check the scene and the layout
  c.errors.length = 0;
  await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  await whole(c); await sleep(1200);
  let s = await c.evaluate(STATE);
  const sc = await c.evaluate(SCREEN);
  const document_lines = await c.evaluate(`document.querySelectorAll('.study a[data-line]').length`);
  await c.shot(path.join(here, 'img', 'page-gummy.png'));
  test(`gummy, seed ${SEED}, rubik first, 40 stones`, s.look === 'gummy' && s.seed === SEED && s.font === 'rubik' && s.cells === N, s.look + ' ' + s.seed + ' ' + s.font + ' ' + s.cells);
  test('the headline is bigger than in Study 30', s.h1px > H1_STUDY30 * 1.15, `${s.h1px.toFixed(1)}px (Study 30: ${H1_STUDY30}px)`);
  test('the second line: in the meantime… you can check us out here', s.note === 'in the meantime… you can check us out here', s.note);
  test('wide: the headline is two lines and "under construction" is whole on the second', s.h1lines === 2 && s.keepRects === 1, `${s.h1lines} lines, the span in ${s.keepRects} piece`);
  test('C: the links stack as a list, each on its own line', s.linkBoxes.every((b, i) => i === 0 || b.l === s.linkBoxes[0].l) && s.linkBoxes.every((b, i) => i === 0 || b.b > s.linkBoxes[i - 1].b + 10), s.linkBoxes.map(b => Math.round(b.b)).join(' < '));
  test('wide: the stage is a left column, the words to its right, left-aligned', s.stage.r <= s.words_.l + 1 && s.stage.w > s.words_.w && s.stage.h >= 880 && s.textAlign === 'left', `stage ${Math.round(s.stage.w)}×${Math.round(s.stage.h)} ends ${Math.round(s.stage.r)}, words start ${Math.round(s.words_.l)}, ${s.textAlign}`);
  test('wide: the words sit mid-height', Math.abs((s.h1.t + s.lastLink.b) / 2 - 450) < 140, `headline top ${Math.round(s.h1.t)}, last link bottom ${Math.round(s.lastLink.b)}`);
  test('wide: the J is inside the stage column, not under the words', sc.l > s.stage.l && sc.r < s.stage.r && sc.t > 60 && sc.b < s.stage.b, `J spans ${Math.round(sc.l)}–${Math.round(sc.r)} of the ${Math.round(s.stage.l)}–${Math.round(s.stage.r)} column`);
  const site = await c.evaluate(SITE);
  test('wide: the sign sits under the words, bottom right, on screen', site.sign[0] > site.words && site.sign[0] < 1440 && site.sign[1] > site.links + 20 && site.sign[1] < 880, `sign at ${site.sign.map(Math.round)}, links end ${Math.round(site.links)}, words start ${Math.round(site.words)}`);
  test('the bar: 10 fonts, no looks, no "new J"', s.barFonts === 10 && s.fonts === 10 && s.looks === 0 && !s.reroll, `${s.barFonts} fonts, ${s.looks} looks, reroll ${s.reroll}`);
  test(`${s.jCount + s.fallen} stones: ${s.jCount} in the J, ${s.fallen} on the floor`, s.jCount + s.fallen >= 36 && s.fallen === 2, `built in ${s.buildMs} ms`);
  test('J stones home, fallen stones landed', Math.max(...s.away) < 0.005 && Math.max(...s.fallenAway) < 0.005);
  test('fallen stones rest on the floor', s.fallenBox.every(b => Math.abs(b.low - FLOOR) < 0.02), s.fallenBox.map(b => b.low).join(', '));
  test('the sign lies on the floor', s.site.n === 1 && s.site.lows.every(y => Math.abs(y - FLOOR) < 0.01), `${s.site.n} object, at ${s.site.lows.join(', ')}`);
  test('the sign clears the fallen stones', !s.site.clash);
  test('white page, no JavaScript errors', s.bg === 'rgb(255, 255, 255)' && c.errors.length === 0, c.errors.join(' / ') || s.bg);

  // 2. the hover: the link's colour sweeps in from the left, behind the whole word
  const HOV = `(() => { const a = document.querySelector('.links li:first-child a'), cs = getComputedStyle(a), o = getComputedStyle(a, '::after'); return { size: cs.backgroundSize, pos: cs.backgroundPosition, img: cs.backgroundImage, color: cs.color, overClip: o.clipPath, overColor: o.color, overText: o.content, r: a.getBoundingClientRect().toJSON() }; })()`;
  const h0 = await c.evaluate(HOV);
  await move(c, h0.r.x + h0.r.width / 2, h0.r.y + h0.r.height / 2); await sleep(120);
  const h1 = await c.evaluate(HOV);
  await sleep(500);
  const h2 = await c.evaluate(HOV);
  await c.shot(path.join(here, 'img', 'hover.png'));
  await move(c, 720, 450); await sleep(600);
  const h3 = await c.evaluate(HOV);
  const w = (sz) => parseFloat(sz);
  test('hover: the colour band starts at 0, sweeps from the left to the full word, and leaves again', w(h0.size) === 0 && w(h1.size) >= 0 && w(h1.size) <= 100 && h2.size.startsWith('100%') && /left|0%/.test(h0.pos) && w(h3.size) === 0 && /rgb\(233, 30, 123\)|rgb\(233,30,123\)/.test(h2.img), `${h0.size} → ${h1.size} → ${h2.size} → ${h3.size}; ${h2.img.slice(0, 60)}`);
  test('hover: a white copy of the word is revealed from the left in step with the band, and hidden again', /100%/.test(h0.overClip) && h0.overText === '"Our work"' && h0.overColor === 'rgb(255, 255, 255)' && h0.color === 'rgb(44, 53, 68)' && !/100%/.test(h2.overClip) && /100%/.test(h3.overClip), `${h0.overClip} → ${h2.overClip} → ${h3.overClip}; copy ${h0.overText} in ${h0.overColor}`);
  const y3 = await c.evaluate(`getComputedStyle(document.querySelector('.links li:nth-child(3) a'), '::after').color`);
  test('the yellow link keeps ink letters under its band', y3 === 'rgb(44, 53, 68)', y3);
  test('the fonts never put two sans in a row, round the wrap', FONTS.every((f, i) => SANS.has(f) !== SANS.has(FONTS[(i + 1) % FONTS.length])) && s.fonts === 10, FONTS.map(f => (SANS.has(f) ? 'sans' : 'not') + ':' + f).join(' '));
  test('the headline is heavier: a stroke in the ink', (await c.evaluate(`getComputedStyle(document.querySelector('h1')).webkitTextStrokeWidth`)) !== '0px');
  test('"Our work" goes to the Drive deck', (await c.evaluate(`document.querySelector('.links li:first-child a').href`)).startsWith('https://drive.google.com/file/d/1cM-AvZpCK4QvV3oYHT2cnu9a0sGEgtoM/'));
  test('more air between the subtitle and the links', s.links.t - (await c.evaluate(`document.querySelector('.note').getBoundingClientRect().bottom`)) > 36, `${Math.round(s.links.t - (await c.evaluate("document.querySelector('.note').getBoundingClientRect().bottom")))}px`);
  test('the words are decided: C, Space Grotesk subtitle, no switches in the bar', s.words === 'c' && /Space Grotesk/.test(s.noteFont) && /Space Grotesk/.test(s.linkFont) && s.barWords === 0 && document_lines === 0 && !/data-res|data-edge/.test(await c.evaluate('document.querySelector(".study").innerHTML')), `${s.barWords} treatments, ${document_lines} subtitles`);
  // 2b. the site: the sign under the words; the two blocks under the J, in its column
  const site0 = await c.evaluate(SITE);
  test('the sign sits under the words; the two blocks stay under the J', site0.sign[0] > site0.words && site0.sign[1] > site0.links + 20 && site0.sign[1] < 880 && site0.stones.every(p => p[0] < s.stage.r && p[1] > sc.b - 40 && p[1] < s.stage.b), `sign at ${site0.sign.map(Math.round)}, blocks at ${site0.stones.map(p => p.map(Math.round).join(':')).join(' ')}, J bottom ${Math.round(sc.b)}, column ends ${Math.round(s.stage.r)}`);
  test('the J is a bit smaller: under 84% of the column\'s height', (sc.b - sc.t) < 0.84 * s.stage.h, `J ${Math.round(sc.b - sc.t)} of ${Math.round(s.stage.h)}`);

  // 3. the cycle: whole for six seconds, then the stones let go, land, fade; the next font flies in
  await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  await whole(c); await sleep(2400);
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
  const faded = await c.evaluate('window.__cs.lastFaded || window.__cs.faded || 0');
  test('then fade away', fading || faded >= 36, `${faded} stones faded out`);
  await c.waitFor("window.__cs.phase === 'build'", 30000);
  const nx = await c.evaluate(STATE);
  test('the next font takes the stage: alfa-slab, a fresh J of 40', nx.font === 'alfa-slab' && nx.cells === N && nx.gen === 1 && nx.swaps === 1 && nx.genSeed === SEED + '/alfa-slab' && nx.jCount + nx.fallen >= 36 && nx.fallen === 2, `${nx.font} gen ${nx.gen} ${nx.jCount}+${nx.fallen} stones, seed ${nx.genSeed}`);
  test('its stones start away, not in the J', Math.min(...nx.away) > 0.5, 'min ' + Math.min(...nx.away).toFixed(2));
  test('the bar follows', nx.lit.length === 1 && nx.lit[0] === 'alfa-slab' && nx.next === 'archivo-black', nx.lit.join(',') + ' → ' + nx.next);
  await whole(c); await sleep(1200);
  const nw = await c.evaluate(STATE);
  const site2 = await c.evaluate(SITE);
  test('after the swap, the new blocks are under the J, the sign still under the words', site2.stones.every(p => p[0] < nw.stage.r) && site2.sign[0] > site2.words && site2.sign[1] > site2.links + 20, site2.stones.map(p => p.map(Math.round).join(':')).join(' ') + '; sign ' + site2.sign.map(Math.round));
  test('and it comes whole', nw.assembled && nw.font === 'alfa-slab' && Math.max(...nw.away) < 0.005 && Math.max(...nw.fallenAway) < 0.005 && nw.fallenBox.every(b => Math.abs(b.low - FLOOR) < 0.02), nw.fallenBox.map(b => b.low).join(', '));
  test('no JavaScript errors through a cycle', c.errors.length === 0, c.errors.join(' / '));

  // 4. the bar brings a font next, now; the order wraps
  await c.evaluate(`document.querySelector('.study a[data-font="ultra"]').click()`);
  await sleep(150);
  const cl = await c.evaluate(STATE);
  test('click Ultra: the J lets go, Ultra is next', cl.phase === 'fall' && cl.next === 'ultra', `phase ${cl.phase}, next ${cl.next}`);
  await c.waitFor("window.__cs.phase === 'build'", 30000);
  const cj = await c.evaluate(STATE);
  test('Ultra takes the stage, Rubik after it (the wrap)', cj.font === 'ultra' && cj.next === 'rubik' && cj.lit[0] === 'ultra', `${cj.font} → ${cj.next}`);
  await c.visit(`${URL}?font=sansita-swashed&seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  const wr = await c.evaluate(STATE);
  test('?font=sansita-swashed: on stage, Ultra next', wr.font === 'sansita-swashed' && wr.next === 'ultra', `${wr.font} → ${wr.next}`);

  // 5. the build follows the pointer: idle vs moving, same seed
  for (const mode of ['idle', 'moving']) {
    await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000);
    const t1 = Date.now();
    if (mode === 'moving') { while (!(await c.evaluate('window.__cs.assembled')) && Date.now() - t1 < 30000) await wiggle(c, 200); }
    else await c.waitFor('window.__cs.assembled', 30000);
    report.timing[mode] = (Date.now() - t1) / 1000;
  }
  test('moving the pointer builds it faster (the idle build is quick now, so by less)', report.timing.moving * 1.3 < report.timing.idle, `idle ${report.timing.idle.toFixed(1)} s, moving ${report.timing.moving.toFixed(1)} s`);
  test('it still finishes with no pointer at all, and quickly: under 6 s', report.timing.idle < 6, report.timing.idle.toFixed(1) + ' s');

  // 6. the J moves as one
  await move(c, 1350, 120); await sleep(700);
  const a = await c.evaluate(STATE);
  await move(c, 150, 800); await sleep(700);
  const b = await c.evaluate(STATE);
  const local = await c.evaluate(`window.__cs.pieces.filter(P => !P.fallen).map(P => P.m.position.distanceTo(P.home))`);
  const moved = Math.hypot(a.world[0][0] - b.world[0][0], a.world[0][1] - b.world[0][1]);
  test('the J follows the pointer', moved > 0.1 && Math.abs(a.pivot[3] - b.pivot[3]) > 0.3, `moved ${moved.toFixed(2)}, turned ${(a.pivot[3] - b.pivot[3]).toFixed(2)}`);
  test('as one: no stone moves within the J', Math.max(...local) < 1e-6, 'max ' + Math.max(...local).toExponential(1));

  // 7. random: two visits with no seed give two different Js
  const js = [];
  for (let k = 0; k < 2; k++) { await c.visit(URL, 1440, 900); await c.waitFor('window.__cs && window.__cs.ready', 120000); js.push(await c.evaluate(STATE)); }
  test('no seed: a new J each visit', js[0].seed !== js[1].seed && JSON.stringify(js[0].layout) !== JSON.stringify(js[1].layout), js.map(j => j.seed).join(' vs '));
  report.randomSeed = js[1].seed;

  // 8. phone: stacked, the J above the words
  await c.visit(`${URL}?seed=${SEED}`, 390, 844);
  await c.waitFor('window.__cs && window.__cs.ready', 120000);
  await wiggle(c, 2000); await c.waitFor('window.__cs.assembled', 60000); await sleep(800);
  await c.shot(path.join(here, 'img', 'page-phone.png'));
  const ph = await c.evaluate(STATE);
  const over = await c.evaluate(`document.documentElement.scrollWidth - innerWidth`);
  test('phone: stacked, the J above the words, centred', ph.stage.b <= ph.words_.t + 1 && ph.stage.w >= 388 && ph.textAlign === 'center', `stage ends ${Math.round(ph.stage.b)}, words start ${Math.round(ph.words_.t)}, ${ph.textAlign}`);
  test('phone: no sideways scroll, links on the first screen', over <= 0 && ph.lastLink.b <= 844, `overflow ${over}, last link ${Math.round(ph.lastLink.b)} of 844`);
  const psite = await c.evaluate(SITE);
  test('phone: the sign stays in front of the J, inside the stage', psite.at === null && psite.sign[1] < ph.stage.b && psite.sign[1] > ph.stage.t && psite.stones.every(p => p[1] < ph.stage.b), `sign at ${psite.sign.map(Math.round)}, stage ends ${Math.round(ph.stage.b)}`);

  // 9. reduced motion: built from the first frame; the cycle is a cut, no fall
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.visit(`${URL}?seed=${SEED}`, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(300);
  const rm = await c.evaluate(STATE);
  test('reduced motion: built from the first frame', rm.assembled);
  await c.waitFor("window.__cs.font === 'alfa-slab'", 20000);
  const rc = await c.evaluate(STATE);
  test(`reduced motion: ${HOLD} seconds on, a cut to the next font, whole at once`, rc.font === 'alfa-slab' && rc.assembled && rc.swaps === 1 && rc.phase === 'hold' && Math.max(...rc.away) < 0.005, `${rc.font} ${rc.phase}`);
  const bad = [];
  for (let k = 0; k < 8; k++) {
    c.errors.length = 0;
    await c.visit(URL, 1440, 900);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(200);
    const r = await c.evaluate(STATE);
    if (!r.assembled || r.fallen !== 2 || r.jCount < 36 || c.errors.length) bad.push(r.seed + ': ' + JSON.stringify({ assembled: r.assembled, fallen: r.fallen, j: r.jCount, errors: c.errors }));
  }
  test('8 random seeds build 40, finish, drop 2 stones', !bad.length, bad.join(' | ') || 'all fine');
  const fbad = [];
  for (const font of FONTS) {
    c.errors.length = 0;
    await c.visit(`${URL}?font=${font}&seed=${SEED}`, 1100, 760);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(400);
    const r = await c.evaluate(STATE);
    report.counts[font] = { j: r.jCount, fallen: r.fallen, ms: r.buildMs, fallenFrom: r.fallenFrom, fallenEdge: r.fallenEdge, inside: r.insideCount };
    if (r.font !== font || r.cells !== N || !r.assembled || r.fallen !== 2 || r.jCount < 36 || c.errors.length) fbad.push(`${font}: ` + JSON.stringify({ font: r.font, fallen: r.fallen, j: r.jCount, errors: c.errors }));
    await stageShot(c, r, `font-${font}.png`);
  }
  test('10 fonts build at 40', !fbad.length, fbad.join(' | ') || '10 builds');
  /* every font: both fallen stones come from inside the outline (edge < −0.06), so the silhouette keeps */
  const ibad = FONTS.filter(f => !report.counts[f].fallenEdge.every(e => e < -0.06) && report.counts[f].inside >= 2);
  test('every font: both fallen stones come from inside the outline', !ibad.length, ibad.join(', ') || FONTS.map(f => f + ' ' + report.counts[f].fallenEdge.join('/')).join(', '));
  const sbad = [];
  for (const seed of [SEED, 'in-a', 'in-b', 'in-c', 'in-d', 'in-e']) {
    await c.visit(`${URL}?font=sansita-swashed&seed=${seed}`, 1100, 760);
    await c.waitFor('window.__cs && window.__cs.ready', 120000); await sleep(400);
    const r = await c.evaluate(STATE);
    if (r.fallen !== 2 || !r.fallenEdge.every(e => e < -0.06)) sbad.push(seed + ': edges ' + r.fallenEdge.join(', '));
    if (seed === SEED || seed < 'in-c') await stageShot(c, r, seed === SEED ? 'font-sansita-swashed.png' : `sansita-${seed}.png`);
  }
  test('Sansita: the tail and the whole outline keep, 6 seeds', !sbad.length, sbad.join(' | ') || 'all from inside');

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
  for (const f of ['coming-soon.html', 'jbuilder.js', 'site.js', 'bake/dist.js', ...fs.readdirSync(path.join(here, 'masks')).filter(f => f.endsWith('.png')).sort().map(f => 'masks/' + f), ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
  return h.digest('hex');
}
