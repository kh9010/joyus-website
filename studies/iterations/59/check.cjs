// Study 59: the words stay whole on every page; Take a stone is the real worker and look, not an imitation.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const W = JSON.parse(read('words.json'));
const src = JSON.parse(read('../52/words.json'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
say(W.K.join() === src.kahran.paras.join() && W.D.join() === src.divya.paras.join(), 'words.json is both Abouts, unchanged');
for (const n of [1, 2, 4, 5]) {
  const h = read('about-' + n + '.html');
  say([...W.D, ...W.K].every(p => h.includes(esc(p))), 'page ' + n + ': both Abouts whole');
}
const three = read('about-3.html');
say(W.K.every(p => three.includes(JSON.stringify(p))), 'page 3: each of his paragraphs is one whole cell');
const six = read('about-6.html');
say(W.K.every(p => six.includes(esc(p))), 'page 6: each of his paragraphs is one whole balloon');
const stone = read('about-stone.html');
say(stone.includes("new Worker('../41/jbuilder.js'") && stone.includes("from '../41/looks/gummy.js'") && stone.includes('cells: 40'), 'Take a stone uses the live page\'s worker, look and forty stones');
for (const f of ['../41/jbuilder.js', '../41/looks/gummy.js', '../41/masks1024/rubik.png']) say(fs.existsSync(path.join(__dirname, f)), f + ' is there');
const html = read('index.html');
const refs = [...html.matchAll(/(?:href|src)="((?:img\/|about-)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost.join() : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'the study page is under 100 words (' + words + ')');
process.exitCode = bad ? 1 : 0;
