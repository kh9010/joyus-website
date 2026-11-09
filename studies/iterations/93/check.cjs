// Study 93: 92 final's words, set in the site's own design language (Divya's system), four layouts behind ?v=a|b|c|d.
// Kahran approved 92 final's content (~80% there) and said of its layout: "it's a shitty layout and doesn't match the
// rest of the site". Pinned here:
//  - case.html holds exactly four options (a six stones, b six cards, c a dark section, d like the front page), one
//    shown at a time (?v, a by default); noindex;
//  - the words are 92 final's, character for character and in order (whitespace aside: markup decides the breaks), in every option; the only words added are the
//    site's nav (work · about · say hi), flagged on index.html; stone images carry no alt words (decorative);
//  - public-repo rules: no em dash in our words (case.html, index.html); no figure on the page but $5–10K and the
//    footer's 2026; no client person's or prospect's name (read off the workshop board, as 46/83-92);
//  - Study 92 untouched: final.html and picks.json are what the branch committed;
//  - index.html: Kahran's note, the design system with its sources, each option, the 390 pictures; every picture exists;
//  - live, in headless Chrome against an in-process server of the repo: each option alone, no page errors, nothing
//    past the edge, no text under 13px, body text (lede, quotes, our paragraph, the "what fits" lines, the cost, the
//    close) at least 16px, every text 4.5:1 against what it sits on, the words again as rendered, and at 390 at most
//    2,110px tall (2.5 phone screens; 92 final is 1,332px).
//   node studies/iterations/93/check.cjs
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFile, spawnSync } = require('node:child_process');
const here = __dirname;
const ROOT = path.resolve(here, '../../..');
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const OPTS = ['a', 'b', 'c', 'd'];
const NAMES = { a: 'Six stones', b: 'Six cards', c: 'A dark section', d: 'Like the front page' };
const CEIL = 2110;

