/* Study 67: the trail, on the brand's real stones (Divya, 2 Nov: "I like the trail idea... just make one model").
   Study 65's trail cut flat shapes and coloured them i % 4, so neighbours clashed; the brand lab's rule is true 3D cells, neighbours distinct.
   Three decisions:
   1. The live worker and Gummy look (solid-geometry.js from brand-lab), as Take a stone A: real stones, the same J procedure.
   2. A letter has exactly one stone per thing that person has to say. When the letter is gone, they have told you everything.
   3. brand-lab/DESIGN.md: "colourful pieces that have identities of their own and also belong to a whole... how Divya sees herself, Kahran and their studio."
      So the last thing the stones do is go on down the page and become the J. */
import * as THREE from 'three';
import * as look from '../41/looks/gummy.js';

const words = await (await fetch('../59/words.json')).json();
const STORY = {
  D: words.D.flatMap(p => p.split(/(?<=\.)\s+(?=[A-Z])/)),
  K: [...words.K, words.Q, ...words.Y.map(([y, t]) => y + ': ' + t)],
};
const TOTAL = STORY.D.length + STORY.K.length;
const NAME = { D: 'Divya', K: 'Kahran' };
const told = { D: 0, K: 0 };
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = id => document.getElementById(id);
const canvas = $('gl'), top_ = $('top'), trail = $('trail'), end = $('end');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(24, 1, .1, 60);
camera.position.z = 5;
const sheet = new THREE.Group(); scene.add(sheet);
await look.setup({ THREE, renderer, scene, camera, pieces: [], block: sheet, pivot: sheet, box: new THREE.Box3() });

// the one coordinate system: page pixels. U = how many pixels make one world unit at z = 0.
let VW = 1, VH = 1, U = 1;
const toWorld = (px, py, m) => m.position.set((px - VW / 2) / U, (VH / 2 - py) / U, m.position.z);
function fit() {
  VW = innerWidth; VH = innerHeight;
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.setSize(VW, VH, false);
  camera.aspect = VW / VH; camera.updateProjectionMatrix();
  U = VH / (2 * 5 * Math.tan(camera.fov * Math.PI / 360));
  kick();
}

const shadowGeo = new THREE.PlaneGeometry(1, 1);
const shadowMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { k: { value: .2 } },
  vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float k; varying vec2 v;
