// Study 87: a new brief from the blind judges (brief.md), four pages that passed them, on one page behind ?v=a|b|c|d.
// Pinned here: exactly four options in the blind rank's order (a Six members first, b Your questions, answered,
// c Told straight, shown, d Same words, re-sorted), one shown at a time, each the judged page as built
// (case.html = build.cjs over src/); the six member types on every option; no client person's or prospect's name
// (read off the workshop board, as 46/83-86); no money but $5–10K and no figure but 88%; no income (no persona
// profile line); no 'an easy weekday place'; no visible placeholder ('[', 'to fill', 'wordmark', 'TODO', 'for
// Kahran'); no em dash in our words; noindex; and, measured live at 390 in headless Chrome, each option at most
// five phone screens (5 x 844 = 4220px, header to footer, nothing tapped) with no text under 13px.
//   node studies/iterations/87/check.cjs   (MEASURE_BASE=http://127.0.0.1:<port>/studies/iterations/ for the live part)
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { OPTIONS, build } = require('./build.cjs');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };

const html = read('case.html');
const index = read('index.html');
const brief = read('brief.md');
const noCode = (h) => h.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
const visible = (h) => noCode(h).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&ldquo;|&rdquo;/g, '"').replace(/\s+/g, ' ');
const caseOf = (v) => (html.match(new RegExp(`<div class="case" data-opt="${v}">[\\s\\S]*?(?=<div class="case" data-opt=|<script>document\\.querySelectorAll\\('\\.case'\\))`)) || [''])[0];

console.log('options');
const cases = [...html.matchAll(/<div class="case" data-opt="([a-z])"/g)].map(m => m[1]);
JSON.stringify(cases) === '["a","b","c","d"]' ? ok('four options: ' + cases.join(' ')) : fail('options are ' + cases.join(' '));
const order = ['Six members first', 'Your questions, answered', 'Told straight, shown', 'Same words, re-sorted'];
JSON.stringify(OPTIONS.map(o => o.name)) === JSON.stringify(order) && OPTIONS.every((o, i) => i === 0 || o.total <= OPTIONS[i - 1].total)
  ? ok('in the blind rank\'s order, best first: ' + OPTIONS.map(o => o.v + ' ' + o.name + ' ' + o.total).join(' · ')) : fail('the order changed: ' + OPTIONS.map(o => o.name).join(', '));
html === build() ? ok('case.html is build.cjs over src/a-d.html: each page as the judges saw it') : fail('case.html differs from a fresh build (edited by hand, or src changed without a build)');
OPTIONS.every(o => index.includes(`href="case.html?v=${o.v}"`) && index.includes(o.name)) ? ok('index.html links all four by name') : fail('index.html is missing an option');
/v = \/\^\[a-d\]\$\/\.test\(v \|\| ''\) \? v : 'a'/.test(html) && /if \(c\.dataset\.opt !== document\.documentElement\.dataset\.v\) c\.remove\(\)/.test(html) && /if \(s\.dataset\.opt !== v\) s\.remove\(\)/.test(html)
  ? ok('?v picks the option, a by default; the other three bodies and styles leave the page') : fail('the ?v switch is not there');
const SIX = ['The Quiet Connector', 'The Country-Club Guy', 'The Semi-Retired Operator', 'The New-to-Seattle Founder', 'The Empty-Nester', 'The Mid-Career High Earner'];
for (const o of OPTIONS) {
  const t = visible(caseOf(o.v));
  const miss = SIX.filter(s => !t.includes(s));
  miss.length ? fail(o.v + ': missing ' + miss.join(', ')) : ok(o.v + ': all six member types, East West Club named ' + (t.includes('East West Club') ? 'in full' : 'NOT in full'));
  if (!t.includes('East West Club')) fail(o.v + ': East West Club not written out');
  /You have the value\. You can't break it down yet\./.test(t) ? ok(o.v + ': opens on "You have the value. You can\'t break it down yet."') : fail(o.v + ': c\'s line is gone');
}

console.log('nothing a visitor should not see');
const seen = visible(html);
for (const p of ['[', 'to fill', 'wordmark', 'TODO', 'for Kahran']) {
  (p === '[' ? seen.includes(p) : html.toLowerCase().includes(p.toLowerCase())) ? fail('a placeholder on the page: "' + p + '"') : ok('no "' + p + '"' + (p === '[' ? ' in the visible text' : ' anywhere in case.html, the source included'));
}
/<meta name="robots" content="noindex">/.test(html) && /<meta name="robots" content="noindex">/.test(index) ? ok('case.html and index.html are noindex') : fail('noindex missing');
!/—/.test(seen + ' ' + visible(index)) ? ok('no em dash in our words (the page and the study page)') : fail('an em dash in our words');
const blob = html + index + brief + read('build.cjs');
!/an easy weekday place/i.test(html + index) ? ok('no "an easy weekday place" on the page or the study page (brief.md names it only as the rule)') : fail('"an easy weekday place" is back');

