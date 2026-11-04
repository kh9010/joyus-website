// Study 71, as Study 70: two pages that link to each other, labels never squished at any beat, no source artwork, pictures exist, short study page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const pk = read('packaging.html'), br = read('branding.html'), ix = read('index.html');
say(pk.includes('href="branding.html"') && br.includes('href="packaging.html"'), 'the two pages link to each other');
for (const [n, h] of [['packaging', pk], ['branding', br]]) {
  const lost = [...new Set([...h.matchAll(/(?:\.\.\/70\/)?img\/[\w-]+\.(?:jpg|png)/g)].map(m => m[0]))].filter(f => !fs.existsSync(path.join(__dirname, f)));
  say(!lost.length, n + ': its pictures exist' + (lost.length ? ': not ' + lost : ''));
  say(h.includes('noindex'), n + ': noindex');
}
say(pk.includes('How do you communicate') && pk.includes('nature and'), 'packaging opens on her question, with "nature and" added to it');
const order = ['id="l1"', 'id="l2"', 'id="l3"', 'id="l4"'].map(s => pk.indexOf(s));
say(order.every((v, i) => v > 0 && (!i || v > order[i - 1])), 'motifs, label, each border, all the products, in her order');
const rep = JSON.parse(read('report.json'));
say(!rep.squished.length, 'every label drawn at its own proportion at every beat' + (rep.squished.length ? ': ' + JSON.stringify(rep.squished[0]) : ''));
for (const [k, v] of Object.entries(rep.wide)) say(v.broken === 0 && v.errors === 0 && v.width[0] === v.width[1], k + ': no broken pictures, errors or sideways scroll');
const older = ['packaging.html', 'branding.html'].filter(f => fs.statSync(path.join(__dirname, f)).mtimeMs > fs.statSync(path.join(__dirname, 'report.json')).mtimeMs);
say(!older.length, 'the report is newer than the pages' + (older.length ? ': not ' + older : ''));
const refs = [...ix.matchAll(/(?:href|src)="((?:shots\/|img\/|\.\.\/70\/|packaging|branding)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures on the study page exist' + (lost.length ? ': not ' + lost : ''));
const words = ix.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'study page under 100 words (' + words + ')');
say(!fs.readdirSync(path.join(__dirname, 'img')).some(x => /\.(ai|psd|pdf)$/i.test(x)), 'no source artwork');
const size = fs.readdirSync(path.join(__dirname, 'img')).reduce((a, f) => a + fs.statSync(path.join(__dirname, 'img', f)).size, 0);
say(size < 12e6, 'pictures under 12 MB (' + (size / 1e6).toFixed(1) + ')');
say(/Lato|0\.456|3000 \/ 1368/.test(pk), "packaging uses the mockups' label proportion");
process.exitCode = bad ? 1 : 0;
