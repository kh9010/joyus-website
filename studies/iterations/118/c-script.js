// Type as filling. The box is there first, empty. One sentence, one typeface (Roboto Flex, its width and weight free).
// Every line stretches to the full width of the box and together the lines take its full height: no line is the
// headline, and nothing is left over. Drag the box to any shape and the same words fill it again. They may break
// between any two words, so a wide box gets few long lines and a tall one many short ones; of all the ways to break
// them that fill the box without stretching a letter, it takes the one whose letters are nearest their normal width.
// The words are the deck's first page: "We design, we build, we manage, we market, we advise, we grow."
const CLAUSES = ['We design,', 'we build,', 'we manage,', 'we market,', 'we advise,', 'we grow.'];
const WORDS = CLAUSES.join(' ').split(' ');
const WGHT = [900, 300, 700, 200, 800, 500], wg = i => WGHT[i % WGHT.length];
const CAP = .711, GAP = .09, LO = 25, HI = 151;      // cap height of the face and the space between lines, in ems; the face's range of widths
const box = document.getElementById('box'), grip = document.getElementById('grip'), probe = document.getElementById('probe');
const q = new URLSearchParams(location.search), still = q.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
await Promise.all(WGHT.map(w => document.fonts.load(w + ' 200px "Roboto Flex"', 'WE')));
const measure = (text, weight, wd) => { probe.style.fontWeight = weight; probe.style.fontStretch = wd + '%'; probe.textContent = text; const r = document.createRange(); r.selectNodeContents(probe); return r.getBoundingClientRect().width / 200; };

/* ---------- an estimate, for choosing where to break: each word's width at six widths of the face, in each weight ---------- */
const ANCH = [25, 50, 75, 100, 125, 151], table = {};
for (const w of WGHT) table[w] = ANCH.map(wd => { const sp = measure('n n', w, wd) - 2 * measure('n', w, wd), pre = [0]; WORDS.forEach(t => pre.push(pre[pre.length - 1] + measure(t, w, wd))); return { sp, pre }; });
function guess(a, b, w, wd) {   // ems wide: words a..b-1 on one line
  let k = 0; while (k < ANCH.length - 2 && wd > ANCH[k + 1]) k++;
  const t = (wd - ANCH[k]) / (ANCH[k + 1] - ANCH[k]), f = r => r.pre[b] - r.pre[a] + r.sp * (b - a - 1);
  return f(table[w][k]) * (1 - t) + f(table[w][k + 1]) * t;
}
const BREAKS = []; for (let m = 0; m < 1 << (WORDS.length - 1); m++) { const cuts = [0]; for (let i = 0; i < WORDS.length - 1; i++) if (m >> i & 1) cuts.push(i + 1); cuts.push(WORDS.length); BREAKS.push(cuts); }
// for one way of breaking: the width of the face at which the lines, each as wide as the box, are together as tall as it
function solve(W, H, n, wide) {
  const tall = wd => { let t = 0, s = 0; for (let i = 0; i < n; i++) { s = W / wide(i, wd); t += s * (CAP + GAP); } return t - s * GAP; };
  let lo = LO, hi = HI;
  if (tall(lo) <= H) hi = lo; else if (tall(hi) >= H) lo = hi; else for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; if (tall(mid) > H) lo = mid; else hi = mid; }
  const wd = (lo + hi) / 2; return { wd, squash: H / tall(wd) };   // squash is 1 unless the box is beyond what the face can reach
}
function choose(W, H) {
  let best = null, score = Infinity;
  for (const cuts of BREAKS) {
    const g = solve(W, H, cuts.length - 1, (i, wd) => guess(cuts[i], cuts[i + 1], wg(i), wd));
    // a line that ends on "we" leaves its verb behind: allowed, but only when nothing else fills the box
    let split = 0; for (let i = 1; i < cuts.length; i++) if (!/[,.]$/.test(WORDS[cuts[i] - 1])) split++;
    const sc = Math.abs(Math.log(g.squash)) * 50 + split * .6 + Math.abs(g.wd - 100) / 100;
    if (sc < score) { score = sc; best = cuts; }
  }
  return best.slice(0, -1).map((a, i) => WORDS.slice(a, best[i + 1]).join(' '));
}
/* ---------- the exact setting, measured, for the breaking chosen ---------- */
let LINES = [], els = [], shown = 0, state = null;
const memo = new Map();
const ink = (i, wd) => { const key = LINES[i] + '|' + wg(i) + '|' + wd.toFixed(2); if (!memo.has(key)) memo.set(key, measure(LINES[i], wg(i), wd)); return memo.get(key); };
function lay() {
  const W = box.clientWidth, H = box.clientHeight, lines = choose(W, H);
  if (lines.join('|') !== LINES.join('|')) { LINES = lines; els.forEach(d => d.remove()); els = LINES.map((t, i) => { const d = document.createElement('div'); d.textContent = t; d.style.fontWeight = wg(i); box.appendChild(d); return d; }); }
  const f = solve(W, H, LINES.length, ink), sizes = LINES.map((_, i) => W / ink(i, f.wd)); state = { W, H, ...f, sizes };
  let y = 0;
  els.forEach((d, i) => {
    const s = sizes[i];
    d.style.fontStretch = f.wd + '%'; d.style.fontSize = s + 'px';
    // the line box is one em tall with the capitals near its middle: lift the line so its capitals start at y
    d.style.top = (y - s * f.squash * ((1 - CAP) / 2 + .012)) + 'px'; d.style.transform = 'scaleY(' + f.squash + ')';
    d.style.opacity = i < shown ? 1 : 0; d.dataset.y = y; d.dataset.h = s * CAP * f.squash;
    y += s * (CAP + GAP) * f.squash;
  });
  const r = box.getBoundingClientRect(); grip.style.left = (r.right - 6) + 'px'; grip.style.top = (r.bottom - 6) + 'px';
}
new ResizeObserver(lay).observe(box); addEventListener('resize', lay);
let drag = null;
grip.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, w: box.offsetWidth, h: box.offsetHeight }; grip.setPointerCapture(e.pointerId); });
grip.addEventListener('pointermove', e => { if (!drag) return; box.style.width = (drag.w + e.clientX - drag.x) + 'px'; box.style.height = (drag.h + e.clientY - drag.y) + 'px'; });
grip.addEventListener('pointerup', () => drag = null);
if (still) shown = 99;
lay();
// the lines arrive one at a time into the empty box
if (!still) { const next = () => { if (shown >= els.length) { shown = 99; return; } shown++; els[shown - 1].animate([{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' }); lay(); setTimeout(next, 430); }; setTimeout(next, 700); }
window.__size = (w, h) => { box.style.width = w + 'px'; box.style.height = h + 'px'; lay(); };
window.__measure = () => {
  const b = box.getBoundingClientRect();
  return { box: [Math.round(b.width), Math.round(b.height)], width: +state.wd.toFixed(1), squash: +state.squash.toFixed(3), shown: Math.min(shown, els.length), allIn: shown >= els.length, text: LINES.join(' '),
    lines: els.map((d, i) => { const r = document.createRange(); r.selectNodeContents(d); const g = r.getBoundingClientRect(); return { text: LINES[i], weight: wg(i), size: +state.sizes[i].toFixed(1), inkWidth: +g.width.toFixed(1), capTop: +(+d.dataset.y).toFixed(1), capHeight: +(+d.dataset.h).toFixed(1) }; }),
    used: +(els.reduce((a, d) => Math.max(a, +d.dataset.y + +d.dataset.h), 0)).toFixed(1) };
};
window.__ready = true;