const html = read('case.html');
const index = read('index.html');
const final92 = fs.readFileSync(path.join(here, '../92/final.html'), 'utf8');
const unent = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const textOf = (h) => unent(h.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '));
const squash = (s) => s.replace(/\s+/g, '');
const words = (s) => s.replace(/\s+/g, ' ').replace(/ ([.,:;])/g, '$1').trim();
const option = (v) => html.replace(/<main class="case" data-opt="([a-d])">[\s\S]*?<\/main>/g, (m, o) => (o === v ? m : '')).replace(/<nav aria-label="site">[\s\S]*?<\/nav>/, '');
const want = textOf(final92);

console.log('the options');
const cases = [...html.matchAll(/<main class="case" data-opt="([a-z])"/g)].map((m) => m[1]);
JSON.stringify(cases) === JSON.stringify(OPTS) ? ok('four options in case.html: ' + cases.join(' ')) : fail('options are ' + cases.join(' '));
/dataset\.v = \(\/\[\?&\]v=\(\[abcd\]\)\/\.exec\(location\.search\) \|\| \[0, 'a'\]\)\[1\]/.test(html) && /if \(c\.dataset\.opt !== document\.documentElement\.dataset\.v\) c\.remove\(\)/.test(html)
  ? ok('?v picks the option, a by default; the other three leave the page') : fail('the ?v switch is not there');
/<meta name="robots" content="noindex">/.test(html) ? ok('case.html is noindex') : fail('case.html has no noindex');
/<link[^>]+family=Space\+Grotesk/.test(html) && !/serif['"]?\s*[;,}]|Caveat|Newsreader|DM Serif/i.test(html.replace(/sans-serif/g, '')) ? ok('Space Grotesk only, no serif (CLAUDE.md)') : fail('a font other than Space Grotesk');

console.log('the words (92 final, character for character)');
for (const v of OPTS) {
  const got = textOf(option(v));
  squash(got) === squash(want) ? ok(v + ' · ' + NAMES[v] + ': the words are 92 final\'s, in order') : fail(v + ': the words differ from 92 final near "' + (() => { const a = squash(got), b = squash(want); let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(Math.max(0, i - 30), i + 30); })() + '"');
}
const nav = (html.match(/<nav aria-label="site">([\s\S]*?)<\/nav>/) || [, ''])[1];
words(textOf(nav)) === 'work about say hi' ? ok('the one addition: the site nav "work about say hi" (rev 4, Study 13, Study 70), flagged on index.html') : fail('the nav says ' + words(textOf(nav)));
/the nav[^.]*work[^.]*about[^.]*say hi/i.test(textOf(index)) ? ok('index.html flags the nav as words 92 final did not have') : fail('index.html does not flag the nav');
[...html.matchAll(/<img [^>]*>/g)].every((m) => /alt=""/.test(m[0])) ? ok('every image is decorative (alt=""), so no words ride in on them') : fail('an image carries alt words');

console.log('public-repo rules');
const seen = OPTS.map((v) => textOf(option(v))).join(' ');
!/—/.test(textOf(html) + textOf(index) + html.replace(/<style[\s\S]*?<\/style>/g, '')) ? ok('no em dash in case.html or index.html') : fail('an em dash in our words');
const figures = [...seen.matchAll(/\S*\d\S*/g)].map((m) => m[0]).filter((t) => !/^\$5–10K\.?$/.test(t) && t !== '2026');
figures.length ? fail('a figure on the page other than $5–10K and the footer\'s 2026: ' + figures[0]) : ok('no figure on the page but $5–10K (and the footer\'s © 2026)');
const ewc = path.join(os.homedir(), 'dev/ewc');
const boardFile = path.join(ewc, 'EWC workshopsession2fill.excalidraw');
if (fs.existsSync(boardFile)) {
  const blob = html + index + read('check.cjs').replace(/^[\s\S]*?\nconst fs/, '');
  const board = JSON.parse(fs.readFileSync(boardFile, 'utf8')).elements.filter((e) => e.type === 'text' && !e.isDeleted).map((e) => e.text);
  const full = [];
  for (const t of board) for (const m of t.matchAll(/(?:^|\n)([A-Z][a-z]+) ([A-Z][a-z]+) -/g)) full.push([m[1], m[2]]);
  const guideText = fs.readFileSync(path.join(here, '../86/personas.json'), 'utf8');
  const needles = full.flatMap(([f, l]) => [f + ' ' + l, f, ...(new RegExp('\\b' + l + '\\b').test(guideText) ? [] : [l])]);
  const leaked = needles.filter((n) => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? ok('read ' + full.length + ' prospect names off the board') : fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? fail(leaked.length + ' prospect name(s) in Study 93') : ok('no prospect name in case.html or index.html');
  const line = board.find((t) => /^\d+ min\s+·\s+/.test(t)) || '';
  const people = line.replace(/^\d+ min\s+·\s+/, '').split(/,\s*/).map((x) => x.trim()).filter((x) => x && !/^(Kahran|Divya)$/.test(x));
  const met = people.filter((n) => new RegExp('\\b' + n + '\\b', 'i').test(blob));
  people.length >= 2 ? ok('read ' + people.length + ' client attendees off the board') : fail('expected the workshop\'s attendees, found ' + people.length);
  met.length ? fail(met.length + ' client person name(s) in Study 93') : ok('no name of the club\'s people in Study 93');
} else ok('~/dev/ewc not on this machine: name checks skipped');

console.log('Study 92 untouched');
for (const f of ['final.html', 'picks.json']) {
  const r = spawnSync('git', ['show', 'HEAD:studies/iterations/92/' + f], { cwd: ROOT, encoding: 'utf8' });
  r.status === 0 && r.stdout === fs.readFileSync(path.join(here, '../92', f), 'utf8') ? ok('92/' + f + ' is as committed') : fail('92/' + f + ' changed');
}

console.log('the study page');
/class="eyebrow">Study 93 /.test(index) && /<meta name="robots" content="noindex/.test(index) ? ok('index.html is Study 93, noindex') : fail('index.html eyebrow or noindex');
OPTS.every((v) => index.includes(`href="case.html?v=${v}"`) && index.includes(NAMES[v])) ? ok('index.html links all four by name') : fail('index.html is missing an option');
/shitty layout and doesn't match the rest of the site/.test(index) ? ok('index.html quotes Kahran\'s note') : fail('Kahran\'s note is not on index.html');
const cites = ['CLAUDE.md', 'DESIGN-GUIDE.md', 'CASE-STUDY-ARCHITECTURE.md', 'work/agemo.html', 'Study 70', 'Study 67', 'Study 40', 'Study 13'];
const miss = cites.filter((c) => !index.includes(c));
miss.length ? fail('the design notes do not cite ' + miss.join(', ')) : ok('the design notes cite their sources: ' + cites.join(', '));
const pics = [...OPTS.flatMap((v) => ['case-' + v + '-390', 'case-' + v + '-1280']), 'stone-1', 'stone-2', 'stone-3', 'stone-4', 'stone-5', 'stone-6', 'j', 'hers-agemo-1280', 'hers-agemo-390'];
const missing = pics.filter((f) => !fs.existsSync(path.join(here, 'img', f + '.png')));
missing.length ? fail('missing img/' + missing.join('.png, img/') + '.png') : ok(pics.length + ' pictures in img/');
OPTS.every((v) => index.includes(`img/case-${v}-390.png`)) ? ok('index.html shows each option at 390') : fail('index.html is missing a 390 picture');

// live
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
server.listen(0, '127.0.0.1', () => {
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  execFile(process.execPath, [path.join(here, 'measure.mjs'), base], { timeout: 240000, maxBuffer: 1 << 24 }, (err, stdout, stderr) => {
    server.close();
    console.log('live (headless Chrome, 390 and 1280)');
    let out = null;
    try { out = JSON.parse(stdout); } catch { fail('measure.mjs did not run: ' + (err ? err.message : '') + ' ' + String(stderr).slice(0, 300)); }
    if (out) {
      const live92 = out.final92[390];
      for (const v of OPTS) for (const w of ['390', '1280']) {
        const x = out[v][w], tag = v + ' at ' + w;
        JSON.stringify(x.shown) === JSON.stringify([v]) ? ok(tag + ': only option ' + v + ' on the page') : fail(tag + ': options on the page ' + x.shown);
        x.errors.length ? fail(tag + ': page errors ' + x.errors[0]) : ok(tag + ': no page errors');
        x.overflow.length ? fail(tag + ': past the edge: ' + x.overflow.join(', ')) : ok(tag + ': nothing past the edge');
        x.small.length ? fail(tag + ': text under 13px: ' + x.small[0]) : ok(tag + ': no text under 13px');
        x.body.length ? fail(tag + ': body text under 16px: ' + x.body[0]) : ok(tag + ': body text 16px or more');
        x.contrast.length ? fail(tag + ': under 4.5:1: ' + x.contrast[0]) : ok(tag + ': every text 4.5:1 or more against its ground');
        squash(x.text) === squash(live92.text) ? ok(tag + ': the words as rendered are 92 final\'s') : fail(tag + ': the rendered words differ from 92 final');
        if (w === '390') x.height <= CEIL ? ok(tag + ': ' + x.height + 'px tall (ceiling ' + CEIL + '; 92 final ' + live92.height + ')') : fail(tag + ': ' + x.height + 'px tall, over ' + CEIL);
      }
    }
    console.log(failures ? `\n${failures} failure(s)` : '\nall checks pass');
    process.exit(failures ? 1 : 0);
  });
});
