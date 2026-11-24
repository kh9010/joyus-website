// Study 103: writes index.html from spines.json, so the page cannot drift from the list.
const fs = require('node:fs');
const path = require('node:path');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'spines.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const types = [...new Set(S.map(s => s.type))];
const spine = (s) => `<div class="item" data-id="${s.n}"><input type="checkbox" id="${s.n}"><div class="body">
<h3><label for="${s.n}"><span class="n">${s.n}</span> ${esc(s.q)}</label></h3>
<p class="idea">${esc(s.idea)}</p>
<table class="beats"><tbody>
${s.beats.map((b, i) => `<tr><th>${i + 1}</th><td class="say">${esc(b.say)}</td><td class="show">${esc(b.show)}</td></tr>`).join('\n')}
</tbody></table>
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
<title>103 / Agemo, nine spines — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
main { max-width: 1180px }
h2 { margin: 44px 0 0; font-size: 15px; font-weight: 600; padding-bottom: 10px; border-bottom: 2px solid var(--ink) }
.item { display: grid; grid-template-columns: 28px 1fr; gap: 0 14px; padding: 28px 0; border-bottom: 1px solid var(--line) }
.item input { width: 18px; height: 18px; margin: 8px 0 0; accent-color: #222; cursor: pointer }
.item.picked { background: var(--surface); margin: 0 -14px; padding-left: 14px; padding-right: 14px }
.item h3 { margin: 0 0 10px; font-size: 25px; line-height: 1.2; font-weight: 600; max-width: 30ch } .item h3 label { cursor: pointer }
.item h3 .n { color: var(--ink-2); font-weight: 400; font-size: 15px; margin-right: 8px; vertical-align: middle }
.idea { margin: 0 0 16px; font-size: 16px; max-width: 70ch }
.beats { border-collapse: collapse; width: 100%; margin: 0 0 14px }
.beats th { width: 26px; text-align: left; vertical-align: top; font-weight: 400; color: var(--ink-2); font-size: 13px; padding: 9px 0 }
.beats td { vertical-align: top; padding: 8px 18px 8px 0; border-top: 1px solid var(--line); font-size: 15px }
.beats tr:first-child td, .beats tr:first-child th { border-top: 0 }
.beats .say { width: 46%; font-weight: 500 } .beats .show { color: var(--ink-2) }
.close { margin: 0 0 16px; font-size: 16px; font-weight: 600 }
.v { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start }
.v figure { margin: 0 } .v img { width: 100%; height: 170px; object-fit: cover; object-position: top left; border: 1px solid var(--line); display: block }
.v figcaption { font-size: 12.5px; color: var(--ink-2); margin-top: 5px }
.picks { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 0; margin: 0; display: flex; gap: 16px; align-items: center; font-size: 13.5px }
.picks button { font: inherit; background: #222; color: #fff; border: 0; padding: 6px 12px; cursor: pointer }
.picks button.quiet { background: transparent; color: var(--ink-2); padding: 6px 4px }
.picks .count { color: var(--ink-2) }
@media (max-width: 800px) { .beats, .beats tbody, .beats tr, .beats td { display: block; width: auto } .beats th { display: none } .beats .say { width: auto; padding-bottom: 2px } .beats .show { border-top: 0; padding-top: 0 } .v { grid-template-columns: 1fr } .v img { height: auto } .item h3 { font-size: 21px } }
</style>
</head>
<body>
<main>
<h1>Agemo, nine spines</h1>
<div class="picks"><span class="count" id="count">0 picked</span><button id="copy">Copy picks</button><button class="quiet" id="clear">Clear</button></div>

${sections}
</main>
<script type="module">
const KEY = 'study-103-picks';
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
console.log('index.html: ' + S.length + ' spines in ' + types.length + ' types');
