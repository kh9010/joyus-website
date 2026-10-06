// Study 16's test: drives coming-soon.html in headless Chrome and writes
// report.json (read by check.cjs) plus the screenshots in img/.
// Needs the studies server (node studies/server.cjs).
//   node studies/iterations/16/shoot.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'http://127.0.0.1:8794/studies/iterations/16/coming-soon.html';
const img = (f) => path.join(here, 'img', f);
const report = { tests: [] };
const test = (name, pass, detail) => { report.tests.push({ name, pass: !!pass, detail }); console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail ? '  (' + detail + ')' : '')); };

// how far each piece sits from where it belongs, and how the J is turned
const STATE = `(() => { const T = window.__cs; return {
  assembled: T.assembled,
  away: T.pieces.map(P => P.m.position.distanceTo(P.home)),
  turn: [T.pivot.rotation.x, T.pivot.rotation.y],
  spread: T.pieces.map(P => P.off.length()) }; })()`;
const move = (c, x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });

const c = await chrome();
try {
  // 1. desktop: the pieces come together
  await c.visit(URL, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 60000);
  await sleep(450);
  const early = await c.evaluate(STATE);
  await c.shot(img('assembling.png'));
  test('pieces start apart', Math.max(...early.away) > 0.5, 'furthest ' + Math.max(...early.away).toFixed(2));
  const t0 = Date.now();
  await c.waitFor('window.__cs.assembled', 20000);
  const assembledIn = (Date.now() - t0 + 450) / 1000;
  await sleep(300);
  const home = await c.evaluate(STATE);
  await c.shot(img('assembled.png'));
  test('pieces come together into the J', Math.max(...home.away) < 0.005, 'after ~' + assembledIn.toFixed(1) + ' s, furthest ' + Math.max(...home.away).toFixed(4));
  const baked = JSON.parse(fs.readFileSync(path.join(here, 'j.json'), 'utf8')).pieces.length;
  test('every baked piece is on stage', home.away.length === baked, home.away.length + ' of ' + baked);

  // 2. the pointer moves; the J leans and the pieces follow, each its own amount
  await move(c, 1300, 120);
  await sleep(1500);
  const moved = await c.evaluate(STATE);
  await c.shot(img('pointer.png'));
  test('the J turns toward the pointer', moved.turn[1] > 0.2 && moved.turn[0] < -0.05, 'rotation x ' + moved.turn[0].toFixed(2) + ', y ' + moved.turn[1].toFixed(2));
  const sp = moved.spread, min = Math.min(...sp), max = Math.max(...sp);
  test('pieces follow by different amounts', min > 0.02 && max / min > 1.5, 'drift ' + min.toFixed(3) + '–' + max.toFixed(3));
  await move(c, 720, 450);
  await sleep(2000);
  const back = await c.evaluate(STATE);
  test('and settle back when the pointer centres', Math.max(...back.spread) < 0.01, 'drift ' + Math.max(...back.spread).toFixed(4));

  // 3. the words and the three links
  const links = await c.evaluate(`[...document.querySelectorAll('.links a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))`);
  report.links = links;
  test('three links: deck, Divya, Kahran', links.length === 3 && /deck/i.test(links[0].text) && /Divya/.test(links[1].text) && /Kahran/.test(links[2].text), links.map(l => l.text).join(' | '));
  const deck = await c.evaluate(`fetch(document.querySelector('.links a').href, { method: 'HEAD' }).then(r => r.status)`);
  test('the deck link opens a file', deck === 200, 'HTTP ' + deck);

  // 4. phone
  await c.visit(URL, 390, 844);
  await c.waitFor('window.__cs && window.__cs.assembled', 30000);
  await sleep(300);
  await c.shot(img('phone.png'));
  const phone = await c.evaluate(`({ over: document.documentElement.scrollWidth - innerWidth, lastLink: document.querySelector('.links li:last-child a').getBoundingClientRect().bottom, h: innerHeight })`);
  test('phone: no sideways scroll', phone.over <= 0, 'overflow ' + phone.over + 'px');
  test('phone: all links on the first screen', phone.lastLink <= phone.h, 'last link ends at ' + Math.round(phone.lastLink) + ' of ' + phone.h);

  // 5. reduced motion: the J is simply there
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.visit(URL, 1440, 900);
  await c.waitFor('window.__cs && window.__cs.ready', 60000);
  await sleep(200);
  const rm = await c.evaluate(STATE);
  test('reduced motion: assembled from the first frame', rm.assembled && Math.max(...rm.away) < 0.005);

  test('no JavaScript errors', c.errors.length === 0, c.errors.join(' / ') || 'none');
} catch (e) {
  test('run finished', false, e.message);
} finally { c.close(); }

// the report carries a hash of what it tested, so a stale report fails check.cjs
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'j.json']) h.update(fs.readFileSync(path.join(here, f)));
report.hash = h.digest('hex');
report.when = new Date().toISOString();
fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 2));
const failed = report.tests.filter(t => !t.pass).length;
console.log(failed ? failed + ' failed' : 'all passed');
process.exitCode = failed ? 1 : 0;