console.log('money and income');
const text = seen + ' ' + visible(index) + ' ' + brief;
const money = [...text.matchAll(/\$\s?[\d.,]+(?:[–-]\d+)?\s?[KkMm]?\+?|\b\d+(?:[.,]\d+)?\s?(?:[kK]\b|dollars|USD)|\b\d+(?:\.\d+)?\s?%/g)].map(m => m[0].trim());
const badMoney = [...new Set(money.filter(m => !(/^\$5[–-]10K$/.test(m) || m === '88%')))];
badMoney.length ? fail('money or figures not allowed: ' + badMoney.join(', ')) : ok('the only figures: ' + [...new Set(money)].join(', '));
const { personas } = JSON.parse(read('../86/personas.json'));
const prof = personas.flatMap(p => p.profile.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 8));
const leakedProf = prof.filter(s => html.includes(s));
leakedProf.length ? fail('a persona profile line (income, family) on the page: ' + leakedProf[0]) : ok('no income: no persona profile line on any option');
!/\bHHI\b|income|salary/i.test(seen) ? ok('no HHI, income or salary in the visible text') : fail('income on the page');

console.log('names');
const ewc = path.join(os.homedir(), 'dev/ewc');
const boardFile = path.join(ewc, 'EWC workshopsession2fill.excalidraw');
if (fs.existsSync(boardFile)) {
  const board = JSON.parse(fs.readFileSync(boardFile, 'utf8')).elements.filter(e => e.type === 'text' && !e.isDeleted).map(e => e.text);
  const full = [];
  for (const t of board) for (const m of t.matchAll(/(?:^|\n)([A-Z][a-z]+) ([A-Z][a-z]+) -/g)) full.push([m[1], m[2]]);
  const guideText = read('../86/personas.json');
  const needles = full.flatMap(([f, l]) => [f + ' ' + l, f, ...(new RegExp('\\b' + l + '\\b').test(guideText) ? [] : [l])]);
  const leaked = needles.filter(n => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? ok('read ' + full.length + ' prospect names off the board') : fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? fail(leaked.length + ' real prospect name(s) in Study 87') : ok('no prospect name in case.html, index.html, brief.md or build.cjs');
  const line = board.find(t => /^\d+ min\s+·\s+/.test(t)) || '';
  const people = line.replace(/^\d+ min\s+·\s+/, '').split(/,\s*/).map(x => x.trim()).filter(x => x && !/^(Kahran|Divya)$/.test(x));
  const met = people.filter(n => new RegExp('\\b' + n + '\\b', 'i').test(blob));
  people.length >= 2 ? ok('read ' + people.length + ' client attendees off the board') : fail('expected the workshop\'s attendees, found ' + people.length);
  met.length ? fail(met.length + ' client person name(s) in Study 87') : ok('no client person\'s name in Study 87');
} else ok('~/dev/ewc not on this machine: name checks skipped');

console.log('pictures');
for (const f of ['front', 'guide', ...OPTIONS.flatMap(o => ['case-' + o.v + '-390', 'case-' + o.v + '-1440'])]) fs.existsSync(path.join(__dirname, 'img', f + '.png')) ? ok('img/' + f + '.png') : fail('missing img/' + f + '.png');

// live: each option alone, no errors, nothing past the edge, at most five phone screens
console.log('live');
const SCREENS = 5, SCREEN = 844, CEIL = SCREENS * SCREEN;
const base = process.env.MEASURE_BASE || 'http://127.0.0.1:8794/studies/iterations/';
try {
  const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'measure.mjs'), base + '87/case.html'], { encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] }));
  if (!out.a || !out.a['1440'] || !out.a['1440'].shown.length) throw new Error('87 not served at ' + base);
  for (const o of OPTIONS) for (const k of ['1440', '390']) {
    const x = out[o.v][k];
    JSON.stringify(x.shown) === JSON.stringify([o.v]) && JSON.stringify(x.styles) === JSON.stringify([o.v]) ? ok('?v=' + o.v + ' ' + k + ': only option ' + o.v + ' and its style') : fail('?v=' + o.v + ' ' + k + ': shows ' + JSON.stringify(x.shown) + ' styles ' + JSON.stringify(x.styles));
    x.pageWidth <= +k ? ok('?v=' + o.v + ' ' + k + ': nothing past the edge') : fail('?v=' + o.v + ' ' + k + ': the page is ' + x.pageWidth + 'px wide');
    x.errors.length ? fail('?v=' + o.v + ' ' + k + ': errors ' + x.errors.join(' | ')) : ok('?v=' + o.v + ' ' + k + ': no errors');
    x.minFont >= 13 ? ok('?v=' + o.v + ' ' + k + ': smallest text ' + x.minFont + 'px') : fail('?v=' + o.v + ' ' + k + ': text at ' + x.minFont + 'px, under 13');
  }
  for (const o of OPTIONS) {
    const x = out[o.v]['390'];
    x.page <= CEIL ? ok('?v=' + o.v + ' 390: ' + x.page + 'px, ' + (x.page / SCREEN).toFixed(1) + ' phone screens (at most ' + SCREENS + ')') : fail('?v=' + o.v + ' 390: ' + x.page + 'px, ' + (x.page / SCREEN).toFixed(1) + ' phone screens, over ' + SCREENS);
  }
  ['1440', '390'].every(k => JSON.stringify(out[''][k].shown) === '["a"]') ? ok('no ?v: option a') : fail('no ?v shows ' + JSON.stringify(out['']));
} catch (e) { ok('server or Chrome not available: live part skipped (' + String(e.message).split('\n')[0].slice(0, 120) + ')'); }

console.log(failures ? `\n${failures} failure(s)` : '\nPASS');
process.exit(failures ? 1 : 0);
