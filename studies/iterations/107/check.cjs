// Study 107: Agemo storytelling, "a wall that fills up".
// Reads report.json (written by shoot.mjs from the page in a real browser, wide and phone), data.json and the page.
//  - the question and the closing line are the ones Divya picked (Study 102, no. 25), unchanged
//  - data.json is the team's board as it is in the FigJam file: 61 notes, no names, text kept for the four read out.
//    Where the pull is on this machine (.site-rebuild/agemo-figma, kept out of the public repo) the notes' count and
//    the four quotes are checked against it; skipped where it is missing.
//  - at every beat: no errors, no sideways scroll, nothing overlapping, nothing off screen
//  - the counter is always the number of notes on the wall; it ends on 61 with all 61 in view
//  - each of the four notes read out is one of the team's, and they come in the order the product is walked
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'case.html'), 'utf8');
const raw = fs.readFileSync(path.join(here, 'data.json'), 'utf8'), D = JSON.parse(raw);
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '102', 'questions.json'), 'utf8'))[24];
say(html.includes('<h1 id="q">' + Q.q + '</h1>'), 'the question is no. 25 from Study 102, word for word');
say(html.includes(Q.close), 'the close carries its line: ' + Q.close);
say(/<meta name="robots" content="noindex/.test(html), 'noindex');
const quoted = D.notes.filter(n => n.t);
say(D.notes.length === 61 && quoted.length === 4, D.notes.length + ' notes, ' + quoted.length + ' with their words kept');
say(!/author|@/.test(raw), 'no names in the data');
say(D.notes.every((n, i) => i === 0 || n.x >= D.notes[i - 1].x), 'the notes are in the order the product is walked, left to right');
say(html.includes('Sixty-one notes'), 'the page says sixty-one, and the data has ' + D.notes.length);
const src = path.join(repo, '.site-rebuild', 'agemo-figma', 'raw', 'board-codewords-ux.xml.txt');
if (!fs.existsSync(src)) console.log('  skip the notes against the board: .site-rebuild/agemo-figma is not on this machine');
else {
  const t = fs.readFileSync(src, 'utf8'), a = t.indexOf('name="Ideal flow"'), s1 = t.indexOf('<section', a + 10), sec = t.slice(t.lastIndexOf('<section', a), s1 < 0 ? undefined : s1);
  const stickies = [...sec.matchAll(/<sticky [^>]*>([\s\S]*?)<\/sticky>/g)].map(m => m[1]).filter(x => !/^(Input|Output) mental model$/.test(x.trim()));
  say(stickies.length === D.notes.length, 'the board has ' + stickies.length + ' notes on that flow; the data has ' + D.notes.length);
  const dec = (x) => { for (let i = 0; i < 2; i++) x = x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); return x.replace(/\s+/g, ' ').trim(); };
  const texts = stickies.map(dec);
  const lost = quoted.filter(n => !texts.includes(n.t)).map(n => n.t);
  say(!lost.length, 'each of the four read out is a whole note from the board, word for word' + (lost.length ? ': ' + lost.join(' | ') : ''));
}
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [tag, v] of Object.entries(rep.views)) {
  const b = v.beats, all = Object.values(b), reads = ['read1', 'read2', 'read3', 'read4'].map(k => b[k]);
  say(v.errors.length === 0, tag + ': no errors' + (v.errors[0] ? ': ' + v.errors[0] : ''));
  say(v.scrollWidth <= v.innerWidth, tag + ': no sideways scroll (' + v.scrollWidth + ' in ' + v.innerWidth + ')');
  say(all.every(m => m.out === 0 && m.overlaps === 0), tag + ': nothing overlaps and nothing is off screen, at every beat');
  say(b.question.question && !b.question.wall && !b.line.question && b.line.wall && b.line.landed === 0 && b.ask.landed === 0, tag + ': the question leaves, then the line alone, with no notes yet');
  say(all.every(m => m.counter === m.landed), tag + ': the counter is the number of notes on the wall');
  say(reads.every(m => m.saying.join() === 's-note' && quoted.some(n => n.t === m.reading)) && new Set(reads.map(m => m.reading)).size === 4, tag + ': four of the team\'s notes are read out, one at a time');
  say(reads.every((m, i) => i === 0 || m.landed > reads[i - 1].landed) && b.fast.landed > b.read4.landed, tag + ': the wall keeps filling (' + [...reads, b.fast, b.wall].map(m => m.landed).join(', ') + ')');
  say(b.wall.landed === 61 && b.wall.inView === 61 && b.wall.wallFits && b.wall.saying.join() === 's-end', tag + ': it ends with all 61 in view');
  say(all.filter(m => m.smallestText).every(m => m.smallestText >= 15), tag + ': no words under 15px');
}
process.exitCode = bad ? 1 : 0;
