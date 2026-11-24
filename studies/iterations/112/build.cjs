// Study 112: writes index.html from spines.json. Six spines for the six TomboyX questions Divya picked from Study 111.
// Each brings its own form: its own column heads, its own number of rows, its own three real slides.
const fs = require('node:fs');
const path = require('node:path');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'spines.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const spine = (s) => `<div class="item" data-id="${s.n}"><input type="checkbox" id="${s.n}"><div class="body">
<p class="form">${esc(s.form)}</p>
<h3><label for="${s.n}"><span class="n">${s.n}</span> ${esc(s.q)}</label></h3>
<p class="subject">${esc(s.subject)}</p>
<div class="v">${s.frames.map(([f, cap]) => `<figure><a class="zoom" href="img/${f}"><img src="img/${f}" alt="${esc(cap)}" loading="lazy"></a><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>
<table class="rows c${s.heads.length}">${s.heads.some(Boolean) ? `<thead><tr>${s.heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>
${s.rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}
</tbody></table>
<p class="end">${esc(s.end)}</p>
<p class="close">${esc(s.close)}</p>
<p class="from">${esc(s.from)}</p>
</div></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>112 / TomboyX, six spines — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
main { max-width: 1180px }
.item { display: grid; grid-template-columns: 28px 1fr; gap: 0 14px; padding: 32px 0; border-top: 1px solid var(--line) }
.item:last-of-type { border-bottom: 1px solid var(--line) }
.item input { width: 18px; height: 18px; margin: 6px 0 0; accent-color: #222; cursor: pointer }
.item.picked { background: var(--surface); margin: 0 -14px; padding-left: 14px; padding-right: 14px }
.form { margin: 0 0 6px; font-size: 23px; line-height: 1.2; font-weight: 600; max-width: 34ch }
.item h3 { margin: 0 0 4px; font-size: 16px; line-height: 1.35; font-weight: 400 } .item h3 label { cursor: pointer }
.item h3 .n { color: var(--ink-2); font-size: 13px; margin-right: 6px }
.subject { margin: 0 0 16px; font-size: 13.5px; color: var(--ink-2) }
.v { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; margin: 0 0 18px }
.v figure { margin: 0 } .v img { width: 100%; height: 210px; object-fit: contain; object-position: top left; background: #fff; border: 1px solid var(--line); display: block }
.v figcaption { font-size: 12.5px; color: var(--ink-2); margin-top: 5px }
.rows { border-collapse: collapse; width: 100%; margin: 0 0 14px; table-layout: fixed }
.rows th { text-align: left; font-weight: 600; font-size: 12.5px; color: var(--ink-2); padding: 0 18px 7px 0; border-bottom: 1px solid var(--ink) }
.rows td { vertical-align: top; padding: 9px 18px 9px 0; border-bottom: 1px solid var(--line); font-size: 15px }
.rows tr:first-child td { border-top: 1px solid var(--line) } .rows thead + tbody tr:first-child td { border-top: 0 }
.rows td:first-child { font-weight: 500 }
.rows.c2 td:first-child, .rows.c2 th:first-child { width: 24% } .rows.c3 td:first-child, .rows.c3 th:first-child { width: 24% }
.end { margin: 0 0 8px; font-size: 15px; max-width: 80ch }
.close { margin: 0 0 8px; font-size: 15px; font-weight: 600 }
.from { margin: 0; font-size: 12.5px; color: var(--ink-2); max-width: 90ch }
.picks { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 0; margin: 0 0 8px; display: flex; gap: 16px; align-items: center; font-size: 13.5px }
.picks button { font: inherit; background: #222; color: #fff; border: 0; padding: 6px 12px; cursor: pointer }
.picks button.quiet { background: transparent; color: var(--ink-2); padding: 6px 4px }
.picks .count { color: var(--ink-2) }
@media (max-width: 800px) { .v { grid-template-columns: 1fr } .v img { height: auto } .rows, .rows tbody, .rows tr, .rows td { display: block; width: auto !important } .rows thead { display: none } .rows td { border: 0 !important; padding: 2px 0 } .rows tr { border-bottom: 1px solid var(--line); padding: 8px 0 } .rows td:empty { display: none } }
</style>
</head>
<body>
<main>
<h1>TomboyX, six spines</h1>
<div class="picks"><span class="count" id="count">0 picked</span><button id="copy">Copy picks</button><button class="quiet" id="clear">Clear</button></div>

${S.map(spine).join('\n')}
</main>
<script type="module">
const KEY = 'study-112-picks';
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
console.log('index.html: ' + S.length + ' spines');
