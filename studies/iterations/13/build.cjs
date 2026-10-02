// Study 13: the one-pager. Takes Study 12's homepage and piece page and
// folds the site into two kinds of page: onepager.html (work, about, say hi)
// and piece.html / experiment.html (the details). node build.cjs
const fs = require('fs');
const path = require('path');
const s12 = (f) => fs.readFileSync(path.join(__dirname, '../12/site', f), 'utf8');
const out = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);
function must(s, from, to, what) {
  if (!(typeof from === 'string' ? s.includes(from) : from.test(s))) throw new Error('no match: ' + what);
  return s.replace(from, to);
}
const NAV = '<header class="nav"><a class="gbox" href="onepager.html">wordmark</a><ul><li><a href="onepager.html#work">work</a></li><li><a href="onepager.html#about">about</a></li><li><a href="onepager.html#say-hi">say hi</a></li></ul></header>';
const FOOT = '<footer class="foot"><div><a class="gbox" href="onepager.html">wordmark</a><p style="margin-top:12px">© 2026 · Joyus Studio · Kahran Singh &amp; Divya Tak</p></div><div>say hi<ul><li><a href="mailto:hello@joyus.studio">hello@joyus.studio</a></li></ul></div><div>find us<ul><li><a href="../../../podcast.html">podcast</a></li></ul></div></footer>';

// the one page
let h = s12('index.html');
h = must(h, '<title>Prototype — Joyus homepage (round 4, wired)</title>', '<title>Wireframe — the one-pager</title>', 'title');
h = must(h, '<header id="nav"></header>', NAV, 'nav');
h = must(h, '<footer id="foot"></footer>', FOOT, 'foot');
h = must(h, '<script src="chrome.js"></script>\n', '', 'chrome');
h = must(h, '<h2><a href="newsletter.html">Newsletter</a></h2>', '<h2>Newsletter</h2>', 'news head');
h = must(h, ' See <a href="newsletter.html">past issues</a>.', '', 'news done');
h = must(h, '<p class="fine">We only use your email for this. <a href="privacy.html">privacy</a></p>', '<p class="fine">We only use your email for this.</p>', 'privacy');
h = must(h, '<div class="pills" role="tablist" id="pills"></div>', '<div id="work" style="scroll-margin-top:20px"></div>\n<div class="pills" role="tablist" id="pills"></div>', 'work anchor');
// the panel gets its href from the rotation; no "#" placeholder before that
h = must(h, '<a class="panel" id="panel" href="#" aria-live="polite">', '<a class="panel" id="panel" aria-live="polite">', 'panel href');
// logos: just logos, as the brief had it
h = must(h, "WALL.map(c => `<a class=\"gbox\" href=\"${clientHref(c)}\">${esc(SITE.clients[c].name)}</a>`)", "WALL.map(c => `<div class=\"gbox\">${esc(SITE.clients[c].name)}</div>`)", 'logos');
h = must(h, '  .logos a{height:80px}', '  .logos .gbox{height:80px}', 'logo css');
// about + say hi, new and empty: blanks to fill, not the old pages' copy
const NEW = `
<section class="sec" id="about">
  <h2 class="sec-h">About</h2>
  <p class="big lorem">[who we are, in one or two lines]</p>
  <div class="two">
    <div class="who"><div class="gbox gbox--img"><span>photo</span></div><b>Kahran Singh</b><p class="lorem">[one line]</p></div>
    <div class="who"><div class="gbox gbox--img"><span>photo</span></div><b>Divya Tak</b><p class="lorem">[one line]</p></div>
  </div>
</section>

<section class="sec" id="say-hi">
  <h2 class="sec-h">Say hi</h2>
  <p class="big lorem">[one line]</p>
  <form class="hi" onsubmit="event.preventDefault();this.outerHTML='<p class=big>Thanks. Talk soon.</p>'">
    <input placeholder="name" aria-label="name"><input type="email" placeholder="email" aria-label="email">
    <textarea placeholder="what's on your mind" aria-label="message"></textarea>
    <button type="submit">send</button>
  </form>
</section>
`;
h = must(h, '\n<footer class="foot">', NEW + '\n<footer class="foot">', 'sections');
h = must(h, '</style>', `  .sec{padding:88px var(--x);border-top:1px solid var(--line);scroll-margin-top:0}
  .sec-h{margin:0 0 18px;font-size:1.35rem;font-weight:600}
  .big{font:500 clamp(1.6rem,3.2vw,2.8rem)/1.15 var(--sans);letter-spacing:-.03em;margin:0 0 40px;max-width:24ch}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:28px;max-width:560px}
  .who .gbox{aspect-ratio:4/5;margin-bottom:12px}
  .who b{font:500 1.2rem var(--sans)}.who p{margin:4px 0 0}
  .hi{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:760px}
  .hi input,.hi textarea{font:inherit;padding:12px 14px;border:1px solid var(--line);background:#fff}
  .hi textarea{grid-column:1/-1;min-height:140px}
  .hi button{justify-self:start;border:0;background:var(--ink);color:#fff;border-radius:999px;padding:12px 26px;font:500 1rem var(--sans)}
  @media (max-width:820px){ .two,.hi{grid-template-columns:1fr} }
</style>`, 'css');
out('onepager.html', h);

// the details: Study 12's piece + experiment templates, pointed back at the one page
for (const f of ['piece.html', 'experiment.html']) {
  let p = s12(f);
  p = must(p, '<header id="nav"></header>', NAV, 'nav ' + f);
  p = must(p, '<footer id="foot"></footer>', FOOT, 'foot ' + f);
  p = must(p, '<script src="chrome.js"></script>\n', '', 'chrome ' + f);
  // no work index any more: the crumb goes back to the work on the one page; tags are just tags
  p = p.replace(/<a href="work\.html\?pill=\$\{me\.pill\}">/, '<a href="onepager.html#work">').replace('<a href="work.html?pill=exp">Experiments</a>', '<a href="onepager.html#work">Experiments</a>');
  p = p.replace('`<li><a href="work.html?tag=${slugTag(t)}">${esc(t)}</a></li>`', '`<li><span>${esc(t)}</span></li>`');
  p = p.replace('<a class="all" href="work.html?pill=exp"><span>All ten experiments →</span></a>', '');
  // no client pages any more: the client is a name
  p = p.replace('const clientLink = cl.page ? `<a href="client.html?c=${me.clientSlug}">${esc(cl.name)}</a>` : esc(cl.name);', 'const clientLink = esc(cl.name);');
  p = p.replace("${cl.page ? `<a href=\"client.html?c=${me.clientSlug}\">All ${sibs.length + 1} ${esc(cl.name)} pieces →</a>` : ''}", '');
  p = p.replace(/<a href="say-hi\.html\?from=\$\{me\.slug\}">say hi<\/a>/, '<a href="onepager.html#say-hi">say hi</a>');
  p = p.replace(/href="work\.html[^"]*"/g, 'href="onepager.html#work"');
  const left = (p.match(/(work|client|about|say-hi|newsletter|privacy|kahran-singh|divya-tak)\.html/g) || []);
  if (left.length) throw new Error(f + ' still links to removed pages: ' + left.join(', '));
  out(f, p);
}
console.log('ok');
