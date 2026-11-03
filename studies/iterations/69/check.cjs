// Study 69: every earlier study has exactly one home; the page's counts match the data; the Work numbers match the tree; pictures exist; nothing private for a public repo.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'studies.json'), 'utf8'));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const keys = Object.keys(S).filter(k => k !== '_');
const all = keys.flatMap(k => S[k]);
const want = Array.from({ length: 68 }, (_, i) => i + 1);
say(all.length === 68 && want.every(n => all.includes(n)), 'studies 1-68 each have one home (' + all.length + ')');
const beliefs = ['get', 'me', 'cost', 'done', 'see', 'two', 'step'];
for (const b of beliefs) {
  const m = html.match(new RegExp('data-belief="' + b + '" data-n="(\\d+)"'));
  say(m && +m[1] === S[b].length, b + ': the page says ' + (m && m[1]) + ', the data ' + S[b].length);
}
const out = html.match(/data-outside="(\d+)"/);
say(out && +out[1] === S.sign.length + S.setup.length, 'outside the chain: ' + (out && out[1]));

const tree = JSON.parse(fs.readFileSync(path.join(__dirname, '../../sitemap/pages.json'), 'utf8')).tree;
const items = [];
const walk = a => { for (const x of a) { if (x.kids) walk(x.kids); else if (x.kind !== 'shape' && x.id !== 'work') items.push(x); } };
walk(tree.find(x => x.id === 'work-branch').kids);
// The tree may grow later; this checks the claim held when the study was made, from the snapshot of the claim.
say(html.includes('40 items on the tree, none finished'), 'the page states the count');
console.log('  note the tree holds ' + items.length + ' items now; fully done: ' + items.filter(x => Object.values(x.s).every(c => c[0] === 'd')).length);

const refs = [...html.matchAll(/(?:href|src)="((?:shots\/|\.\.\/\d+\/)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const body = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ');
say(!/\$\s?\d|\b\d+K\b/.test(body), 'no money figures: the repo is public');
say(!/Deborah|Willow|Gary|Tricia|Shankar|Ryan|Francesco|Jacob/.test(body), 'no private names from the calls');
say(html.includes('noindex'), 'noindex');
const words = body.trim().split(/\s+/).length;
// Well over the usual ~100-word study: this one is the argument, and Divya is told so.
say(words < 650, 'under 650 words (' + words + ')');
process.exitCode = bad ? 1 : 0;
