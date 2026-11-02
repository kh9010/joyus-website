// Study 52: the About section, rough, four ways. Words come from words.json, whole.
// Each layout is its own composition below; only the wire vocabulary is shared. node build.cjs
const fs = require('node:fs');
const path = require('node:path');
const W = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const paras = list => list.map(p => '<p>' + esc(p) + '</p>').join('\n');
const years = '<ol class="years">' + W.kahran.years.map(([y, t]) => '<li><b>' + esc(y) + '</b><span>' + esc(t) + '</span></li>').join('') + '</ol>';
const photo = '<div class="gbox gbox--img photo"><span>photo</span></div>';
const divya = paras(W.divya.paras);
const kahran = paras(W.kahran.paras) + '<p class="quote">' + esc(W.kahran.quote) + '</p>' + years;
const page = (title, css, body, js = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${title}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="wire.css">
<style>
.sec{padding:72px var(--x)}.sec-h{margin:0 0 28px;font-size:1.35rem;font-weight:600}
.photo{aspect-ratio:4/5;position:relative;overflow:hidden}
h3{font:500 1.5rem var(--sans);letter-spacing:-.02em;margin:0 0 12px}
p{margin:0 0 14px;line-height:1.55}
.quote{font-style:italic;color:var(--mute)}
.years{list-style:none;margin:20px 0 0;padding:14px 0 0;border-top:1px solid var(--line);font-size:14px}
.years li{display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;padding:3px 0}.years b{font:13px var(--mono);color:var(--mute);font-weight:400}
${css}
</style></head><body><section class="sec" id="about"><h2 class="sec-h">About</h2>
${body}
</section>${js}</body></html>
`;
const out = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);

// A: side by side. The two are equals; the difference in length is visible and left alone.
out('about-a.html', page('A / Side by side', `
.two{display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,5vw,72px);align-items:start;max-width:1180px}
.two .photo{max-width:320px;margin-bottom:18px}
@media(max-width:720px){.two{grid-template-columns:1fr}}`,
`<div class="two"><article>${photo}<h3>Divya Tak</h3>${divya}</article><article>${photo}<h3>Kahran Singh</h3>${kahran}</article></div>`));

// B: one after the other. Each gets the full width in turn, the photo crossing sides.
out('about-b.html', page('B / One after the other', `
.who{display:grid;grid-template-columns:minmax(200px,1fr) minmax(0,2.2fr);gap:clamp(24px,5vw,64px);align-items:start;max-width:1080px;padding:0 0 64px}
.who.flip{grid-template-columns:minmax(0,2.2fr) minmax(200px,1fr)}.who.flip .photo{order:2}
@media(max-width:720px){.who,.who.flip{grid-template-columns:1fr}.who.flip .photo{order:0}.who .photo{max-width:260px}}`,
`<article class="who">${photo}<div><h3>Divya Tak</h3>${divya}</div></article><article class="who flip">${photo}<div><h3>Kahran Singh</h3>${kahran}</div></article>`));

// C: one at a time. Two names; picking one swaps the whole of the section.
out('about-c.html', page('C / One at a time', `
.names{display:flex;gap:28px;margin:0 0 32px;flex-wrap:wrap}
.names button{all:unset;cursor:pointer;font:500 clamp(1.8rem,5vw,3.4rem)/1.1 var(--sans);letter-spacing:-.03em;color:var(--line);padding:4px 0;border-bottom:3px solid transparent}
.names button[aria-selected=true]{color:var(--ink);border-color:var(--ink)}
.names button:focus-visible{outline:2px solid var(--ink);outline-offset:4px}
.one{display:grid;grid-template-columns:minmax(200px,1fr) minmax(0,2.2fr);gap:clamp(24px,5vw,64px);align-items:start;max-width:1080px}
.one[hidden]{display:none}
@media(max-width:720px){.one{grid-template-columns:1fr}.one .photo{max-width:260px}}`,
`<div class="names" role="tablist" aria-label="Who"><button role="tab" aria-selected="true" aria-controls="p-d" data-t="p-d">Divya Tak</button><button role="tab" aria-selected="false" aria-controls="p-k" data-t="p-k">Kahran Singh</button></div>
<article class="one" id="p-d" role="tabpanel">${photo}<div>${divya}</div></article><article class="one" id="p-k" role="tabpanel" hidden>${photo}<div>${kahran}</div></article>`,
`<script>document.querySelectorAll('.names button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.names button').forEach(function(x){var on=x===b;x.setAttribute('aria-selected',on);document.getElementById(x.dataset.t).hidden=!on;});});});</script>`));

// D: short first. Both fit one screen; the rest opens in place. Whole paragraphs only, never a cut sentence.
const dRest = paras(W.divya.paras.slice(1));
const kFirst = paras(W.kahran.paras.slice(0, 2));
const kRest = paras(W.kahran.paras.slice(2)) + '<p class="quote">' + esc(W.kahran.quote) + '</p>' + years;
out('about-d.html', page('D / Short first', `
.two{display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,5vw,72px);align-items:start;max-width:1180px}
.head{display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;align-items:center;margin-bottom:16px}
.head h3{margin:0}
details summary{cursor:pointer;font-size:14px;color:var(--mute);padding:6px 0;text-decoration:underline;text-underline-offset:3px}
details[open] summary{margin-bottom:10px}
@media(max-width:720px){.two{grid-template-columns:1fr}}`,
`<div class="two"><article><div class="head">${photo}<h3>Divya Tak</h3></div>${paras(W.divya.paras.slice(0, 1))}<details><summary>the rest</summary>${dRest}</details></article>
<article><div class="head">${photo}<h3>Kahran Singh</h3></div>${kFirst}<details><summary>the rest</summary>${kRest}</details></article></div>`));
console.log('four layouts written');
