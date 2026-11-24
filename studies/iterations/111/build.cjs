// Study 111: writes index.html from questions.json, so the page cannot drift from the list.
const fs = require('node:fs');
const path = require('node:path');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const id = (i) => String(i + 1).padStart(2, '0');

const items = S.map((s, i) => `<div class="item" data-id="${id(i)}"><input type="checkbox" id="${id(i)}"><div class="body">
<div class="words">
<h3><label for="${id(i)}"><span class="n">${id(i)}</span> ${esc(s.q)}</label></h3>
${s.lines.map(l => `<p class="run">${esc(l)}</p>`).join('\n')}
<p class="close">${esc(s.close)}</p>
<p class="from">“${esc(s.quote)}” <span>${esc(s.from)}</span></p>
</div>
<a class="zoom" href="img/${s.img}"><img src="img/${s.img}" alt="${esc(s.alt)}" loading="lazy"></a>
</div></div>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>111 / TomboyX investor storytelling, ${S.length} questions — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
.item { display: grid; grid-template-columns: 28px 1fr; gap: 0 14px; padding: 26px 0; border-top: 1px solid var(--line); max-width: 1180px }
.item:last-of-type { border-bottom: 1px solid var(--line) }
.item input { width: 18px; height: 18px; margin: 8px 0 0; accent-color: #222; cursor: pointer }
.item.picked { background: var(--surface); margin: 0 -14px; padding-left: 14px; padding-right: 14px }
.body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 400px); gap: 28px; align-items: start }
.item h3 { margin: 0 0 14px; font-size: 25px; line-height: 1.2; font-weight: 600; max-width: 26ch } .item h3 label { cursor: pointer }
.item h3 .n { color: var(--ink-2); font-weight: 400; font-size: 15px; margin-right: 8px; vertical-align: middle }
.run { margin: 0 0 4px; font-size: 16px; max-width: 60ch }
.close { margin: 12px 0 12px; font-size: 16px; font-weight: 600; max-width: 60ch }
.from { margin: 0; font-size: 13px; color: var(--ink-2); max-width: 66ch } .from span { white-space: nowrap; margin-left: 4px } .from span::before { content: '· ' }
.body .zoom img { width: 100%; max-height: 280px; object-fit: cover; object-position: top left; border: 1px solid var(--line); display: block }
.picks { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 0; margin: 0 0 8px; display: flex; gap: 16px; align-items: center; font-size: 13.5px; max-width: 1180px }
.picks button { font: inherit; background: #222; color: #fff; border: 0; padding: 6px 12px; cursor: pointer }
.picks button.quiet { background: transparent; color: var(--ink-2); padding: 6px 4px }
.picks .count { color: var(--ink-2) }
@media (max-width: 800px) { .body { grid-template-columns: 1fr; gap: 12px } .item h3 { font-size: 21px } .from span { white-space: normal } }
</style>
</head>
<body>
<main>
<h1>TomboyX investor storytelling, ${S.length} questions</h1>
<div class="picks"><span class="count" id="count">0 picked</span><button id="copy">Copy picks</button><button class="quiet" id="clear">Clear</button></div>

${items}
</main>
<script type="module">
const KEY = 'study-111-picks';
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
console.log('index.html: ' + S.length + ' questions');
