// Study 117: what the coming-soon J does (stones gather into a shape, come apart, gather into another), carried
// into a site. The stones are the pieces of work in the site map; their colour is their type of work.
// Reads report.json (written by shoot.mjs from site.html in a real browser, wide and phone).
//  - the pieces are the site map's: every item under Branding, Website & Product, Strategy and Storytelling
//  - in every view all of them are on screen and hold some area: no piece ever leaves
//  - home: every piece sits inside the J; a second J is a different arrangement of the same pieces
//  - caught mid-move the pieces are loose (the shape has let go of them)
//  - work: each piece holds about the area it was asked to
//  - a type or a client: exactly its pieces are lit, they touch each other, and they hold most of the frame
//  - labels that show are 13px or more and lie inside their own piece; no errors, no sideways scroll
// Printed, not required: how many neighbours share a colour. Colour is the type of work here, so the brand lab's
// rule "neighbours never the same colour" cannot always hold; the seating keeps it as low as it can.
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const pieces = JSON.parse(fs.readFileSync(path.join(here, 'pieces.json'), 'utf8'));
const sm = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'sitemap', 'pages.json'), 'utf8'));
const TYPES = ['Branding', 'Website & Product', 'Strategy', 'Storytelling'];
const want = sm.tree[0].kids.filter(k => TYPES.includes(k.title)).flatMap(k => k.kids.map(p => k.title + ' | ' + p.title + ' | ' + p.project));
say(want.length === 33 && JSON.stringify(want) === JSON.stringify(pieces.map(p => p.type + ' | ' + p.title + ' | ' + p.project)), 'the ' + pieces.length + ' pieces are the site map\'s work, in its four types');
const html = fs.readFileSync(path.join(here, 'site.html'), 'utf8');
say(/<meta name="robots" content="noindex/.test(html) && TYPES.every(t => html.includes("'" + t + "'")), 'the page names the four types; noindex');
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));
for (const [tag, r] of Object.entries(rep.views)) {
  const b = r.beats, all = Object.entries(b);
  say(r.errors.length === 0 && r.scrollWidth <= r.innerWidth, tag + ': no errors, no sideways scroll');
  say(all.every(([, m]) => m.pieces.length === 33 && m.pieces.every(p => p.inFrame && p.share > 0)), tag + ': all 33 pieces are on screen in every view');
  say(['j1', 'j2', 'back'].every(k => b[k].view.startsWith('home') && b[k].pieces.every(p => p.inJ)) && b.j1.view !== b.j2.view, tag + ': at home every piece is inside the J, and the second J is another J');
  say(b.between.moving && b.between.loose > .5 && b.leaving.moving && b.leaving.loose > .5, tag + ': mid-move the pieces are loose (' + b.between.loose + ' between two Js, ' + b.leaving.loose + ' leaving for work)');
  const off = Math.max(...b.work.pieces.map(p => Math.abs(p.share - p.asked) / p.asked));
  say(b.work.view === 'work' && b.work.pieces.every(p => p.lit) && off < .15, tag + ': on Work every piece holds the area asked of it (furthest off by ' + (off * 100).toFixed(1) + '%)');
  const lit = m => m.pieces.filter(p => p.lit).map(p => p.title);
  say(same(lit(b.strategy), pieces.filter(p => p.type === 'Strategy').map(p => p.title)) && b.strategy.focusJoined && b.strategy.focusShare > .65 && b.strategy.heading === 'Strategy', tag + ': Strategy lights its 12 pieces, touching, on ' + Math.round(b.strategy.focusShare * 100) + '% of the frame');
  for (const [k, n] of [['klydo', 7], ['armoire', 3], ['tomboyx', 1]]) {
    const mine = pieces.filter(p => p.project === k).map(p => p.title);
    say(mine.length === n && same(lit(b[k]), mine) && b[k].focusJoined && b[k].focusShare > .4, tag + ': ' + b[k].heading + ' gathers its ' + n + (n > 1 ? ' pieces' : ' piece') + ', touching, on ' + Math.round(b[k].focusShare * 100) + '% of the frame');
  }
  const shown = all.flatMap(([, m]) => m.pieces.filter(p => p.label));
  say(shown.length > 0 && shown.every(p => p.font >= 13 && p.labelInside), tag + ': every label that shows is 13px or more and inside its own piece');
  const lw = b.work.pieces.filter(p => p.label).length;
  say(tag === 'wide' ? lw === 33 : lw >= 20, tag + ': on Work ' + lw + ' of 33 pieces carry their client\'s name' + (lw < 33 ? ' (the rest are too small; they answer to a tap)' : ''));
  console.log('  note ' + tag + ': neighbours of the same colour: J ' + b.j1.sameTypeNeighbours + '/' + b.j1.neighbours + ', second J ' + b.j2.sameTypeNeighbours + '/' + b.j2.neighbours + ', Work ' + b.work.sameTypeNeighbours + '/' + b.work.neighbours);
}
process.exitCode = bad ? 1 : 0;
