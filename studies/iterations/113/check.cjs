// Study 113: TomboyX, "How do you tell one story to four different rooms?", built as a walk through four rooms.
// Reads report.json (written by shoot.mjs from the page in a real browser, wide and phone) and the page itself.
//  - the question and the closing line are the ones Divya picked (Study 111, no. 01), unchanged
//  - four rooms, each with who is in it, what they came for, one real slide and what only they saw; the four slides
//    are the ones the spine named (Study 112)
//  - at every beat: no errors, no sideways scroll, nothing of the room you are in cut off or spilling out of it
//  - the walk goes room 1, 2, 3, 4 one at a time, then steps back until all four are in view
//  - no slide is ever enlarged past its own pixels; no amounts of money on the page
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'case.html'), 'utf8');
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '111', 'questions.json'), 'utf8'))[0];
say(html.includes('<h1 id="q">' + Q.q + '</h1>') && html.includes(Q.close), 'the question is no. 01 from Study 111 and the close carries its line');
say(/<meta name="robots" content="noindex/.test(html) && (html.match(/<h1/g) || []).length === 1, 'noindex; the question is asked once');
const rooms = [...html.matchAll(/<section class="room"><p class="who">([^<]+)<\/p><p class="came">([^<]+)<\/p><figure><img src="img\/([^"]+)"/g)].map(m => ({ who: m[1], came: m[2], img: m[3] }));
say(rooms.length === 4 && new Set(rooms.map(r => r.img)).size === 4 && rooms.every(r => fs.existsSync(path.join(here, 'img', r.img))), 'four rooms, four different real slides, all present');
say(rooms.map(r => r.img).join() === 'story-8.jpg,pitch-9.jpg,angels-13.jpg,syndicate-15.jpg', 'the slides are the four the spine named, in the order the rooms were asked');
say((html.match(/Only they saw/g) || []).length === 4, 'each room says what only it saw');
say(!/[$£€]\s?\d|\d\s?(million|k\b)/i.test(html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '')), 'no amounts of money');
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [tag, v] of Object.entries(rep.views)) {
  const b = v.beats, all = Object.values(b), walk = ['room1', 'room2', 'room3', 'room4'].map(k => b[k]);
  say(v.errors.length === 0 && v.scrollWidth <= v.innerWidth, tag + ': no errors, no sideways scroll');
  say(b.question.question && !b.question.strip && !b.room1.question && b.room1.strip, tag + ': the question leaves before the first room');
  say(walk.map(m => m.room).join() === '0,1,2,3' && walk.map(m => m.who).join('|') === rooms.map(r => r.who).join('|'), tag + ': the walk goes room by room, in order');
  say(walk.every(m => m.cut === 0 && m.inside && m.roomsInView === 1 && m.scale === 1), tag + ': in each room, the whole of it is on screen and nothing spills out of it');
  say(b.all.roomsInView === 4 && b.all.cut === 0 && b.all.caption && b.all.captionOverRooms === 0 && b.all.scale < 1, tag + ': then all four are in view at once, with the closing line clear of them');
  say(all.every(m => m.imgScale <= 1.0001), tag + ': no slide is enlarged past its own pixels (largest ' + Math.max(...all.map(m => m.imgScale)) + ')');
  say(walk.every(m => m.smallestText >= 15), tag + ': no words under 15px in a room');
}
process.exitCode = bad ? 1 : 0;
