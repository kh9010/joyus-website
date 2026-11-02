// Study 59: About, new spins on what Joyus already has. Each page takes one existing concept and asks it to introduce two people.
// Words whole, from Study 52's words.json. Each page is its own composition. node build.cjs
const fs = require('node:fs');
const path = require('node:path');
const W = JSON.parse(fs.readFileSync(path.join(__dirname, '../52/words.json'), 'utf8'));
const D = W.divya.paras, K = W.kahran.paras, Y = W.kahran.years, Q = W.kahran.quote;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const dHtml = D.map(p => '<p>' + esc(p) + '</p>').join('');
const kHtml = K.map(p => '<p>' + esc(p) + '</p>').join('') + '<p class="q">' + esc(Q) + '</p><ol class="years">' + Y.map(([y, t]) => '<li><b>' + esc(y) + '</b><span>' + esc(t) + '</span></li>').join('') + '</ol>';
const shell = (title, css, body, js, module = true) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${title}</title><link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Rubik:wght@900&display=swap">
<style>
:root{--ink:#2C3544;--soft:#54606F;--fade:#8892A0;--pink:#E91E7B;--cyan:#4FC4CF;--yellow:#F2C94A;--line:#dfe2e6}
*{box-sizing:border-box}html,body{margin:0}body{font:17px/1.55 'Space Grotesk',system-ui,sans-serif;color:var(--ink);background:#fff}
p{margin:0 0 14px}button{font:inherit;color:inherit}:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.q{font-style:italic;color:var(--soft)}
.years{list-style:none;margin:16px 0 0;padding:12px 0 0;border-top:1px solid var(--line);font-size:14px}.years li{display:grid;grid-template-columns:48px 1fr;gap:6px;padding:2px 0}.years b{font-weight:500;color:var(--soft)}
${css}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style></head><body>
${body}
<script${module ? ' type="module"' : ''}>${js}</script></body></html>
`;
const out = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);

// 1 ---- The Voronoi J → it comes apart into a D and a K. The same forty stones.
out('about-1.html', shell('1 / One J, two people', `
.stage{position:relative;width:100%;height:min(66vh,620px);min-height:340px}canvas{position:absolute;inset:0;width:100%;height:100%}
.who{display:grid;grid-template-columns:1fr 1fr;gap:clamp(20px,5vw,64px);padding:0 clamp(20px,5vw,64px) 64px;max-width:1240px;margin:auto}
h2{font:700 clamp(1.5rem,3vw,2.2rem)/1.1 'Space Grotesk';letter-spacing:-.02em;margin:0 0 14px}
.again{position:absolute;right:16px;top:12px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;min-height:44px;cursor:pointer;font-size:14px}
@media(max-width:720px){.who{grid-template-columns:1fr}}
`, `<div class="stage"><canvas id="c" role="img" aria-label="The Joyus J, made of forty stones, comes apart and becomes a D and a K"></canvas><button class="again" id="again" type="button">Again</button></div>
<div class="who"><article><h2>Divya Tak</h2>${dHtml}</article><article><h2>Kahran Singh</h2>${kHtml}</article></div>`, `
import { seedsIn, cut, letterMask, PALETTE } from './voronoi.js';
const R = 460, N = 40;
const J = await letterMask('J', R), Dm = await letterMask('D', R), Km = await letterMask('K', R);
const col = (p, i) => PALETTE[i % 4];
const js = cut(R, R, J, seedsIn(R, R, J, N, 11), col);
const half = Math.floor(js.length / 2);
const ds = cut(R, R, Dm, seedsIn(R, R, Dm, half, 23), col), ks = cut(R, R, Km, seedsIn(R, R, Km, js.length - half, 31), col);
const c = document.getElementById('c'), g = c.getContext('2d');
let t0 = performance.now(); const hold = 1100, dur = 1500;
// each J stone goes to the nearest free stone of the letter on its own side
const order = js.map((s, i) => i).sort((a, b) => js[a].cx - js[b].cx);
const pairs = order.map((i, n) => { const left = n < half, list = left ? ds : ks, idx = left ? n : n - half; return { a: js[i], b: list[idx % list.length], left, delay: (js[i].cy / R) * .32 }; });
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function frame(now) {
  const dpr = devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
  if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const s = Math.min(H / R, W / (R * 2.1));
  const T = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : (now - t0 - hold) / dur;
  for (const p of pairs) {
    const t = ease(Math.max(0, Math.min(1, (T - p.delay) / .68)));
    const ox = W / 2 - R * s / 2, oy = (H - R * s) / 2;
    const tx = (p.left ? W * .27 : W * .73) - R * s / 2;
    const ax = ox + p.a.cx * s, ay = oy + p.a.cy * s, bx = tx + p.b.cx * s, by = oy + p.b.cy * s;
    const arc = Math.sin(t * Math.PI) * -46;
    const x = ax + (bx - ax) * t, y = ay + (by - ay) * t + arc;
    g.globalAlpha = 1 - t; g.drawImage(p.a.canvas, x - p.a.w * s / 2, y - p.a.h * s / 2, p.a.w * s, p.a.h * s);
    g.globalAlpha = t; g.drawImage(p.b.canvas, x - p.b.w * s / 2, y - p.b.h * s / 2, p.b.w * s, p.b.h * s);
  }
  g.globalAlpha = 1; window.__t = T; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.getElementById('again').onclick = () => { t0 = performance.now(); };
window.__ready = js.length;
`));

// 2 ---- The stones → the two of them, in stones. Each stone takes the colour of the photo beneath it.
out('about-2.html', shell('2 / Portraits in stones', `
.pair{display:grid;grid-template-columns:1fr 1fr;gap:clamp(20px,5vw,64px);padding:clamp(24px,5vw,56px);max-width:1240px;margin:auto}
canvas{width:100%;aspect-ratio:4/5;display:block;cursor:pointer}
h2{font:700 clamp(1.5rem,3vw,2.2rem)/1.1 'Space Grotesk';letter-spacing:-.02em;margin:18px 0 12px}
.hint{font-size:13px;color:var(--soft)}
@media(max-width:720px){.pair{grid-template-columns:1fr}canvas{max-width:320px}}
`, `<div class="pair"><article><canvas id="cd" role="img" aria-label="Divya, as a portrait made of stones"></canvas><h2>Divya Tak</h2>${dHtml}</article><article><canvas id="ck" role="img" aria-label="Kahran, as a portrait made of stones"></canvas><h2>Kahran Singh</h2>${kHtml}</article></div>`, `
import { seedsIn, cut } from './voronoi.js';
const W = 400, H = 500;
async function portrait(id, src, n, seed, dark, light) {
  const im = new Image(); im.src = src; await im.decode();
  const o = document.createElement('canvas'); o.width = W; o.height = H; const og = o.getContext('2d', { willReadFrequently: true });
  const r = Math.max(W / im.width, H / im.height); og.drawImage(im, (W - im.width * r) / 2, (H - im.height * r) / 2, im.width * r, im.height * r);
  const px = og.getImageData(0, 0, W, H).data;
  const colourAt = p => { let R = 0, G = 0, B = 0, c = 0; for (let y = -9; y <= 9; y += 3) for (let x = -9; x <= 9; x += 3) { const X = Math.max(0, Math.min(W - 1, p.x + x | 0)), Y = Math.max(0, Math.min(H - 1, p.y + y | 0)), k = (Y * W + X) * 4; R += px[k]; G += px[k + 1]; B += px[k + 2]; c++; } const v = Math.min(1, Math.max(0, ((R + G + B) / (3 * c * 255) - .08) / .78)), mix = (a, b) => Math.round(a + (b - a) * v); return 'rgb(' + mix(dark[0], light[0]) + ',' + mix(dark[1], light[1]) + ',' + mix(dark[2], light[2]) + ')'; };
  const all = () => true;
  const st = cut(W, H, all, seedsIn(W, H, all, n, seed), colourAt, .55, .3);
  const c = document.getElementById(id); c.width = W * 2; c.height = H * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const off = st.map(() => ({ x: 0, y: 0, a: 0 }));
  function draw() { g.clearRect(0, 0, W, H); st.forEach((s, i) => { const o2 = off[i]; g.drawImage(s.canvas, s.x + o2.x, s.y + o2.y); }); }
  draw();
  // a stone moved by the pointer floats away from it and settles back, as the live J leans
  let mx = -999, my = -999;
  c.addEventListener('pointermove', e => { const b = c.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width * W; my = (e.clientY - b.top) / b.height * H; });
  c.addEventListener('pointerleave', () => { mx = my = -999; });
  (function loop() { let moved = false; st.forEach((s, i) => { const o2 = off[i], dx = s.cx - mx, dy = s.cy - my, d = Math.hypot(dx, dy), f = d < 60 ? (60 - d) / 60 * 12 : 0, tx = d ? dx / d * f : 0, ty = d ? dy / d * f : 0; const nx = o2.x + (tx - o2.x) * .14, ny = o2.y + (ty - o2.y) * .14; if (Math.abs(nx - o2.x) + Math.abs(ny - o2.y) > .01) moved = true; o2.x = nx; o2.y = ny; }); if (moved) draw(); requestAnimationFrame(loop); })();
  return st.length;
}
const a = await portrait('cd', '../../../images/divya.jpg', 520, 5, [90, 20, 110], [255, 214, 232]);
const b = await portrait('ck', '../../../images/kahran.jpg', 520, 9, [16, 62, 92], [214, 244, 248]);
window.__ready = a + b;
`));

// 3 ---- Voronoi → the page itself. Every thing we say about ourselves gets a cell; the one you touch grows until you can read it.
const items = [...D.map(t => ({ w: 'd', t })), ...K.map(t => ({ w: 'k', t })), { w: 'k', t: Q }];
out('about-3.html', shell('3 / The page is the diagram', `
html,body{height:100%;overflow:hidden}#v{position:relative;width:100vw;height:100dvh;background:var(--ink)}
.cell{position:absolute;inset:0;transition:clip-path .55s cubic-bezier(.3,1.1,.4,1);cursor:pointer;border:0;background:var(--bg);text-align:left;padding:0;font:inherit;color:var(--fg)}
.txt{position:absolute;overflow:hidden;font-size:15px;line-height:1.45;transition:left .55s,top .55s,width .55s,height .55s,opacity .3s}
.cell.on .txt{font-size:clamp(14px,1.35vw,18px);overflow:auto}
.who{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:4px}
`, `<div id="v" role="list"></div>`, `
import { cells } from './voronoi.js';
const I = ${JSON.stringify(items)};
const COL = { d: ['#f25aa3', '#fff', '#fbd6e8', '#2C3544', '#f5c63c', '#2C3544', '#7d55d4', '#fff'], k: ['#2fc0d8', '#10303a', '#d7f2f5', '#2C3544', '#7d55d4', '#fff', '#f5c63c', '#2C3544'] };
const v = document.getElementById('v');
const seeds = I.map((_, i) => { const a = i * 2.399963, r = Math.sqrt((i + .6) / I.length) * .46; return { hx: .5 + Math.cos(a) * r, hy: .5 + Math.sin(a) * r }; });
let active = 0;
const els = I.map((it, i) => {
  const b = document.createElement('button'); b.className = 'cell'; b.type = 'button'; b.setAttribute('role', 'listitem');
  const c = COL[it.w]; const n = i % 4; b.style.setProperty('--bg', c[n * 2]); b.style.setProperty('--fg', c[n * 2 + 1]);
  b.innerHTML = '<span class="txt"><span class="who">' + (it.w === 'd' ? 'Divya' : 'Kahran') + '</span></span>';
  b.querySelector('.txt').appendChild(document.createTextNode(it.t));
  b.addEventListener('click', () => { active = i; layout(); });
  b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { active = i; layout(); } });
  b.addEventListener('focus', () => { active = i; layout(); });
  v.appendChild(b); return b;
});
function layout() {
  const W = innerWidth, H = innerHeight;
  // the touched cell's seed stays; the others are pushed away from it, so its cell grows
  const a = seeds[active];
  const pts = seeds.map((s, i) => {
    if (i === active) return { x: Math.min(.72, Math.max(.28, s.hx)) * W, y: Math.min(.7, Math.max(.3, s.hy)) * H };
    const c = { x: Math.min(.72, Math.max(.28, a.hx)), y: Math.min(.7, Math.max(.3, a.hy)) };
    const dx = s.hx - c.x, dy = s.hy - c.y, d = Math.hypot(dx, dy) || .01;
    const push = (W < 700 ? .62 : .46) + d * .5;
    return { x: (c.x + dx / d * push) * W, y: (c.y + dy / d * push) * H };
  });
  const polys = cells(pts, W, H);
  polys.forEach((p, i) => {
    const b = els[i];
    b.style.clipPath = 'polygon(' + p.map(q => q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px').join(',') + ')';
    b.classList.toggle('on', i === active); b.setAttribute('aria-current', i === active);
    // the text sits in a box inside the cell: the largest upright box around its seed that stays in the polygon
    const inside = (x, y) => { let c = false; for (let j = 0, k = p.length - 1; j < p.length; k = j++) { const [xi, yi] = p[j], [xk, yk] = p[k]; if ((yi > y) !== (yk > y) && x < (xk - xi) * (y - yi) / (yk - yi) + xi) c = !c; } return c; };
    const cx = p.reduce((s, q) => s + q[0], 0) / p.length, cy = p.reduce((s, q) => s + q[1], 0) / p.length;
    let hw = 8, hh = 8, grew = true;
    while (grew) { grew = false; const ratio = W < 700 ? .7 : 1.25; const nw = hw + 6 * ratio, nh = hh + 6;
      if ([[cx - nw, cy - nh], [cx + nw, cy - nh], [cx + nw, cy + nh], [cx - nw, cy + nh], [cx, cy - nh], [cx, cy + nh], [cx - nw, cy], [cx + nw, cy]].every(q => inside(q[0], q[1]))) { hw = nw; hh = nh; grew = true; } }
    const t = b.querySelector('.txt');
    t.style.left = (cx - hw + 6) + 'px'; t.style.top = (cy - hh + 6) + 'px'; t.style.width = (2 * hw - 12) + 'px'; t.style.height = (2 * hh - 12) + 'px';
    t.style.opacity = hw * hh > 900 ? 1 : 0;
  });
  window.__active = active; window.__polys = polys.length;
}
layout(); addEventListener('resize', layout); window.__ready = I.length; window.__set = i => { active = i; layout(); };
`));

// 4 ---- The road-works sign → a site notice board, the kind that names who is responsible for the hole.
out('about-4.html', shell('4 / The site notice', `
body{background:#fff}main{max-width:1100px;margin:auto;padding:clamp(24px,5vw,56px)}
.sign{width:clamp(110px,16vw,170px);aspect-ratio:1;transform:rotate(45deg);background:var(--yellow);border:6px solid var(--ink);border-radius:18px;margin:26px auto 44px;display:grid;place-items:center}
.sign svg{transform:rotate(-45deg);width:62%;height:62%}
.board{border:5px solid var(--ink);border-radius:10px;overflow:hidden}
.board h1{margin:0;background:var(--ink);color:#fff;font:700 clamp(1.1rem,2.6vw,1.8rem)/1.2 'Space Grotesk';letter-spacing:.14em;text-transform:uppercase;padding:14px 20px;text-align:center}
.row{display:grid;grid-template-columns:clamp(100px,16vw,190px) 1fr;border-top:3px solid var(--ink)}
.row>b{padding:14px 18px;background:#fbf3d4;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.row>div{padding:14px 20px}
.draft{font-size:13px;color:var(--soft);margin-top:12px}
.heap{display:flex;justify-content:center;gap:4px;margin-top:22px}.heap i{width:46px;height:32px;border-radius:44% 56% 52% 48%/54% 46% 56% 44%;box-shadow:inset -4px -5px 9px rgba(0,0,0,.16),inset 4px 5px 8px rgba(255,255,255,.55)}
@media(max-width:560px){.row{grid-template-columns:1fr}}
`, `<main><div class="sign" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#2C3544" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="5" r="2"/><path d="M10 8l-1 6 3 3 1 5M9 14l-3 8M10 9l5 3 4-4M15 21h6"/></svg></div>
<section class="board"><h1>Joyus: works in progress</h1>
<div class="row"><b>Site manager</b><div><strong>Divya Tak</strong>${dHtml}</div></div>
<div class="row"><b>Site manager</b><div><strong>Kahran Singh</strong>${kHtml}</div></div>
<div class="row"><b>Enquiries</b><div>hello@joyus.studio</div></div></section>
<div class="heap" aria-hidden="true"><i style="background:#f25aa3"></i><i style="background:#2fc0d8"></i><i style="background:#f5c63c"></i><i style="background:#7d55d4"></i></div>
<p class="draft">The board's labels are drafts, for Kahran.</p></main>`, `window.__ready = 1;`, false));

// 5 ---- Perpetuity → a small puzzle of the two of them. Tap two pieces to swap; solving it opens the About.
out('about-5.html', shell('5 / Put us back together', `
main{max-width:980px;margin:auto;padding:clamp(20px,4vw,48px)}
h1{font:700 clamp(1.8rem,4vw,3rem)/1.05 'Space Grotesk';letter-spacing:-.03em;margin:0 0 6px}
.board{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin:18px 0;touch-action:manipulation;max-width:760px}
.p{aspect-ratio:1;border:0;padding:0;cursor:pointer;background-repeat:no-repeat;transition:transform .18s;border-radius:6px}
.p.sel{outline:4px solid var(--pink);transform:scale(.94);outline-offset:-2px}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tools button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:9px 16px;min-height:44px;cursor:pointer}
.who{display:none;grid-template-columns:1fr 1fr;gap:clamp(20px,4vw,56px);margin-top:24px}.done .who{display:grid}
h2{font:700 1.7rem/1.1 'Space Grotesk';margin:0 0 12px}
@media(max-width:640px){.who,.done .who{grid-template-columns:1fr}}
`, `<main id="m"><h1>Put us back together.</h1><p>Tap two pieces to swap them.</p><div class="board" id="b" aria-label="A puzzle of Divya and Kahran"></div><div class="tools"><span id="left"></span><button id="skip" type="button">Just tell me</button></div>
<div class="who"><article><h2>Divya Tak</h2>${dHtml}</article><article><h2>Kahran Singh</h2>${kHtml}</article></div></main>`, `
const C = 6, R = 4, b = document.getElementById('b'), m = document.getElementById('m'), left = document.getElementById('left');
// the two photos side by side: three columns each
const ims = ['../../../images/divya.jpg', '../../../images/kahran.jpg'];
const seq = []; for (let i = 0; i < C * R; i++) seq.push(i);
let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
for (let i = seq.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
let sel = null;
const els = seq.map(() => { const e = document.createElement('button'); e.type = 'button'; e.className = 'p'; b.appendChild(e); return e; });
function draw() {
  els.forEach((e, at) => { const t = seq[at], r = Math.floor(t / C), c = t % C, who = c < 3 ? 0 : 1, cc = who ? c - 3 : c;
    e.style.backgroundImage = 'url(' + ims[who] + ')'; e.style.backgroundSize = '300% 400%'; e.style.backgroundPosition = (cc * 50) + '% ' + (r * 33.333) + '%';
    e.setAttribute('aria-label', 'Piece ' + (at + 1) + (t === at ? ', in place' : '')); e.classList.toggle('sel', sel === at); });
  const wrong = seq.filter((t, at) => t !== at).length;
  left.textContent = wrong ? wrong + ' pieces out of place' : 'There we are.';
  if (!wrong) m.classList.add('done');
  window.__wrong = wrong;
}
els.forEach((e, at) => e.addEventListener('click', () => { if (sel === null) sel = at; else { [seq[sel], seq[at]] = [seq[at], seq[sel]]; sel = null; } draw(); }));
document.getElementById('skip').onclick = () => { for (let i = 0; i < seq.length; i++) seq[i] = i; sel = null; draw(); };
draw(); window.__ready = 1;
`, false));

// 6 ---- The comics → the About as a comic. He writes; she draws. These panels wait for her drawings; every word in the balloons is already theirs.
const panels = [
  { w: 'k', t: K[0] }, { w: 'd', t: D[0] }, { w: 'k', t: K[1] }, { w: 'd', t: D[1] }, { w: 'k', t: K[2] }, { w: 'k', t: K[3] }, { w: 'k', t: K[4] }, { w: 'k', t: Q }, { w: 'k', t: K[5] },
];
out('about-6.html', shell('6 / A comic of us', `
main{max-width:1160px;margin:auto;padding:clamp(20px,4vw,48px)}
h1{font:700 clamp(1.8rem,4vw,3rem)/1.05 'Space Grotesk';letter-spacing:-.03em;margin:0 0 18px}
.strip{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;grid-auto-flow:dense}
.panel{border:3px solid var(--ink);padding:14px;min-height:240px;position:relative;background:#fbfaf6;display:flex;flex-direction:column;justify-content:space-between;gap:14px;grid-column:span 2}
.panel.w3{grid-column:span 3}.panel.w4{grid-column:span 4}
.bal{background:#fff;border:2px solid var(--ink);border-radius:18px;padding:12px 14px;font-size:14.5px;line-height:1.42;position:relative}
.bal::after{content:'';position:absolute;bottom:-12px;left:30px;width:16px;height:16px;background:#fff;border-right:2px solid var(--ink);border-bottom:2px solid var(--ink);transform:rotate(45deg) skew(12deg,12deg)}
.bal.k{border-radius:6px}
.art{min-height:90px;flex:1;border:1.5px dashed var(--fade);display:grid;place-items:center;color:var(--fade);font-size:12px;margin-top:16px;text-align:center}
@media(max-width:720px){.strip{grid-template-columns:1fr}.panel,.panel.w3,.panel.w4{grid-column:auto}}
`, `<main><h1>Kahran writes. Divya draws.</h1><div class="strip">${panels.map((p, i) => {
    const big = p.t.length > 300, wide = big ? ' w4' : p.t.length > 180 ? ' w3' : '';
    return '<div class="panel' + wide + '"><div class="bal ' + p.w + '">' + esc(p.t) + '</div><div class="art">Divya draws ' + (p.w === 'd' ? 'herself' : 'Kahran') + ' here</div></div>';
  }).join('')}</div></main>`, `window.__ready = 1;`, false));
fs.writeFileSync(path.join(__dirname, 'words.json'), JSON.stringify({ _: 'From Study 52', D, K, Y, Q }, null, 1));
console.log('six spins written');
