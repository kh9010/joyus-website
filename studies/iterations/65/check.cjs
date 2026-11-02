// Study 65: one idea per page: no separate panel of stones and panel of words; their words from one place; pictures exist.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
for (const n of ['wall', 'cairn', 'trail']) {
  const h = read('about-' + n + '.html');
  say(h.includes("fetch('../59/words.json')"), n + ': their words, from one place');
  say(!/position:\s*sticky|class="(l|r|stage|words|panel)"/.test(h), n + ': no panel for the stones beside a panel for the words');
}
const html = read('index.html');
const refs = [...html.matchAll(/(?:href|src)="((?:img\/|about-)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost.join() : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'the study page is under 100 words (' + words + ')');
process.exitCode = bad ? 1 : 0;
