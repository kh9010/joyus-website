// Study 106: Agemo product strategy, "the brief, with our notes in the margin".
// Reads report.json (written by shoot.mjs from the page in a real browser, wide and phone) and the page itself.
//  - the question and the closing line are the ones Divya picked (Study 102, no. 14), unchanged
//  - the four lines of the brief are Agemo's own words (checked against the proposal and the scope board, which are
//    kept out of the public repo in .site-rebuild/agemo-figma; skipped where that folder is missing)
//  - at every beat: no errors, no sideways scroll, nothing overlapping, nothing off screen
//  - four lines, four notes, four numbers; every number lands and lights the part of the front page it answers
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'case.html'), 'utf8');
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '102', 'questions.json'), 'utf8'))[13];
say(html.includes('<h1 id="q">' + Q.q + '</h1>'), 'the question is no. 14 from Study 102, word for word');
say(html.includes(Q.close), 'the close carries its line: ' + Q.close);
say(/<meta name="robots" content="noindex/.test(html), 'noindex');
const asks = [...html.matchAll(/<p class="ask"><span>“([^<]+)”<\/span><\/p>/g)].map(m => m[1]);
const notes = [...html.matchAll(/<p class="note"><i class="badge">(\d)<\/i><span>([^<]+)<\/span><\/p>/g)];
const tags = [...html.matchAll(/<li><i class="badge">(\d)<\/i><span>([^<]+)<\/span><\/li>/g)];
say(asks.length === 4 && notes.length === 4 && tags.length === 4 && (html.match(/class="badge dot"/g) || []).length === 4, 'four lines of the brief, four notes, four short notes, four numbers');
say(notes.map(m => m[1]).join('') === '1234' && tags.map(m => m[1]).join('') === '1234', 'numbered 1 to 4, in order, both times');
say(fs.statSync(path.join(here, 'img', 'front-page.png')).size > 100000, 'the picture is the real front page');
const src = path.join(repo, '.site-rebuild', 'agemo-figma');
if (!fs.existsSync(src)) console.log('  skip the brief against the sources: .site-rebuild/agemo-figma is not on this machine');
else {
  const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const norm = (t) => dec(dec(t)).replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\s+/g, ' ');
  const hay = norm(['proposal-finalised.txt', 'raw/board-codewords-ux.xml.txt'].map(f => fs.readFileSync(path.join(src, f), 'utf8')).join(' '));
  const lost = asks.filter(a => !hay.includes(norm(a)));
  say(!lost.length, 'all four lines of the brief are in the proposal or the scope board, word for word' + (lost.length ? ': ' + lost.join(' | ') : ''));
}
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [tag, v] of Object.entries(rep.views)) {
  const b = v.beats, all = Object.values(b);
  say(v.errors.length === 0, tag + ': no errors' + (v.errors[0] ? ': ' + v.errors[0] : ''));
  say(v.scrollWidth <= v.innerWidth, tag + ': no sideways scroll (' + v.scrollWidth + ' in ' + v.innerWidth + ')');
  say(all.every(m => m.out === 0 && m.overlaps === 0), tag + ': nothing overlaps and nothing is off screen, at every beat');
  say(b.question.question && b.question.asks === 0 && !b.brief.question && b.brief.asks === 4, tag + ': the question leaves, then the brief is set out');
  say(b.brief.notes === 0 && b.two.notes === 2 && b.two.marked === 2 && b.four.notes === 4 && b.four.marked === 4, tag + ': the notes are written one line at a time (0, 2, 4)');
  say(!b.four.page && b.page.page && !b.page.brief, tag + ': the brief steps back as the front page comes up');
  say(b.page.landed === 0 && b.flying.landed >= 1 && b.flying.landed < 4 && b.landed.landed === 4 && b.landed.lit === 4, tag + ': the numbers land one after another, and each lights its part of the page');
  say(b.landed.caption && all.every(m => m.pageScale <= 1.0001), tag + ': it ends on its line, and the page is never enlarged past its own pixels');
  say(all.filter(m => m.smallestText).every(m => m.smallestText >= 15), tag + ': no words under 15px');
}
process.exitCode = bad ? 1 : 0;
