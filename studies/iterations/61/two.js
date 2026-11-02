/* Study 61: Take a stone, with a choice (Divya, 2 Nov: "two stones: one which has D and one which has K… people can build the story based on the stone they pick").
   Real stones from the live page's worker and Gummy look. Each pick tells the next thing about that person, in their own order,
   so the visitor decides whose story comes next, and everyone's About comes out different.
   mode 'letters': a D and a K, each made of many stones; picking takes a stone off that letter.
   mode 'carved': two single big stones with the letter cut through; each pick wears that stone down a little. */
import * as THREE from 'three';
import * as look from '../41/looks/gummy.js';
const MODE = document.body.dataset.mode;
const words = await (await fetch('../59/words.json')).json();
const STORY = {
  D: words.D.flatMap(p => p.split(/(?<=\.)\s+(?=[A-Z])/)),
  K: [...words.K, words.Q, ...words.Y.map(([y, t]) => y + ': ' + t)],
};
const NAME = { D: 'Divya', K: 'Kahran' }, HUE = { D: '#f25aa3', K: '#2fc0d8' };
const told = { D: 0, K: 0 };

const canvas = document.getElementById('gl'), stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(24, 1, .1, 60);
const JH = 1.6, FLOOR = -JH / 2 - .2, GAP = 1.02;
const pivot = new THREE.Group(); scene.add(pivot);
const holder = { D: new THREE.Group(), K: new THREE.Group() };
holder.D.position.set(-GAP, -JH / 2, 0); holder.K.position.set(GAP, -JH / 2, 0); pivot.add(holder.D, holder.K);
await look.setup({ THREE, renderer, scene, camera, pieces: [], block: holder.D, pivot, box: { min: new THREE.Vector3(-1.9, -JH / 2, -.3), max: new THREE.Vector3(1.9, JH / 2, .3) } });
const shadowMat = k => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { k: { value: k } },
  vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform float k; varying vec2 v; void main(){ vec2 p = (v - .5) * 2.; gl_FragColor = vec4(.17,.21,.27, exp(-3.2 * dot(p,p)) * k); #include <colorspace_fragment>\n }' });
for (const s of ['D', 'K']) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, .9), shadowMat(.26)); m.rotation.x = -Math.PI / 2; m.position.set(s === 'D' ? -GAP : GAP, FLOOR + .002, 0); scene.add(m); }

// the masks: drawn here, in the page's first font, because the worker takes any mask
async function mask(letter) {
  await document.fonts.load("900 400px 'Rubik'", letter);
  const R = 1024, c = document.createElement('canvas'); c.width = c.height = R; const g = c.getContext('2d');
  if (MODE === 'letters') {
    g.font = "900 " + Math.round(R * .9) + "px 'Rubik'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(letter, R / 2, R * .53);
  } else {
    // a pebble, the letter cut through it
    g.fillStyle = '#000'; g.beginPath();
    const seed = letter === 'D' ? 1.2 : 3.7;
    for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2, r = R * .43 * (1 + .05 * Math.sin(a * 2 + seed) + .035 * Math.sin(a * 3 + seed * 2)); const x = R / 2 + Math.cos(a) * r * 1.02, y = R / 2 + Math.sin(a) * r * .94; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.font = "900 " + Math.round(R * .5) + "px 'Rubik'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, R / 2, R * .525);
  }
  return c.toDataURL('image/png');
}

const pieces = { D: [], K: [] };
function build(letter, url) {
  return new Promise((res, rej) => {
    const w = new Worker('../41/jbuilder.js', { type: 'module' });
    w.onmessage = (e) => {
      const d = e.data;
      if (d.type === 'piece') {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(d.nrm, 3));
        g.setAttribute('ao', new THREE.BufferAttribute(d.ao, 1, true)); g.setIndex(new THREE.BufferAttribute(d.idx, 1));
        g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -c.y, -c.z);
        const m = new THREE.Mesh(g); const col = MODE === 'carved' ? HUE[letter] : d.colour;
        m.userData.colour = new THREE.Color(col); m.userData.hex = col;
        look.dress({ THREE, mesh: m }); m.position.copy(c); holder[letter].add(m);
        pieces[letter].push({ m, home: c.clone(), hex: col, letter, taken: false, t: 0, hover: 0, shake: 0 });
      }
      if (d.type === 'done') { w.terminate(); res(); }
      if (d.type === 'error') rej(new Error(d.message));
    };
    w.postMessage({ seed: 'joyus-' + letter, cells: MODE === 'carved' ? 1 : 22, res: MODE === 'carved' ? 1.1 : .6, field: 'exact', mask: url, layer: false, ...(MODE === 'carved' ? { fluff: 100, dome: 60 } : {}) });
  });
}

