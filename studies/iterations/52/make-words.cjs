// Pulls both Abouts out of their sources into words.json, whole. Run once per update of source/.
const fs = require('node:fs');
const path = require('node:path');
const src = f => fs.readFileSync(path.join(__dirname, 'source', f), 'utf8');
const text = s => s.replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const ast = src('divya-about.astro');
const st = /<div class="statement">([\s\S]*?)<\/div>/.exec(ast)[1];
const divya = [...st.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => text(m[1]));
const k = src('kahran-about.html');
const start = k.indexOf('<p class="lede">');
const end = k.indexOf('<div class="word-pile"');
const paras = [...k.slice(start, end).matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => text(m[1]));
const quote = text(/<p class="quote-fallback">([\s\S]*?)<\/p>/.exec(k)[1]);
const ol = /<ol class="years">([\s\S]*?)<\/ol>/.exec(k)[1];
const years = [...ol.matchAll(/<li><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map(m => [text(m[1]), text(m[2])]);
fs.writeFileSync(path.join(__dirname, 'words.json'), JSON.stringify({ _: 'Word for word: Divya from divyatak.art/about, Kahran from kahransingh.com/about.html, 2 Nov 2026. Never split or edit.', divya: { paras: divya }, kahran: { paras, quote, years } }, null, 1));
console.log(divya.length, paras.length, years.length);
