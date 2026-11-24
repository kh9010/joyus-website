// Study 104: writes index.html from spines.json. Each spine has its own form, so each brings its
// own column heads, its own number of rows and its own small drawing of the story's shape.
const fs = require('node:fs');
const path = require('node:path');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'spines.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// the shape of each story, drawn small: 132 x 72, one stroke weight
const r = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const l = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const SHAPES = {
  // four places on a line; the middle two are missing
  map: l(8, 36, 124, 36) + `<circle cx="18" cy="36" r="9" class="f"/><circle cx="50" cy="36" r="9" class="d"/><circle cx="82" cy="36" r="9" class="d"/><circle cx="114" cy="36" r="9" class="f"/>`,
  // one page, three frames closing in
  zoom: r(6, 6, 120, 60) + r(26, 16, 80, 40) + r(48, 26, 36, 20, 'class="f"'),
  // an arrow running right to left from the last box
  back: r(100, 22, 24, 28, 'class="f"') + r(54, 22, 24, 28) + r(8, 22, 24, 28) + `<path d="M96 36 H84 M50 36 H38 M88 32 l-4 4 l4 4 M42 32 l-4 4 l4 4"/>`,
  // lines of a brief, each with a note hanging off it
  notes: [14, 30, 46, 62].map(y => l(8, y, 62, y) + l(74, y - 5, 124, y - 5, 'class="thin"') + l(74, y + 1, 110, y + 1, 'class="thin"')).join(''),
  // two voices, alternating, then one bar
  talk: r(8, 6, 50, 10) + r(74, 20, 50, 10) + r(74, 34, 50, 10) + r(8, 48, 50, 10) + r(8, 62, 116, 5, 'class="f"'),
  // three panels, each crossed out
  three: [8, 50, 92].map(x => r(x, 14, 32, 44) + l(x + 6, 22, x + 26, 50) + l(x + 26, 22, x + 6, 50)).join(''),
  // one slot; four lines struck, the fifth stays
  slot: [10, 23, 36, 49].map((y, i) => l(20, y, 112 - i * 8, y, 'class="thin"') + l(14, y, 118 - i * 8, y, 'class="strike"')).join('') + r(14, 57, 104, 9, 'class="f"'),
  // two columns, the same rows
  versus: [8, 24, 40, 56].map(y => r(8, y, 52, 10) + r(72, y, 52, 10, 'class="f"')).join('') + l(66, 4, 66, 70, 'class="thin"'),
  // a line of four steps, buried in notes
  wall: l(8, 36, 124, 36) + [[14, 10], [26, 20], [18, 44], [34, 52], [44, 8], [50, 24], [42, 42], [58, 54], [66, 14], [72, 46], [84, 26], [80, 56], [96, 10], [102, 40], [112, 22], [110, 54], [30, 34], [62, 32], [92, 34]].map(([x, y]) => r(x, y, 10, 10, 'class="f"')).join(''),
};
const svg = (k) => `<svg class="shape" viewBox="0 0 132 72" role="img" aria-label="${esc(S.find(s => s.shape === k).form)}">${SHAPES[k]}</svg>`;

