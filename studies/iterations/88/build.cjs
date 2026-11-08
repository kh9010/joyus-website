// Study 88: the four pages the blind judges passed against Kahran's 8 Nov frame (brief.md), joined into one page
// behind ?v=a|b|c|d, as built. src/a-d.html are the candidate pages exactly as judged; this copies each one's font
// link, <style> and <body> into case.html, one .case per option, and a small switch keeps only the asked-for
// option's font, style and body. Images point at img/. Nothing else in the pages changes.
//   node studies/iterations/88/build.cjs
const fs = require('node:fs');
const path = require('node:path');

const OPTIONS = [
  { v: 'a', name: 'The equation', src: 'r2-4', ten: [1, 1], total: 29 },
  { v: 'b', name: 'The Made Page', src: 'r2-2', ten: [1, 2], total: 30 },
  { v: 'c', name: 'The Meeting Point', src: 'r2-3', ten: [1, 1], total: 30 },
  { v: 'd', name: 'Who and what, solved together', src: 'r2-1', ten: [1, 1], total: 28 },
];
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

function parts(v) {
  const h = read('src/' + v + '.html');
  const style = (h.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
  const body = (h.match(/<body>([\s\S]*?)<\/body>/) || [])[1];
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const font = (h.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)" rel="stylesheet">/) || [])[1];
  if (!style || !body || !title || !font) throw new Error('src/' + v + '.html: no style, body, title or font');
  return { style, title, font, body: body.replace(/src="(front|guide)\.png"/g, 'src="img/$1.png"') };
}

function build() {
  const P = Object.fromEntries(OPTIONS.map(o => [o.v, parts(o.v)]));
  const titles = JSON.stringify(Object.fromEntries(OPTIONS.map(o => [o.v, P[o.v].title])));
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${P.a.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${OPTIONS.map(o => `<link data-opt="${o.v}" href="${P[o.v].font}" rel="stylesheet">`).join('\n')}
<style>${OPTIONS.map(o => `html[data-v="${o.v}"] .case:not([data-opt="${o.v}"])`).join(', ')} { display:none; }</style>
${OPTIONS.map(o => `<style data-opt="${o.v}">${P[o.v].style}</style>`).join('\n')}
<script>
(function () {
  var v = new URLSearchParams(location.search).get('v');
  v = /^[a-d]$/.test(v || '') ? v : 'a';
  document.documentElement.dataset.v = v;
  document.querySelectorAll('style[data-opt], link[data-opt]').forEach(function (s) { if (s.dataset.opt !== v) s.remove(); });
  document.title = (${titles})[v];
})();
</script>
</head>
<body>
${OPTIONS.map(o => `<div class="case" data-opt="${o.v}">${P[o.v].body}</div>`).join('\n')}
<script>document.querySelectorAll('.case').forEach(function (c) { if (c.dataset.opt !== document.documentElement.dataset.v) c.remove(); });</script>
</body>
</html>
`;
}

module.exports = { OPTIONS, build };
if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, 'case.html'), build());
  console.log('wrote case.html');
}
