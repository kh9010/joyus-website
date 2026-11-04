// Study 72: writes index.html from bet.json, so every number on the page is counted from the scores.
const fs = require('node:fs');
const path = require('node:path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'bet.json'), 'utf8'));
const sum = a => a.reduce((x, y) => x + y, 0);
const KINDS = [['f', 'Functional', 'What it is'], ['e', 'Emotional', 'What I feel'], ['i', 'Identity', 'Who that makes me']];
const dot = v => `<i class="d d${v}" title="${['Not at all', 'Partly', 'Carries it'][v]}"></i>`;
// The identity question splits in two: who they are (is this good company) and who I would be (what needing this says about me).
const ABOUT_THEM = [0, 3, 5], ABOUT_ME = [1, 2, 4, 6];
const them = sum(ABOUT_THEM.map(i => sum(D.beliefs[i].i[1]))), me = sum(ABOUT_ME.map(i => sum(D.beliefs[i].i[1])));
const nOut = D.outputs.length, maxThem = ABOUT_THEM.length * nOut * 2, maxMe = ABOUT_ME.length * nOut * 2;
const emptyRows = D.beliefs.flatMap(b => KINDS.map(k => b[k[0]])).filter(r => !sum(r[1])).length;
const beliefTotal = b => sum(KINDS.map(k => sum(b[k[0]][1])));
const colTotal = i => sum(D.beliefs.flatMap(b => KINDS.map(k => b[k[0]][1][i])));
const rows = D.beliefs.map((b, n) => {
  const head = `<tr class="b" data-total="${beliefTotal(b)}"><th colspan="${nOut + 2}"><span class="n">${n + 1}</span><span class="say">${b.say}</span><span class="msg">${b.msg}</span></th></tr>`;
  const lines = KINDS.map(([k, name]) => {
    const [q, s] = b[k], blank = !sum(s);
    return `<tr class="${blank ? 'blank' : ''}"><td class="k">${name}</td><td class="q">${q}</td>${s.map(v => `<td class="c">${dot(v)}</td>`).join('')}</tr>`;
  }).join('\n');
  return head + '\n' + lines;
}).join('\n');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>72 / The bet, against the output — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
.bet{font-size:clamp(24px,3vw,36px);line-height:1.2;font-weight:500;max-width:28ch;margin:18px 0 34px}
.sum{font-size:clamp(19px,2vw,24px);line-height:1.3;font-weight:500;max-width:34ch;margin:0 0 14px}
.find{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 28px;margin:0 0 34px;max-width:1100px}
.find p{margin:0;color:var(--ink-2);font-size:14px}.find b{display:block;color:var(--ink);font-size:15px;font-weight:600;margin-bottom:4px}
.big{display:block;font-size:30px;font-weight:600;color:var(--ink);line-height:1.1;margin-bottom:6px}
.scroll{overflow-x:auto}
table.m{border-collapse:collapse;width:100%;min-width:900px;font-size:14px}
table.m thead th{position:sticky;top:0;background:#fff;font-size:12px;font-weight:500;color:var(--ink-2);padding:6px 2px;text-align:center;vertical-align:bottom;border-bottom:1px solid var(--ink);line-height:1.15}
table.m thead th a{color:inherit;text-decoration:none}table.m thead th a:hover{text-decoration:underline}
tr.b th{padding:20px 0 7px;text-align:left;font-weight:400;border-bottom:1px solid var(--line)}
tr.b .n{display:inline-block;width:24px;font-weight:600}
tr.b .say{font-size:18px;font-weight:600;margin-right:12px}
tr.b .msg{color:var(--ink-2);font-size:14px}
td{padding:6px 2px;border-bottom:1px solid #f3f3f3;vertical-align:middle}
td.k{width:88px;color:var(--ink-3);font-size:12px;padding-left:24px}
td.q{padding-right:18px;min-width:320px}
td.c{text-align:center;width:62px}
.d{display:inline-block;width:15px;height:15px;border:1.5px solid #d9d9d9;vertical-align:middle}
.d1{border-color:var(--ink);background:linear-gradient(135deg,var(--ink) 50%,transparent 50%)}
.d2{border-color:var(--ink);background:var(--ink)}
tr.blank td.q{color:#E91E7B}tr.blank td.k{color:#E91E7B}
.key{display:flex;gap:18px;font-size:12px;color:var(--ink-2);margin:0 0 10px}.key .d{margin-right:5px;width:12px;height:12px}
.moves{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 28px;max-width:1100px}
.moves b{display:block;font-weight:600;margin-bottom:4px}.moves li{color:var(--ink-2);font-size:14px}
.mine{color:var(--ink-3);font-size:13px;margin:26px 0 0;max-width:80ch}
@media(max-width:820px){.find,.moves{grid-template-columns:1fr}}
</style></head><body><main>
<p class="eyebrow">Study 72 · 4 November 2026</p>
<h1>The bet, against the output</h1>
<p class="lede">Who the customer is, and what has to be true for them to buy.</p>
<p class="bet">A founder or creative, sent by someone they trust, missing one piece.</p>
<p class="sum">Nearly everything we've made says: look at us. The bet needs it to say: that's you, and you'd come out of this looking good.</p>
<div class="find">
<p><span class="big" data-them>${them} of ${maxThem}</span><b>Who they are: answered</b>Taste, range, good company, two people you'd like. The J, the logos, the case studies and the trail all say this, and say it well.</p>
<p><span class="big" data-me>${me} of ${maxMe}</span><b>Who I'd be: nearly empty</b>Nothing tells me I can need this without having failed, or that I'd end up the one who looks smart. Your calls keep landing here: people feel threatened, feel they should have known, don't refer it.</p>
<p><span class="big" data-empty>${emptyRows} of 21</span><b>Questions nothing answers</b>The gap isn't a missing page. No output is built to answer them, so more case studies of the same shape won't fill them.</p>
</div>
<p class="key"><span><i class="d d2"></i>Carries it</span><span><i class="d d1"></i>Partly</span><span><i class="d d0"></i>Not at all</span></p>
<div class="scroll"><table class="m"><thead><tr><th colspan="2"></th>${D.outputs.map(o => `<th><a href="${o[1]}">${o[0]}</a></th>`).join('')}</tr></thead><tbody>
${rows}
</tbody></table></div>
<h2>Three moves I'd start with</h2>
<ul class="moves">
<li><b>Name the situation first</b>The hero and every Work line open on what's stuck, not on what we did. "For Klydo, we built..." becomes what Klydo was stuck on. Rows 1 and 2.</li>
<li><b>Make the client the one who finds it</b>Each case study runs: came for this, it turned out to be that, and they did this with it. Your Packaging question already opens this way, and EWC's Tuesday already finds something. Neither does both yet. Rows 2, 4 and 5.</li>
<li><b>Replace fear with the haunting</b>The July line, the projects that haunt you until they're made, is a cost of waiting that doesn't need dread. It goes on Say hi with a small first step. Rows 3 and 7.</li>
</ul>
<p class="mine">Scores and the sentence beside each belief are my reading, drafted for you and Kahran to argue with. The dated answers and rival bets stay in <a href="../69/index.html">Study 69</a>.</p>
</main></body></html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('them', them, '/', maxThem, 'me', me, '/', maxMe, 'empty', emptyRows, 'beliefs', D.beliefs.map(beliefTotal), 'outputs', D.outputs.map((o, i) => o[0] + ' ' + colTotal(i)).join(', '));