const types = [...new Set(S.map(s => s.type))];
const spine = (s) => `<div class="item" data-id="${s.n}"><input type="checkbox" id="${s.n}"><div class="body">
<div class="top">${svg(s.shape)}<div>
<p class="form">${esc(s.form)}</p>
<h3><label for="${s.n}"><span class="n">${s.n}</span> ${esc(s.q)}</label></h3>
<p class="subject">${esc(s.subject)}</p>
</div></div>
<table class="rows c${s.heads.length}"><thead><tr>${s.heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${s.rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}
</tbody></table>
<p class="end">${esc(s.end)}</p>
<p class="close">${esc(s.close)}</p>
<div class="v">${s.imgs.map(([f, cap]) => `<figure><a class="zoom" href="img/${f}"><img src="img/${f}" alt="${esc(cap)}" loading="lazy"></a><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>
</div></div>`;
const sections = types.map(t => `<h2>${esc(t)}</h2>\n${S.filter(s => s.type === t).map(spine).join('\n')}`).join('\n\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>104 / Agemo, nine spines, nine shapes — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
main { max-width: 1180px }
h2 { margin: 44px 0 0; font-size: 15px; font-weight: 600; padding-bottom: 10px; border-bottom: 2px solid var(--ink) }
.item { display: grid; grid-template-columns: 28px 1fr; gap: 0 14px; padding: 30px 0; border-bottom: 1px solid var(--line) }
.item input { width: 18px; height: 18px; margin: 8px 0 0; accent-color: #222; cursor: pointer }
.item.picked { background: var(--surface); margin: 0 -14px; padding-left: 14px; padding-right: 14px }
.top { display: grid; grid-template-columns: 176px minmax(0, 1fr); gap: 26px; align-items: start; margin-bottom: 18px }
.shape { width: 176px; height: 96px; border: 1px solid var(--line); background: #fff; fill: none; stroke: var(--ink); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round }
.shape .f { fill: var(--ink) } .shape .d { stroke-dasharray: 3 3 } .shape .thin { stroke-width: 1; stroke: var(--ink-2) } .shape .strike { stroke-width: 1.6 }
.form { margin: 0 0 6px; font-size: 19px; font-weight: 600 }
.item h3 { margin: 0 0 6px; font-size: 16px; line-height: 1.35; font-weight: 400; max-width: 62ch } .item h3 label { cursor: pointer }
.item h3 .n { color: var(--ink-2); font-size: 13px; margin-right: 6px }
.subject { margin: 0; font-size: 13.5px; color: var(--ink-2) }
.rows { border-collapse: collapse; width: 100%; margin: 0 0 14px; table-layout: fixed }
.rows th { text-align: left; font-weight: 600; font-size: 12.5px; color: var(--ink-2); padding: 0 18px 7px 0; border-bottom: 1px solid var(--ink) }
.rows td { vertical-align: top; padding: 9px 18px 9px 0; border-bottom: 1px solid var(--line); font-size: 15px }
.rows.c2 th:first-child, .rows.c2 td:first-child { width: 42% }
.rows.c3 th:first-child, .rows.c3 td:first-child { width: 30% }
.rows td:first-child { font-weight: 500 }
.end { margin: 0 0 8px; font-size: 15px; max-width: 78ch }
.close { margin: 0 0 16px; font-size: 15px; font-weight: 600 }
.v { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start }
.v figure { margin: 0 } .v img { width: 100%; height: 170px; object-fit: cover; object-position: top left; border: 1px solid var(--line); display: block }
.v figcaption { font-size: 12.5px; color: var(--ink-2); margin-top: 5px }
.picks { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 0; margin: 0; display: flex; gap: 16px; align-items: center; font-size: 13.5px }
.picks button { font: inherit; background: #222; color: #fff; border: 0; padding: 6px 12px; cursor: pointer }
.picks button.quiet { background: transparent; color: var(--ink-2); padding: 6px 4px }
.picks .count { color: var(--ink-2) }
@media (max-width: 800px) { .top { grid-template-columns: 1fr; gap: 12px } .rows, .rows tbody, .rows tr, .rows td { display: block; width: auto !important } .rows thead { display: none } .rows td { border-bottom: 0; padding: 2px 0 } .rows tr { border-bottom: 1px solid var(--line); padding: 8px 0 } .rows td:empty { display: none } .v { grid-template-columns: 1fr } .v img { height: auto } }
</style>
</head>
<body>
<main>
<h1>Agemo, nine spines, nine shapes</h1>
<div class="picks"><span class="count" id="count">0 picked</span><button id="copy">Copy picks</button><button class="quiet" id="clear">Clear</button></div>

${sections}
</main>
<script type="module">
const KEY = 'study-104-picks';
const boxes = [...document.querySelectorAll('.item input[type=checkbox]')];
const count = document.getElementById('count');
let picks = new Set();
try { const s = localStorage.getItem(KEY); if (s) picks = new Set(JSON.parse(s)); } catch {}
function paint() {
  for (const b of boxes) { b.checked = picks.has(b.id); b.closest('.item').classList.toggle('picked', b.checked); }
  count.textContent = picks.size + ' picked';
  try { localStorage.setItem(KEY, JSON.stringify([...picks])); } catch {}
}
for (const b of boxes) b.addEventListener('change', () => { b.checked ? picks.add(b.id) : picks.delete(b.id); paint(); });
document.getElementById('clear').onclick = () => { picks.clear(); paint(); };
document.getElementById('copy').onclick = async () => {
  const lines = boxes.filter(b => picks.has(b.id)).map(b => { const i = b.closest('.item'); return i.querySelector('h3').textContent.trim().replace(/\\s+/g, ' ') + '  (' + i.querySelector('.form').textContent.trim() + ')'; });
  const text = lines.length ? lines.join('\\n') : '(nothing picked)';
  try { await navigator.clipboard.writeText(text); count.textContent = 'copied ' + lines.length; setTimeout(paint, 1200); } catch { prompt('Picks', text); }
};
paint();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html: ' + S.length + ' spines, ' + new Set(S.map(s => s.shape)).size + ' shapes');
