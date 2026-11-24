// Study 109: Agemo storytelling, "How do you say what you are in a few words?", two ways.
//   a.html  the simple one: the word AI changes place twice ("AI tools", "tools made with AI", "Outsource to AI.")
//   b.html  the one with a story: "What is X?", nine names for the thing, a second note, then one line that is not a name
// Reads report.json (written by shoot.mjs from both pages in a real browser, wide and phone) and the pages themselves.
//  - both open on the question Divya picked (Study 102, no. 10) and carry its closing line, unchanged
//  - every headline and note on either page is on the board, word for word (the board is kept out of the public repo
//    in .site-rebuild/agemo-figma; skipped where it is missing)
//  - at every beat: no errors, no sideways scroll, nothing overlapping, nothing off screen, no words under 15px
//  - a: the line reads "AI tools", then "tools made with AI", then "Outsource to AI.", and the same word AI is in all three
//  - b: the names arrive one by one to nine, go pale when the note comes, and are gone when the one line is left
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '102', 'questions.json'), 'utf8'))[9];
const A = fs.readFileSync(path.join(here, 'a.html'), 'utf8'), B = fs.readFileSync(path.join(here, 'b.html'), 'utf8');
for (const [n, h] of [['a', A], ['b', B]]) {
  say(h.includes('<h1 id="q">' + Q.q + '</h1>') && h.includes(Q.close), n + ': the question is no. 10 from Study 102 and the close carries its line');
  say(/<meta name="robots" content="noindex/.test(h) && (h.match(/<h1/g) || []).length === 1, n + ': noindex; the question is asked once');
}
say((A.match(/id="ai"/g) || []).length === 1 && /<p class="w" id="ai">AI<\/p>/.test(A), 'a: the word AI is one element, used in all three lines');
const names = [...B.matchAll(/<li>([^<]+)<\/li>/g)].map(m => m[1]);
say(names.length === 9 && new Set(names).size === 9, 'b: nine names, all different');
const src = path.join(repo, '.site-rebuild', 'agemo-figma', 'raw', 'board-user-journey.xml.txt');
if (!fs.existsSync(src)) console.log('  skip the headlines and notes against the board: .site-rebuild/agemo-figma is not on this machine');
else {
  const un = (x) => { for (let i = 0; i < 2; i++) x = x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); return x.replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\s+/g, ' '); };
  const hay = un(fs.readFileSync(src, 'utf8'));
  const lines = [...names, 'What is X?', 'Tell me what I want and I will want it', 'Outsource to AI.', 'AI-tools. For every Job.', 'these arent AI tools though. They are tools made with AI.'];
  const lost = lines.filter(l => !hay.includes(un(l)));
  say(!lost.length, 'all ' + lines.length + ' headlines and notes are on the board, word for word' + (lost.length ? ': ' + lost.join(' | ') : ''));
  say(lines.slice(9).every(l => un(A + B).includes(un(l))), 'and each of them is on one of the two pages');
}
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [v, views] of Object.entries(rep.pages)) for (const [tag, r] of Object.entries(views)) {
  const b = r.beats, all = Object.values(b), t = v + ' ' + tag;
  say(r.errors.length === 0 && r.scrollWidth <= r.innerWidth, t + ': no errors, no sideways scroll');
  say(all.every(m => m.out === 0 && m.overlaps === 0), t + ': nothing overlaps and nothing is off screen, at every beat');
  say(all.every(m => m.pageScale <= 1.0001) && all.filter(m => m.smallestText && m.smallestText < 90).every(m => m.smallestText >= 15), t + ': the picture is never enlarged; no words under 15px');
  if (v === 'a') {
    say(b.question.question && b.question.line === '' && !b.first.question, t + ': the question leaves before the first line');
    say(b.first.line === 'AI tools' && b.swapped.line === 'tools made with AI' && b.hand.line === 'tools made with AI' && b.line.line === 'Outsource to AI.' && b.page.line === 'Outsource to AI.', t + ': AI tools → tools made with AI → Outsource to AI.');
    say(b.note.saying.join() === 's2' && b.swapped.saying.join() === 's2', t + ': her note is on screen while the two words change places');
    say(!b.hand.found && b.line.found && !b.line.page && b.page.page && b.page.lit, t + ': the word is marked when it lands, then the front page comes up with its headline marked');
  } else {
    say(b.question.question && !b.x.question && b.x.x && b.x.names === 0, t + ': the question leaves, then "What is X?" alone');
    say(b.three.names === 3 && b.nine.names === 9 && !b.nine.pale, t + ': the names arrive one by one (3, then 9)');
    say(b.note.note && b.note.pale && b.note.names === 9, t + ': the second note comes and the nine go pale');
    say(b.line.one && b.line.found && b.line.names === 0 && !b.line.note && !b.line.x, t + ': then only the one line is left');
    say(b.page.page && b.page.lit && b.page.one, t + ': it ends on the front page with its headline marked');
  }
}
process.exitCode = bad ? 1 : 0;
