// Study 100: writes index.html from storylines.json, so the page cannot drift from the list.
const fs = require('node:fs');
const path = require('node:path');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'storylines.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const id = (i) => String(i + 1).padStart(2, '0');

const items = S.map((s, i) => `<div class="item" data-id="${id(i)}"><input type="checkbox" id="${id(i)}"><div class="body">
<div class="words">
<h3><label for="${id(i)}"><span class="n">${id(i)}</span> ${esc(s.name)}</label></h3>
<p class="line">${esc(s.line)}</p>
<ol>${s.beats.map(b => `<li>${esc(b)}</li>`).join('')}</ol>
<p class="from">${esc(s.from)}</p>
</div>
<a class="zoom" href="img/${s.img}"><img src="img/${s.img}" alt="${esc(s.alt)}" loading="lazy"></a>
</div></div>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>100 / Agemo product, ${S.length} storylines — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
.item { display: grid; grid-template-columns: 28px 1fr; gap: 0 14px; padding: 22px 0; border-top: 1px solid var(--line); max-width: 1180px }
.item:last-of-type { border-bottom: 1px solid var(--line) }
.item input { width: 18px; height: 18px; margin: 5px 0 0; accent-color: #222; cursor: pointer }
.item.picked { background: var(--surface); margin: 0 -14px; padding-left: 14px; padding-right: 14px }
.body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 420px); gap: 28px; align-items: start }
.item h3 { margin: 0 0 6px; font-size: 20px; font-weight: 600 } .item h3 label { cursor: pointer }
.item h3 .n { color: var(--ink-2); font-weight: 400; margin-right: 6px }
.line { margin: 0 0 10px; font-size: 16px; max-width: 62ch }
.item ol { margin: 0 0 10px; padding-left: 20px; color: var(--ink-2); font-size: 14.5px; max-width: 66ch } .item li { margin: 3px 0 }
.from { margin: 0; font-size: 12.5px; color: var(--ink-2) }
.body .zoom img { width: 100%; max-height: 300px; object-fit: cover; object-position: top left; border: 1px solid var(--line); display: block }
.picks { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 0; margin: 0 0 8px; display: flex; gap: 16px; align-items: center; font-size: 13.5px; max-width: 1180px }
.picks button { font: inherit; background: #222; color: #fff; border: 0; padding: 6px 12px; cursor: pointer }
.picks button.quiet { background: transparent; color: var(--ink-2); padding: 6px 4px }
.picks .count { color: var(--ink-2) }
@media (max-width: 800px) { .body { grid-template-columns: 1fr; gap: 12px } }
</style>
</head>
<body>
<main>
<h1>Agemo product, ${S.length} storylines</h1>
<div class="picks"><span class="count" id="count">0 picked</span><button id="copy">Copy picks</button><button class="quiet" id="clear">Clear</button></div>

${items}
</main>
<script type="module">
const KEY = 'study-100-picks';
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
  const lines = boxes.filter(b => picks.has(b.id)).map(b => b.closest('.item').querySelector('h3').textContent.trim().replace(/\\s+/g, ' '));
  const text = lines.length ? lines.join('\\n') : '(nothing picked)';
  try { await navigator.clipboard.writeText(text); count.textContent = 'copied ' + lines.length; setTimeout(paint, 1200); } catch { prompt('Picks', text); }
};
paint();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html: ' + S.length + ' storylines');