void main(){
  vec2 p = (v - .5) * 2.;
  gl_FragColor = vec4(.17,.21,.27, exp(-3.4 * dot(p,p)) * k);
  #include <colorspace_fragment>
}` });

function mask(letter) {
  const R = 1024, c = document.createElement('canvas'); c.width = c.height = R; const g = c.getContext('2d');
  g.font = "900 " + Math.round(R * .9) + "px 'Rubik'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(letter, R / 2, R * .53);
  return c.toDataURL('image/png');
}

const build = (letter, cells, seed) => new Promise((res, rej) => {
  const out = [], w = new Worker('../41/jbuilder.js', { type: 'module' });
  w.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'piece') {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(d.nrm, 3));
      g.setAttribute('ao', new THREE.BufferAttribute(d.ao, 1, true)); g.setIndex(new THREE.BufferAttribute(d.idx, 1));
      g.computeBoundingBox(); const home = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-home.x, -home.y, -home.z);
      const size = g.boundingBox.getSize(new THREE.Vector3());
      const m = new THREE.Mesh(g); m.userData.colour = new THREE.Color(d.colour); look.dress({ THREE, mesh: m });
      const sh = new THREE.Mesh(shadowGeo, shadowMat()); sh.renderOrder = -1;
      sheet.add(sh, m);
      out.push({ m, sh, home, letter, hex: d.colour, dim: Math.max(size.x, size.y), state: 'home', t: 0, hover: 0, tilt: (Math.random() - .5) * .5 });
    }
    if (d.type === 'done') { w.terminate(); res(out); }
    if (d.type === 'error') rej(new Error(d.message));
  };
  w.postMessage({ seed, cells, res: .6, field: 'exact', mask: mask(letter), layer: false });
});

const LET = { D: [], K: [] }; let J = [];
// where things are, in page pixels
const page = el => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 + scrollY, w: b.width, h: b.height, top: b.top + scrollY }; };
function letterFrame(k) {
  const t = page(top_), head = VW > 700 ? 92 : 78;
  const L = Math.min((t.h - head - (VW > 700 ? 40 : 8)) * .94, VW * .46), cy = t.top + head + (t.h - head) / 2;
  return { x: VW * (k === 'D' ? .29 : .71), y: cy, s: L / 1.6 };
}
function jFrame() { const e = page(end); const L = Math.min((e.h - 210), VW * .7); return { x: VW / 2, y: e.top + 40 + L / 2, s: L / 1.6 }; }
const inFrame = (f, h) => ({ x: f.x + h.x * f.s, y: f.y - (h.y - .8) * f.s, s: f.s });
const landed = P => { const a = page(P.at); const sway = VW > 700 ? (P.letter === 'D' ? -1 : 1) * 16 : 0; return { x: a.x + sway, y: a.y, s: Math.min(a.h, 80) * (VW > 700 ? 1 : .9) / P.dim }; };
const place = (P, x, y, s, lift = 0) => {
  toWorld(x, y, P.m); P.m.position.z = lift; P.m.scale.setScalar(s / U);
  const r = P.dim * s;
  toWorld(x + r * .03, y + r * .14, P.sh); P.sh.position.z = -.5; P.sh.scale.setScalar(r * 1.75 / U);
};
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function flyTo(P, state, to, dur, delay = 0) { P.state = state; P.t = -delay; P.dur = dur; P.from = { ...P.now }; P.to = to; P.spin = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(5); kick(); }

let busy = false;
function kick() { if (!busy) { busy = true; requestAnimationFrame(frame); } }
let last = performance.now(), over = null;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  sheet.position.y = scrollY / U;
  let moving = false;
  for (const P of [...LET.D, ...LET.K]) {
    let x, y, s, lift = 0;
    if (P.state === 'home') {
      const f = inFrame(letterFrame(P.letter), P.home); x = f.x; y = f.y; s = f.s;
      P.hover += ((P === over ? 1 : 0) - P.hover) * .2; if (Math.abs((P === over ? 1 : 0) - P.hover) > .01) moving = true;
      s *= 1 + P.hover * .04; lift = P.hover * .08;
    } else if (P.state === 'trail' || P.state === 'gather') {
      P.t = still ? 1 : P.t + dt / P.dur; moving = moving || P.t < 1;
      const t = ease(Math.max(0, Math.min(1, P.t)));
      const to = P.state === 'trail' ? landed(P) : P.to();
      x = P.from.x + (to.x - P.from.x) * t; y = P.from.y + (to.y - P.from.y) * t; s = P.from.s + (to.s - P.from.s) * t;
      lift = Math.sin(t * Math.PI) * .4;
      P.m.rotation.set(P.spin.x * (1 - t), P.spin.y * (1 - t), (P.spin.z + (P.state === 'trail' ? P.tilt : 0)) * (1 - t) + (P.state === 'trail' ? P.tilt * t : 0));
      if (P.state === 'gather') { P.m.material.color.copy(P.c0).lerp(P.c1, t); if (P.t >= 1) { P.state = 'done'; P.m.visible = P.sh.visible = false; P.piece.m.visible = P.piece.sh.visible = true; } }
      else if (P.t >= 1) P.state = 'rest';
      P.sh.material.uniforms.k.value = .2 * (1 - Math.sin(t * Math.PI) * .8);
    } else if (P.state === 'rest') { const l = landed(P); x = l.x; y = l.y; s = l.s; }
    if (x !== undefined) { P.now = { x, y, s }; place(P, x, y, s, lift); }
  }
  for (const Q of J) if (Q.m.visible) { const f = inFrame(jFrame(), Q.home); place(Q, f.x, f.y, f.s); }
  renderer.render(scene, camera);
  if (moving) requestAnimationFrame(frame); else busy = false;
}

function counts() {
  for (const k of ['D', 'K']) { const n = STORY[k].length - told[k], b = $('pick-' + k); b.querySelector('small').textContent = n; b.disabled = !n; }
  $('all').disabled = told.D + told.K >= TOTAL;
  window.__told = told.D + told.K;
}
function take(k, stone) {
  if (told[k] >= STORY[k].length) return;
  const loose = LET[k].filter(P => P.state === 'home').sort((a, b) => a.home.y - b.home.y);
  const P = stone && stone.state === 'home' ? stone : loose[0]; if (!P) return;
  const text = STORY[k][told[k]++];
  const step = document.createElement('div'); step.className = 'step'; step.dataset.who = k; step.style.setProperty('--c', P.hex);
  const at = document.createElement('div'); at.className = 'at'; const dot = document.createElement('div'); dot.className = 'dot'; at.append(dot);
  const say = document.createElement('div'); say.className = 'say';
  const w = document.createElement('small'); w.textContent = NAME[k]; say.append(w, document.createTextNode(text));
  step.append(at, say); trail.appendChild(step);
  P.at = at; P.step = step;
  flyTo(P, 'trail', null, .85);
  counts();
  if (!allMode) step.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
  if (told.D + told.K === TOTAL) setTimeout(gather, still ? 0 : (allMode ? 1000 : 1500));
}
let gathered = false;
function gather() {
  if (gathered) return; gathered = true;
  end.hidden = false; document.querySelector('.keys').hidden = true;
  const stones = [...LET.D, ...LET.K].filter(P => P.at);
  stones.sort((a, b) => a.at.getBoundingClientRect().top - b.at.getBoundingClientRect().top);
  stones.forEach((P, i) => {
    const Q = J[i % J.length]; P.piece = Q;
    P.c0 = new THREE.Color(P.hex); P.c1 = new THREE.Color(Q.hex);
    P.step.classList.add('gone');
    flyTo(P, 'gather', () => inFrame(jFrame(), Q.home), 1.25, i * .075);
  });
  window.__gathered = stones.length;
  end.scrollIntoView({ block: 'end', behavior: still ? 'auto' : 'smooth' });
}
let allMode = false;
function tellAll() {
  allMode = true; const q = [];
  for (let i = told.D, j = told.K; i < STORY.D.length || j < STORY.K.length;) { if (i < STORY.D.length) { q.push('D'); i++; } if (j < STORY.K.length) { q.push('K'); j++; } }
  q.forEach((k, i) => setTimeout(() => take(k), still ? 0 : i * 110));
}
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const pick = e => {
  ptr.set(e.clientX / VW * 2 - 1, -e.clientY / VH * 2 + 1); ray.setFromCamera(ptr, camera);
  const hits = [...LET.D, ...LET.K].filter(P => P.state === 'home');
  const h = ray.intersectObjects(hits.map(P => P.m))[0];
  return h ? hits.find(P => P.m === h.object) : null;
};
addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const P = pick(e); if (P !== over) { over = P; document.body.style.cursor = P ? 'pointer' : ''; kick(); } }, { passive: true });
addEventListener('click', e => { if (e.target.closest('button')) return; const P = pick(e); if (P) take(P.letter, P); });
for (const k of ['D', 'K']) $('pick-' + k).onclick = () => take(k);
$('all').onclick = tellAll;
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', fit);
window.__pick = take; window.__all = tellAll;
counts(); fit();

await document.fonts.load("900 400px 'Rubik'", 'DKJ');
try {
  LET.D = await build('D', STORY.D.length, 'joyus-D');
  LET.K = await build('K', STORY.K.length, 'joyus-K');
  J = await build('J', TOTAL, 'joyus-J');
  for (const Q of J) { Q.m.visible = Q.sh.visible = false; }
  window.__stones = { D: LET.D.length, K: LET.K.length, J: J.length, lines: { D: STORY.D.length, K: STORY.K.length } };
  window.__ready = 1; kick();
} catch (e) { $('say-where').textContent = 'Could not build the stones: ' + e.message; window.__failed = e.message; }
