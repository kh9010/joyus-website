// Study 118: three other ways to fill a space, after Divya on Study 117: "these do not feel like they are a good
// interpretation of the idea of filling spaces ... you haven't been creative and innovative enough."
// Each page is its own mechanism with its own code:
//   a.html  it grows until it meets: the J starts empty; each piece grows from a point at its own speed and stops
//           where it meets another piece or the edge; a click adds a piece
//   b.html  big first, then what is left: pieces with shapes of their own (circle, square, triangle, pill); each
//           next piece is the biggest that fits in the gaps the others left
//   c.html  words fill the box: one sentence in one typeface, every line as wide as the box and all of them
//           together as tall as it, whatever shape the box is dragged to
// Reads report.json (written by shoot.mjs from the three pages in a real browser, wide and phone).
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
const deck = path.join(here, '..', '110', 'work-deck-tomboyx.txt');
for (const f of ['a', 'b', 'c']) say(/<meta name="robots" content="noindex/.test(fs.readFileSync(path.join(here, f + '.html'), 'utf8')), f + ': noindex');
const c0 = fs.readFileSync(path.join(here, 'c-script.js'), 'utf8'), words = (c0.match(/const CLAUSES = \[([^\]]+)\]/) || [])[1].replace(/'/g, '').split(', ').join(' ').replace(/, /g, ', ');
say(words === 'We design, we build, we manage, we market, we advise, we grow.', 'c: the words are the work deck\'s, whole: "' + words + '"');
for (const tag of ['wide', 'phone']) {
  const a = rep.pages.a[tag], b = rep.pages.b[tag], c = rep.pages.c[tag];
  for (const [n, p] of [['a', a], ['b', b], ['c', c]]) say(p.errors.length === 0 && p.scrollWidth <= p.innerWidth, n + ' ' + tag + ': no errors, no sideways scroll');
  // a
  say(a.empty.coverage < .02 && a.some.coverage < a.half.coverage && a.half.coverage < 1 && a.reachedFull && a.full.coverage === 1, 'a ' + tag + ': the J starts empty and ends full (' + a.empty.coverage + ' → ' + a.some.coverage + ' → ' + a.half.coverage + ' → ' + a.full.coverage + '), with ' + a.full.pieces + ' pieces');
  const sp = a.full.speeds || [];
  say(a.planted === true && a.after.byHand === a.before.byHand + 1 && a.outside === false, 'a ' + tag + ': a click on an empty part of the J adds a piece; a click outside it adds nothing');
  say(a.emptied && a.next.j !== a.full.j && a.next.coverage < .05, 'a ' + tag + ': it lets go and the next J (' + a.next.j + ') starts empty');
  // b
  const r = b.full.radii, third = Math.floor(r.length / 3);
  say(r[0] === Math.max(...r) && Math.min(...r.slice(0, third)) > Math.max(...r.slice(-third)), 'b ' + tag + ': big first: the first third of the ' + r.length + ' pieces are all bigger than the last third (' + r[0] + ' down to ' + r[r.length - 1] + ')');
  say(b.full.overlapping === 0 && b.full.outside === 0 && b.full.kinds.length === 4, 'b ' + tag + ': four kinds of shape, none overlapping, none outside the J');
  say(b.big.shown >= 4 && b.big.shown <= 6 && b.full.ink === 4 && b.full.shown === b.full.pieces && b.reachedFull, 'b ' + tag + ': the four biggest are ink and arrive first; all ' + b.full.pieces + ' arrive');
  say(b.full.waits[0] > 5 * b.full.waits[1], 'b ' + tag + ': it speeds up: ' + b.full.waits[0] + 's after the first piece, ' + b.full.waits[1] + 's before the last');
  say(b.emptied && b.next.j !== b.full.j, 'b ' + tag + ': it lets go and the next J (' + b.next.j + ') fills');
  console.log('  note b ' + tag + ': the pieces cover ' + Math.round(b.full.filled * 100) + '% of the J; the rest is the gaps between them');
  // c
  say(c.empty.shown === 0 && c.filled.allIn && [c.filled, ...c.boxes].every(m => m.text === 'We design, we build, we manage, we market, we advise, we grow.'), 'c ' + tag + ': the box is empty first; then the whole sentence is in, in order, in every box');
  for (const m of [c.filled, ...c.boxes]) {
    const w = m.lines.every(l => Math.abs(l.inkWidth - m.box[0]) <= Math.max(1.5, m.box[0] * .004)), hgt = Math.abs(m.used - m.box[1]) <= 1.5, sizes = m.lines.map(l => l.size);
    say(w && hgt, 'c ' + tag + ' ' + m.box.join('×') + ': every line is as wide as the box and together they are as tall (' + m.lines.length + ' lines, sizes ' + Math.round(Math.min(...sizes)) + '–' + Math.round(Math.max(...sizes)) + 'px, letters ' + (Math.abs(m.squash - 1) < .01 ? 'not stretched' : 'STRETCHED ×' + m.squash + ' in height') + ')');
  }
  const clean = [c.filled, ...c.boxes].filter(m => Math.abs(m.squash - 1) < .01).length;
  say(clean === c.boxes.length + 1, 'c ' + tag + ': ' + clean + ' of ' + (c.boxes.length + 1) + ' boxes are filled without stretching the letters');
}
process.exitCode = bad ? 1 : 0;
