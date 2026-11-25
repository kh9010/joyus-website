// Study 115: the four rooms of Study 113, moved three different ways (Divya on 113: "I like the four rooms but I
// want a few different visual representations of it. Right now it feels too non-dynamic.")
//   a.html  through four doors: the rooms are one behind another and you walk into each
//   b.html  four bands: all four on screen, one open, opening and closing like an accordion
//   c.html  one thing, turned: the four rooms are four sides of one box that turns a quarter at a time
// Reads report.json (written by shoot.mjs from the three pages in a real browser, wide and phone) and the pages.
//  - all three keep 113's words exactly: the question and close from Study 111 no. 01, and each room's who, what
//    they came for, slide and "only they saw" line
//  - at every beat: no errors, no sideways scroll; in each room nothing is cut off; no slide enlarged; no words under 15px
//  - each one is really moving between rooms: the beat caught mid-way is neither room at rest
//  - a: standing in a room its words show; walking, the next room is visible ahead; from outside all four are in view
//  - b: exactly one band open in each room and all four always on screen; at the end the four are equal
//  - c: the side facing you goes 1, 2, 3, 4; at the end it turns all the way round, back to the first
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '111', 'questions.json'), 'utf8'))[0];
const base = fs.readFileSync(path.join(here, '..', '113', 'case.html'), 'utf8');
const rooms = (h) => [...h.matchAll(/<p class="who">([^<]+)<\/p><p class="came">([^<]+)<\/p>(?:<figure>)?<img src="img\/([^"]+)"[^>]*>(?:<\/figure>)?<p class="saw">([\s\S]*?)<\/p>/g)].map(m => m.slice(1).join(' | '));
const want = rooms(base);
say(want.length === 4, 'Study 113 has four rooms to keep');
const H = {};
for (const v of ['a', 'b', 'c']) {
  const h = H[v] = fs.readFileSync(path.join(here, v + '.html'), 'utf8');
  say(h.includes('<h1 id="q">' + Q.q + '</h1>') && (h.match(/<h1/g) || []).length === 1 && /<meta name="robots" content="noindex/.test(h), v + ': the question from Study 111 no. 01, asked once; noindex');
  say(JSON.stringify(rooms(h)) === JSON.stringify(want), v + ': the four rooms are 113\'s, word for word and slide for slide');
}
say(H.a.includes(Q.close) && H.b.includes(Q.close), 'a and b carry the closing line unchanged');
say(H.c.includes('We find what each room came for, and turn that side of the truth to face them.'), 'c changes the closing line by one phrase, to fit the turning (flagged for Divya)');
say(['story-8.jpg', 'pitch-9.jpg', 'angels-13.jpg', 'syndicate-15.jpg'].every(f => fs.existsSync(path.join(here, 'img', f))), 'the four real slides are present');
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [v, views] of Object.entries(rep.pages)) for (const [tag, r] of Object.entries(views)) {
  const b = r.beats, all = Object.values(b), t = v + ' ' + tag, four = ['room1', 'room2', 'room3', 'room4'].map(k => b[k]);
  say(r.errors.length === 0 && r.scrollWidth <= r.innerWidth, t + ': no errors, no sideways scroll');
  say(all.every(m => m.imgScale <= 1.0001) && four.every(m => m.cut === 0 && m.smallestText >= 15), t + ': in each room nothing is cut off, no slide is enlarged, no words under 15px');
  say(b.question.question && !b.room1.question, t + ': the question leaves before the first room');
  if (v === 'a') {
    say(four.map(m => m.room).join() === '0,1,2,3' && four.every(m => m.standing && m.contentShown && m.inside), t + ': you stand in each room in turn, with its words showing');
    say(!b.moving.standing && !b.moving.contentShown && b.moving.doorsShown >= 2, t + ': walking, the room ahead is in view and no words are (at ' + b.moving.at + ')');
    say(b.all.framesInView === 4 && b.all.caption && b.all.captionOverDoors === 0, t + ': from outside, all four are in view, clear of the closing line');
  } else if (v === 'b') {
    say(four.map(m => m.room).join() === '0,1,2,3' && four.every(m => m.open && m.openCount === 1 && m.namesShown === 3), t + ': one band open in each room, the other three showing their names');
    say(all.every(m => m.allOnScreen), t + ': all four bands are on screen the whole time');
    say(b.moving.openCount === 0 && b.moving.sizes[0] > 150 && b.moving.sizes[1] > 150, t + ': mid-way, one is closing as the next opens (' + b.moving.sizes.join(', ') + ')');
    say(new Set(b.all.sizes).size === 1 && b.all.caption && b.all.captionOverBands === 0, t + ': at the end the four are equal, clear of the closing line');
  } else {
    say(four.map(m => m.facing).join() === '0,1,2,3' && four.every(m => m.flat && m.faceOnScreen && m.inside), t + ': the side facing you goes first, second, third, fourth');
    say(!b.moving.flat && Math.abs(b.moving.turns - .5) < .2, t + ': mid-way it is turning (at ' + b.moving.turns + ' of a quarter-turn count)');
    say(b.turning.turns > 4 && !b.turning.flat && b.all.turns === 8 && b.all.facing === 0 && b.all.flat && b.all.caption && b.all.captionOverBox === 0, t + ': at the end it turns all the way round and comes back to the first side');
  }
}
process.exitCode = bad ? 1 : 0;
