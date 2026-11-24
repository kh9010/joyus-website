// Study 114: TomboyX, "How do you know a story is working?", built as a round (a ring) that fills room by room.
// Reads report.json (written by shoot.mjs from the page in a real browser, wide and phone) and the page itself.
//  - the question and the closing line are the ones Divya picked (Study 111, no. 20), unchanged
//  - the ring only ever gets fuller: empty, a little, about half, most of it, full, one step after each room
//  - the ring does not move until that room's story has been said (the room is on screen when it fills)
//  - four rooms in the order they were asked, each with one real slide; all present
//  - at every beat: no errors, no sideways scroll, nothing overlapping, nothing off screen, no words under 15px
//  - no amounts of money on the page (how full the ring is after each room follows Kahran's account; see the note
//    kept out of git in .site-rebuild/tomboyx)
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'case.html'), 'utf8');
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '111', 'questions.json'), 'utf8'))[19];
say(html.includes('<h1 id="q">' + Q.q + '</h1>') && html.includes(Q.close), 'the question is no. 20 from Study 111 and the close carries its line');
say(/<meta name="robots" content="noindex/.test(html) && (html.match(/<h1/g) || []).length === 1, 'noindex; the question is asked once');
const imgs = [...html.matchAll(/<img src="img\/([^"]+)"/g)].map(m => m[1]);
say(imgs.length === 4 && new Set(imgs).size === 4 && imgs.every(f => fs.existsSync(path.join(here, 'img', f))), 'four rooms, four different real slides, all present');
say(!/[$£€]\s?\d|\d\s?(million|k\b)|\d+\s?%/i.test(html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '')), 'no amounts of money and no percentages');
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [tag, v] of Object.entries(rep.views)) {
  const b = v.beats, all = Object.values(b), order = ['empty', 'asked1', 'little', 'half', 'most', 'asked4', 'full'].map(k => b[k]);
  say(v.errors.length === 0 && v.scrollWidth <= v.innerWidth, tag + ': no errors, no sideways scroll');
  say(all.every(m => m.out === 0 && m.overlaps === 0), tag + ': nothing overlaps and nothing is off screen, at every beat');
  say(b.question.question && !b.question.ring && !b.empty.question && b.empty.ring && b.empty.full === 0, tag + ': the question leaves, then an empty ring');
  say(order.every((m, i) => i === 0 || m.full >= order[i - 1].full - .001), tag + ': the ring only gets fuller (' + order.map(m => m.full).join(', ') + ')');
  say([b.empty.word, b.little.word, b.half.word, b.most.word, b.full.word].join('|') === 'Empty|A little|About half|Most of it|Full', tag + ': empty, a little, about half, most of it, full');
  say(b.asked1.full === 0 && b.asked1.panels === 1 && b.asked4.word === 'Most of it' && b.asked4.panels === 1, tag + ': the ring waits until that room\'s story has been said');
  say([b.little, b.half, b.most, b.full].every(m => m.panels === 1) && new Set([b.little, b.half, b.most, b.full].map(m => m.panel[0])).size === 4, tag + ': one room on screen each time it fills, four different rooms');
  say(b.full.full === 1 && b.full.caption, tag + ': it ends full, on its line');
  say(all.filter(m => m.imgScale).every(m => m.imgScale <= 1.0001) && all.filter(m => m.smallestText).every(m => m.smallestText >= 15), tag + ': no slide enlarged; no words under 15px');
}
process.exitCode = bad ? 1 : 0;
