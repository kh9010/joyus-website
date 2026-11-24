// Study 108: writes index.html from ways.json. Five ways to build one question's story. Each way brings its own table
// and its own three frames, drawn by hand below (small screens in the case studies' type and colours, with the real
// words); they are not one template filled in five times.
const fs = require('node:fs');
const path = require('node:path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'ways.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fr = (inner, cls = '') => `<div class="fr ${cls}">${inner}</div>`;
const FRAMES = {
  // 1. the team's name for a step, then the thought written at it, then who wrote both
  names: [
    fr(`<div class="steps"><i>Writes prompt</i><i>Adds integrations</i><i>Function is building</i><i>UI is pre-populated with input fields</i></div>`),
    fr(`<div class="pairs"><i>Writes prompt</i><b>“What should I type?”</b><i>Adds integrations</i><b>“I don’t know what integrations is”</b><i>Function is building</i><b>“Do I just sit and wait?”</b><i>UI is pre-populated with input fields</i><b>“What is this page for?”</b></div>`),
    fr(`<p class="B">Both columns, <u>the same people.</u></p>`),
  ],
  // 2. one thought to a screen, then the reveal
  voice: [
    fr(`<p class="B c">“I don’t really know what types of thing I can build with CodeWords”</p>`),
    fr(`<p class="B c">“What is this page for?”</p>`),
    fr(`<p class="S c ghost">“I don’t really know what types of thing I can build…”<br>“…I don’t know what a function is.”<br>“…should I click build?”<br>“What is this page for?”</p><p class="B c">None of them were ever lost in it. <u>They built it.</u></p>`),
  ],
  // 3. in and out at one step, then the step that goes the other way, then the tally
  inout: [
    fr(`<p class="S">The build</p><p class="M">“…looking forward to seeing it fully built.”</p><p class="arrow pk">↓ less sure</p><p class="M">“…its not what I wanted.”</p>`),
    fr(`<p class="S">Checking the prompt</p><p class="M">“I want to see if my prompt can be improved”</p><p class="arrow"><span class="hl">↑ surer</span></p><p class="M">“I now have a better understanding…”</p>`),
    fr(`<div class="tally"><span>↓</span><span>↓</span><span>↓</span><span class="up">↑</span></div><p class="M c">One step in four left people surer. <u>The product was rebuilt around it.</u></p>`),
  ],
  // 4. the notes thin out; the question marks do not
  count: [
    fr(`<div class="bars"><div><s style="height:100%"></s><b>20</b><i>Home</i></div><div><s style="height:95%"></s><b>19</b><i>A prompt</i></div><div><s style="height:45%"></s><b>9</b><i>The build</i></div><div><s style="height:65%"></s><b>13</b><i>The run</i></div></div><p class="S c">notes</p>`),
    fr(`<div class="qs"><div><b>?????</b><i>Home</i></div><div><b>????</b><i>A prompt</i></div><div><b>???????</b><i>The build</i></div><div><b>??????????????</b><i>The run</i></div></div><p class="S c">question marks</p>`),
    fr(`<p class="B c"><span class="pk">14</span> questions.<br>13 notes.</p><p class="S c">the last page of the product</p>`),
  ],
  // 5. their note, then the part of the real redesign that replies
  answer: [
    fr(`<p class="M">“I don’t really know what types of thing I can build with CodeWords”</p><a class="zoom" href="img/answer-tools.png"><img src="img/answer-tools.png" alt="The front page: tools already made"></a>`, 'call'),
    fr(`<p class="M">“Create a function that... I don’t know what a function is.”</p><a class="zoom" href="img/answer-box.png"><img src="img/answer-box.png" alt="The box that says Describe your tool"></a>`, 'call'),
    fr(`<p class="M">“Do I just sit and wait?”</p><a class="zoom" href="img/answer-steps.png"><img src="img/answer-steps.png" alt="A run shown one step at a time"></a>`, 'call'),
  ],
};

const way = (w, i) => `<div class="item" data-id="${i + 1}"><input type="checkbox" id="w${i + 1}"><div class="body">
<h3><label for="w${i + 1}"><span class="n">${i + 1}</span> ${esc(w.form)}</label></h3>
<p class="idea">${esc(w.idea)}</p>
<div class="frames">${FRAMES[w.k].join('')}</div>
<table class="rows c${w.heads.length}"><thead><tr>${w.heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${w.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}
</tbody></table>
<p class="end">${esc(w.end)}</p>
</div></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>108 / Agemo, the stranger question, five ways to build it — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400&family=Space+Grotesk:wght@400;500;700&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
main { max-width: 1180px }
.q { margin: 0 0 4px; font-size: 19px; font-weight: 600 }
.item { display: grid; grid-template-columns: 28px 1fr; gap: 0 14px; padding: 30px 0; border-top: 1px solid var(--line) }
.item:last-of-type { border-bottom: 1px solid var(--line) }
.item input { width: 18px; height: 18px; margin: 6px 0 0; accent-color: #222; cursor: pointer }
.item.picked { background: var(--surface); margin: 0 -14px; padding-left: 14px; padding-right: 14px }
.item h3 { margin: 0 0 8px; font-size: 23px; line-height: 1.2; font-weight: 600 } .item h3 label { cursor: pointer }
.item h3 .n { color: var(--ink-2); font-weight: 400; font-size: 15px; margin-right: 8px }
.idea { margin: 0 0 16px; font-size: 16px; max-width: 76ch }
.frames { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 0 0 18px }
/* a frame: a small screen in the case studies' own type and colours */
.fr { aspect-ratio: 16 / 10; border: 1px solid var(--line); background: #fff; padding: 16px 18px; overflow: hidden; display: flex; flex-direction: column; justify-content: center; gap: 8px;
  font-family: 'Space Grotesk', system-ui, sans-serif; color: #2C3544; --hi: #F2C94A; --pk: #B8155F; --soft: #54606F }
.fr p { margin: 0 } .fr .c { text-align: center } .fr u { text-decoration: none; box-shadow: inset 0 -.3em 0 var(--hi) } .fr .hl { background: var(--hi); padding: 0 .25em } .fr .pk { color: var(--pk) }
.fr .B { font-weight: 700; font-size: clamp(15px, 1.75vw, 22px); line-height: 1.12; letter-spacing: -.025em }
.fr .M { font-weight: 500; font-size: clamp(11.5px, 1.15vw, 14.5px); line-height: 1.25 }
.fr .S { font-size: clamp(10px, .9vw, 12px); color: var(--soft); font-weight: 500 }
.fr .ghost { opacity: .5; line-height: 1.5 }
.fr .arrow { font-weight: 700; font-size: clamp(11px, 1.05vw, 13.5px) }
.steps, .pairs { display: grid; gap: 7px 12px; align-items: center } .pairs { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr) }
.steps i, .pairs i { font-style: normal; font-size: clamp(9.5px, .85vw, 11.5px); font-weight: 500; border: 1.3px solid #2C3544; border-radius: 9px; padding: 5px 8px; justify-self: start; line-height: 1.15 }
.pairs b { font-size: clamp(10.5px, 1vw, 13px); line-height: 1.15; color: var(--pk); font-weight: 500 }
.tally { display: flex; justify-content: center; gap: 12px; font-weight: 700; font-size: clamp(18px, 2.2vw, 28px); color: var(--pk) } .tally .up { color: #2C3544; background: var(--hi); padding: 0 .28em }
.bars, .qs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; align-items: end; height: 62% }
.bars div { display: grid; grid-template-rows: 1fr auto auto; justify-items: center; height: 100%; align-items: end }
.bars s { display: block; width: 46%; background: #2C3544; text-decoration: none }
.bars b, .qs i, .bars i { font-style: normal; font-size: clamp(9.5px, .85vw, 11.5px); font-weight: 500 } .bars i, .qs i { color: var(--soft) }
.qs div { display: grid; justify-items: center; gap: 4px; align-content: end; height: 100%; min-width: 0 }
.qs b { color: var(--pk); font-weight: 700; font-size: clamp(11px, 1.05vw, 14px); line-height: .95; word-break: break-all; overflow-wrap: anywhere; text-align: center; width: 100%; max-width: 4.6em; letter-spacing: .04em }
.fr.call { justify-content: space-between } .fr.call img { display: block; width: 100%; max-height: 62%; object-fit: cover; object-position: top left; border: 1px solid var(--line) } .fr.call a { display: block; min-height: 0 }
.rows { border-collapse: collapse; width: 100%; margin: 0 0 12px; table-layout: fixed }
.rows th { text-align: left; font-weight: 600; font-size: 12.5px; color: var(--ink-2); padding: 0 18px 7px 0; border-bottom: 1px solid var(--ink) }
.rows td { vertical-align: top; padding: 8px 18px 8px 0; border-bottom: 1px solid var(--line); font-size: 14.5px }
.rows.c3 td:first-child, .rows.c3 th:first-child { width: 22% } .rows.c4 td:first-child, .rows.c4 th:first-child { width: 17% } .rows.c4 td:last-child, .rows.c4 th:last-child { width: 11%; font-weight: 600 }
.end { margin: 0; font-size: 15px; font-weight: 600; max-width: 78ch }
.picks { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 0; margin: 0 0 8px; display: flex; gap: 16px; align-items: center; font-size: 13.5px }
.picks button { font: inherit; background: #222; color: #fff; border: 0; padding: 6px 12px; cursor: pointer }
.picks button.quiet { background: transparent; color: var(--ink-2); padding: 6px 4px }
.picks .count { color: var(--ink-2) }
@media (max-width: 800px) { .frames { grid-template-columns: 1fr } .rows, .rows tbody, .rows tr, .rows td { display: block; width: auto !important } .rows thead { display: none } .rows td { border-bottom: 0; padding: 2px 0 } .rows tr { border-bottom: 1px solid var(--line); padding: 8px 0 } }
</style>
</head>
<body>
<main>
<h1>Agemo, the stranger question, five ways to build it</h1>
<p class="q">${esc(D.q)}</p>
<div class="picks"><span class="count" id="count">0 picked</span><button id="copy">Copy picks</button><button class="quiet" id="clear">Clear</button></div>

${D.ways.map(way).join('\n')}
</main>
<script type="module">
const KEY = 'study-108-picks';
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
console.log('index.html: ' + D.ways.length + ' ways, ' + Object.values(FRAMES).flat().length + ' frames');