const log = document.getElementById('log'), left = document.getElementById('left');
const btn = { D: document.getElementById('pick-d'), K: document.getElementById('pick-k') };
function say() {
  for (const s of ['D', 'K']) { const n = STORY[s].length - told[s]; btn[s].querySelector('small').textContent = n ? n + ' left' : 'all told'; btn[s].disabled = !n; }
  const total = told.D + told.K, all = STORY.D.length + STORY.K.length;
  left.textContent = total ? (total < all ? 'Your order so far. Nobody else has quite this one.' : 'That is all of it, in the order you chose.') : 'Pick a stone. Whichever you pick, you hear from next.';
  window.__told = { ...told };
}
function pick(s, P) {
  if (told[s] >= STORY[s].length) return;
  const text = STORY[s][told[s]++];
  const a = document.createElement('article'); a.style.setProperty('--c', HUE[s]); a.dataset.who = s;
  const w = document.createElement('small'); w.textContent = NAME[s]; const p = document.createElement('p'); p.textContent = text;
  a.append(w, p); log.appendChild(a); a.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  if (MODE === 'carved') {
    const st = pieces[s][0]; if (st) { st.shake = 1; st.size = 1 - .24 * told[s] / STORY[s].length; }
  } else {
    // the stone you touched comes off; if it holds the letter up, the nearest loose one comes instead
    const loose = pieces[s].filter(q => !q.taken).sort((a_, b) => b.home.z - a_.home.z);
    const st = P && !P.taken && loose.slice(0, Math.max(1, STORY[s].length - told[s] + 1)).includes(P) ? P : loose[0];
    if (st) { st.taken = true; st.t = 0; st.from = st.m.position.clone(); st.to = new THREE.Vector3((Math.random() - .5) * 1.1, FLOOR + JH / 2 + .1, .3 + Math.random() * .45); st.axis = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize(); }
  }
  say();
}
window.__pick = s => pick(s);
btn.D.onclick = () => pick('D'); btn.K.onclick = () => pick('K');

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), lean = new THREE.Vector2();
const all = () => [...pieces.D, ...pieces.K];
const hit = (e) => { const b = canvas.getBoundingClientRect(); ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(ptr, camera); const list = all().filter(P => !P.taken); const h = ray.intersectObjects(list.map(P => P.m))[0]; return h && list.find(P => P.m === h.object); };
let over = null;
canvas.addEventListener('pointermove', e => { over = hit(e); canvas.style.cursor = over ? 'pointer' : 'default'; lean.copy(ptr); });
canvas.addEventListener('pointerdown', e => { const P = hit(e); if (P) pick(P.letter, P); });

function fit() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; const t = Math.tan(camera.fov * Math.PI / 360), dist = Math.max(2.5 / (2 * t), 4.3 / (2 * t * camera.aspect)) * 1.02; camera.position.set(0, dist * .1, dist); camera.lookAt(0, -.1, 0); camera.updateProjectionMatrix(); }
fit(); addEventListener('resize', fit);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!still) { pivot.rotation.y += (lean.x * .22 - pivot.rotation.y) * .06; pivot.rotation.x += (-lean.y * .1 - pivot.rotation.x) * .06; }
  for (const P of all()) {
    if (P.taken) {
      if (P.t < 1) { P.t = still ? 1 : Math.min(1, P.t + dt / .95); const t = P.t; P.m.position.lerpVectors(P.from, P.to, t); P.m.position.y = P.from.y + (P.to.y - P.from.y) * t * t + Math.sin(t * Math.PI) * .18; P.m.rotateOnAxis(P.axis, dt * 4 * (1 - t)); }
    } else {
      P.hover += ((P === over ? 1 : 0) - P.hover) * .18;
      P.m.position.z = P.home.z + P.hover * .06;
      P.shake = Math.max(0, P.shake - dt * 2.2);
      const size = (P.size || 1) * (1 + P.hover * .03);
      P.m.scale.setScalar(size + (P.size ? Math.sin(P.shake * 18) * P.shake * .05 : 0));
      if (MODE === 'carved') P.m.rotation.z = still ? 0 : Math.sin(P.shake * 16) * P.shake * .09;
    }
  }
  renderer.render(scene, camera);
});
say();
try { await build('D', await mask('D')); await build('K', await mask('K')); window.__stones = { D: pieces.D.length, K: pieces.K.length }; window.__ready = 1; }
catch (e) { left.textContent = 'Could not build the stones: ' + e.message; window.__failed = e.message; }
