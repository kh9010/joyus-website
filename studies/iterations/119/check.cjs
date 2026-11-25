// Study 119: what the stones' rule means for interface elements. Divya: "by UI I mean UI elements ... what could
// buttons mean? What could arrangement mean? What could flow and animation language mean?"
// One rule (cells.js): pieces share a box; each asks for a share; when one takes room its neighbours give it.
// Seven elements on ui.html use it, each for one thing:
//   buttons (reach for one, it takes room) · where you are (the current place holds the most) · choosing several
//   (chosen ones grow and take their colour) · a menu (one piece becomes five and back) · a list that opens ·
//   a form (the field in use gets the room; filled fields keep their colour) · arriving and leaving
// Reads report.json (written by shoot.mjs from the page in a real browser, wide and phone).
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
const html = fs.readFileSync(path.join(here, 'ui.html'), 'utf8');
say(/<meta name="robots" content="noindex/.test(html) && (html.match(/new Cells\(/g) || []).length === 7, 'seven elements, all from the one rule; noindex');
const INK = '#2C3544', PALE = '#eceff3';
for (const [tag, v] of Object.entries(rep.views)) {
  const P = (state, k) => Object.fromEntries(v[state][k].pieces.map(p => [p.id, p])), shown = (state, k) => v[state][k].pieces.filter(p => p.shown).map(p => p.id);
  const states = ['rest', 'hover', 'tab', 'chip', 'unchip', 'menuOpen', 'menuClosed', 'listOpen', 'listOther', 'typing', 'filled', 'added', 'removed'];
  say(v.errors.length === 0 && v.scrollWidth <= v.innerWidth, tag + ': no errors, no sideways scroll');
  const cov = states.flatMap(s => Object.values(v[s]).map(c => c.covered));
  say(cov.every(c => c > .7 && c <= 1.0001), tag + ': in every state the pieces fill their box and never overlap (they cover ' + Math.round(Math.min(...cov) * 100) + '–' + Math.round(Math.max(...cov) * 100) + '%; the rest is the gaps)');
  // buttons
  let a = P('rest', 'buttons'), b = P('hover', 'buttons');
  say(a.hi.share > a.work.share && a.work.share > a.read.share, tag + ' buttons: at rest the main one has the most room');
  say(b.work.share > a.work.share * 1.15 && b.hi.share < a.hi.share && b.read.share < a.read.share && shown('hover', 'buttons').length === 3, tag + ' buttons: reached for, "See the work" grows ' + Math.round((b.work.share / a.work.share - 1) * 100) + '% and both others give room, none leaves');
  // where you are
  a = P('rest', 'tabs'); b = P('tab', 'tabs');
  say(a.Work.fill === INK && b.Podcast.fill === INK && b.Work.fill === PALE && Object.values(b).every(p => p.id === 'Podcast' || p.share < b.Podcast.share), tag + ' where you are: the current place is ink and the largest; it moves from Work to Podcast');
  // choosing several
  a = P('chip', 'chips'); b = P('unchip', 'chips');
  say(['Branding', 'Strategy'].every(k => a[k].fill !== PALE && a[k].share > Math.max(a['Website & Product'].share, a.Storytelling.share)) && b.Strategy.fill === PALE && b.Branding.fill !== PALE, tag + ' choosing several: the two chosen are larger and coloured; unchoosing one gives its room back');
  // a menu
  say(shown('rest', 'menu').join() === 'menu' && shown('menuOpen', 'menu').length === 5 && P('menuOpen', 'menu').menu.label === 'Close' && shown('menuClosed', 'menu').join() === 'menu' && v.menuMid.menu.resting === false, tag + ' menu: one piece, then five (the first now says Close), then one again; caught mid-way it is moving');
  // a list that opens
  a = P('listOpen', 'list'); b = P('listOther', 'list');
  say(a.klydo.share > .45 && shown('listOpen', 'list').length === 6 && b.tomboyx.share > .45 && b.klydo.share < .15 && shown('listOther', 'list').length === 6, tag + ' list: the open one holds ' + Math.round(a.klydo.share * 100) + '% and the other five stay on screen; opening another swaps them');
  // a form
  a = P('typing', 'form'); b = P('filled', 'form');
  say(a.name.share > a.email.share && a.name.share > a.about.share && a.name.fill !== PALE && a.email.fill === PALE && a.send.fill === PALE, tag + ' form: the field in use is the largest and takes its colour once it has words; Send is asleep');
  say(['name', 'email', 'about'].every(k => b[k].fill !== PALE) && b.send.fill === INK, tag + ' form: with all three filled, all three are coloured and Send is ink');
  // arriving and leaving
  say(shown('rest', 'pile').length === 3 && v.arriving.pile.resting === false && shown('added', 'pile').length === 5 && shown('removed', 'pile').length === 4 && !shown('removed', 'pile').includes('p1'), tag + ' arriving: three pieces, two arrive (moving when caught), one is taken away: 3 → 5 → 4');
  const labels = states.flatMap(s => Object.values(v[s]).flatMap(c => c.pieces.filter(p => p.label)));
  const lost = states.flatMap(s => Object.entries(v[s]).flatMap(([k, c]) => c.pieces.filter(p => p.shown && p.share > .06 && !p.label && !['name', 'email', 'about'].includes(p.id)).map(p => s + '/' + k + '/' + p.id)));
  say(labels.every(p => p.font >= 13), tag + ': every label is 13px or more');
  say(lost.length === 0, tag + ': every piece big enough to read carries its label' + (lost.length ? ' (missing: ' + [...new Set(lost)].slice(0, 6).join(', ') + ')' : ''));
}
process.exitCode = bad ? 1 : 0;
