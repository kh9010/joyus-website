// Writes index.html from refs.json: the 20 picks, grouped by move, a picture
// and one line each. Same script in Studies 14 and 15. node build.cjs
const fs = require('fs');
const path = require('path');
const here = __dirname;
const { captured, sets, refs } = JSON.parse(fs.readFileSync(path.join(here, 'refs.json'), 'utf8'));
const META = {
  '14': { title: 'About pages', lede: 'Twenty ways studios and people say who they are.' },
  '15': { title: 'Work pages', lede: 'Twenty ways studios show a body of work.' },
}[path.basename(here)];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const card = (r) => `<a class="ref" href="${esc(r.url)}" target="_blank" rel="noopener"><img src="img/${r.slug}.jpg" alt="${esc(r.name)}" loading="lazy"><b>${esc(r.name)}</b><span>${esc(r.idea)}</span></a>`;
const cut = refs.filter(r => !r.picked);
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${path.basename(here)} / ${META.title} — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
.set{margin-top:36px}
.set h2{margin:0 0 12px;padding-top:12px}
.refs{display:grid;grid-template-columns:repeat(4,1fr);gap:22px 18px}
.ref{text-decoration:none;display:grid;gap:6px;align-content:start}
.ref img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border:1px solid var(--line)}
.ref:hover img{border-color:var(--ink)}
.ref b{font-weight:600;font-size:14px}
.ref span{font-size:13px;color:var(--ink-2);line-height:1.4}
@media(max-width:1100px){.refs{grid-template-columns:repeat(3,1fr)}}
@media(max-width:720px){.refs{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<main>
<p class="eyebrow">Study ${path.basename(here)} · 1 October 2026</p>
<h1>${META.title}</h1>
<p class="lede">${META.lede}</p>
${sets.map(([name, slugs]) => `<section class="set"><h2>${esc(name)}</h2><div class="refs">${slugs.map(s => card(refs.find(r => r.slug === s))).join('')}</div></section>`).join('\n')}
<details class="notes"><summary>Looked at ${refs.length}, kept ${refs.length - cut.length}</summary><div class="body"><p>Cut: ${cut.map(r => esc(r.name)).join(', ')}.</p></div></details>
<p class="source">Screenshots of the live sites, ${captured}. Click one to visit.</p>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(here, 'index.html'), html);
console.log('wrote index.html:', sets.reduce((n, s) => n + s[1].length, 0), 'refs in', sets.length, 'sets');
