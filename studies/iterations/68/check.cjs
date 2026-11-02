// Study 68: three wireframes, few things each; label border cut at its own proportions; no source artwork; pictures exist; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
for (const n of ['pull', 'frame', 'gather']) {
  const h = read('case-' + n + '.html');
  const imgs = [...h.matchAll(/img\/([\w-]+\.(?:jpg|png))/g)].map(m => m[1]);
  const lost = [...new Set(imgs)].filter(f => !fs.existsSync(path.join(__dirname, 'img', f)));
  say(!lost.length, n + ': its pictures exist' + (lost.length ? ': not ' + lost : ''));
  say(h.includes('Packaging rendered for this page'), n + ': says the packaging is rendered');
}
const f = read('case-frame.html');
say(f.includes('135 222 137 220') && f.includes('calc(135px*var(--k)) calc(222px*var(--k)) calc(137px*var(--k)) calc(220px*var(--k))'), 'frame: border scaled by one number');
const html = read('index.html');
const refs = [...html.matchAll(/(?:href|src)="((?:shots\/|case-)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
const all = fs.readdirSync(path.join(__dirname, 'img'));
say(!all.some(x => /\.(ai|psd)$/i.test(x)), 'no source artwork');
process.exitCode = bad ? 1 : 0;
