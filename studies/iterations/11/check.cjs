// Study 11: newsletter + privacy. Adds page type "issue" (A only) and uses
// "external" (Study 05). The privacy page's claims are tested against the code
// they describe; issue 01 is tested against the rounds Studies 04 and 05 drew.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const here = (f) => path.join(__dirname, f);
const read = (f) => fs.readFileSync(here(f), 'utf8');
const repo = path.resolve(__dirname, '../../..');
const rf = (f) => fs.readFileSync(path.join(repo, f), 'utf8');
const { ROUNDS, inQuarter } = require('./rounds.js');
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '');

console.log('pages');
for (const [f, extra] of [['news-a-on-site.html', ['issue', 'external']], ['news-b-platform.html', ['external']], ['issue-01.html', []], ['privacy.html', []]]) {
  const html = read(f);
  w.links(strip(html), r, extra);
  w.chrome(html, r);
}

// the archive, both ways, at launch (0 issues) and after one quarter
console.log('archive, run');
function runArchive(f, n) {
  const el = { innerHTML: '' }; const c = { document: { getElementById: () => el } };
  vm.createContext(c); vm.runInContext((read(f).match(/<script id="archive">([\s\S]*?)<\/script>/) || [])[1], c);
  c.archive(new URLSearchParams(n ? 'issues=' + n : '')); return el.innerHTML;
}
const a0 = runArchive('news-a-on-site.html', 0), a1 = runArchive('news-a-on-site.html', 1), b0 = runArchive('news-b-platform.html', 0), b1 = runArchive('news-b-platform.html', 1);
/No issues yet/.test(a0) && /No issues yet/.test(b0) ? r.ok('launch (0 issues): both say so, neither shows an empty list') : r.fail('an empty state is missing');
const aLink = w.anchors(a1)[0];
aLink && aLink.to === 'issue' && fs.existsSync(here((a1.match(/href="([^"]+)"/) || [])[1])) ? r.ok('A after one quarter: a row linking to issue-01.html, which exists') : r.fail('A: issue link wrong');
const bLink = w.anchors(b1)[0];
bLink && bLink.to === 'external' ? r.ok('B after one quarter: one link out to the platform') : r.fail('B: archive link wrong');
const sameOutside = (h) => h.replace(/<title>[^<]*<\/title>/, '').replace(/\/\* <!--ARCHIVE-CSS-->[\s\S]*?<!--\/ARCHIVE-CSS--> \*\//, '').replace(/<!--ARCHIVE-->[\s\S]*?<!--\/ARCHIVE-->/, '').replace(/<script id="archive">[\s\S]*?<\/script>/, '');
sameOutside(read('news-a-on-site.html')) === sameOutside(read('news-b-platform.html')) ? r.ok('A and B identical outside the archive') : r.fail('A and B differ outside the archive');
const css = read('news-a-on-site.html');
['sending', 'done', 'error'].every(s => css.includes('[data-state="' + s + '"]')) ? r.ok('signup has all three non-idle states styled: sending, done, error') : r.fail('a signup state has no style');

// rounds.js agrees with the studies that drew the rounds
console.log('issue 01');
const s04 = read('../04/piece-a-rounds.html'), s05 = read('../05/exp-a-like-piece.html');
const M = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const drawn = (html) => [...html.matchAll(/<h3>([^<]+)<\/h3><p class="when">(\d{1,2}) (\w{3}) (\d{4})/g)].map(m => ({ title: m[1].replace(/&amp;/g, '&'), date: `${m[4]}-${M[m[3]]}-${m[2].padStart(2, '0')}` }));
const want = [...drawn(s04), ...drawn(s05)];
const mismatch = want.filter(x => !ROUNDS.some(y => y.title === x.title && y.date === x.date)).concat(ROUNDS.filter(y => !want.some(x => x.title === y.title && x.date === y.date)));
mismatch.length ? r.fail('rounds.js and Studies 04/05 disagree: ' + mismatch.map(x => x.title + ' ' + x.date).join(', ')) : r.ok(ROUNDS.length + ' rounds in rounds.js = the rounds drawn in Studies 04 and 05, title and date');
const qs = ['2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4'];
const total = qs.reduce((n, q) => n + inQuarter(q).length, 0);
total === ROUNDS.length ? r.ok('every round falls in exactly one quarter (' + qs.map(q => q.slice(2) + ':' + inQuarter(q).length).filter(s => !s.endsWith(':0')).join(' ') + ')') : r.fail('quarters count ' + total + ' of ' + ROUNDS.length);
const c = { ROUNDS, inQuarter }; vm.createContext(c); vm.runInContext((read('issue-01.html').match(/<script id="issue">([\s\S]*?)<\/script>/) || [])[1], c);
const body = c.issueBody('2026-Q3'), q3 = inQuarter('2026-Q3');
const shown = [...body.matchAll(/<b>([^<]+)<\/b>/g)].map(m => m[1]);
shown.join('|') === q3.map(x => x.title).join('|') ? r.ok('issue 01 shows exactly the ' + q3.length + ' rounds dated Jul–Sep 2026, oldest first') : r.fail('issue 01 body: ' + shown.join(', '));
/<span>30 Sep<\/span>/.test(body) && !/Sept/.test(body) ? r.ok('dates read "30 Sep", not en-GB\'s "30 Sept"') : r.fail('date format');

// privacy: every claim against the code
console.log('privacy, claims vs code');
const priv = w.text(read('privacy.html'));
const sitemapPages = [...rf('sitemap.xml').matchAll(/<loc>https:\/\/joyus\.studio\/([^<]*)<\/loc>/g)].map(m => m[1] === '' ? 'index.html' : m[1].endsWith('/') ? m[1] + 'index.html' : m[1]).filter(f => fs.existsSync(path.join(repo, f)));
const noGA = sitemapPages.filter(f => !rf(f).includes('G-74FZR7YY60'));
priv.includes('G-74FZR7YY60') && !noGA.length ? r.ok('"Google Analytics 4 (G-74FZR7YY60)" on every page: all ' + sitemapPages.length + ' sitemap pages carry it') : r.fail('GA claim: ' + noGA.length + ' sitemap pages without it');
const ib = rf('intent-box.js');
const add = (ib.match(/collection\('intents'\)\.add\(\{([\s\S]*?)\}\);/) || [])[1] || '';
const fields = [...add.matchAll(/^\s*(\w+):/gm)].map(m => m[1]);
fields.join() === 'text,matched,timestamp,page' && /slice\(0, 280\)/.test(add) && !/email|name/.test(add) ? r.ok('intents: the code stores text (≤280), matched, timestamp, page; no email, no name, as the page says') : r.fail('intents fields are ' + fields.join(','));
/projectId:\s*["']joyus-studio["']/.test(ib) || /projectId:\s*["']joyus-studio["']/.test(rf('index.html')) ? r.ok('Firestore project is joyus-studio') : r.fail('project id not found');
const sh = rf('say-hi.html');
/mailto:hello@joyus\.studio/.test(sh) && !/firestore|fetch\(|XMLHttpRequest/.test(sh) ? r.ok('say hi: mailto only, the site stores nothing, as the page says') : r.fail('say-hi.html stores or sends data itself');
r.done();
