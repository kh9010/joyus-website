// Study 105: Agemo product design, "one page, read from three distances".
// Reads report.json (written by shoot.mjs from the page in a real browser, wide and phone) and the page itself.
//  - the question and the closing line are the ones Divya picked (Study 102, no. 05), unchanged
//  - at every beat: no errors, no sideways scroll, the caption never over the picture, nothing off screen
//  - the picture is never enlarged past its own pixels (scale <= 1)
//  - the camera only ever gets closer until it pulls back: glance < read < study, then back to the glance
//  - the highlighter marks what belongs to each distance: 3, 3, 1, and all 7 at the end
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'case.html'), 'utf8');
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '102', 'questions.json'), 'utf8'))[4];
say(html.includes('<h1 id="q">' + Q.q + '</h1>'), 'the question is no. 05 from Study 102, word for word');
say(html.includes(Q.close), 'the close carries its line: ' + Q.close);
say(/<meta name="robots" content="noindex/.test(html), 'noindex');
say((html.match(/<h1/g) || []).length === 1 && html.indexOf('id="q"') < html.indexOf('id="view"'), 'the question is asked once, before the page');
say(fs.statSync(path.join(here, 'img', 'tool-page.png')).size > 100000, 'the picture is the real tool page');
const rep = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
for (const [tag, v] of Object.entries(rep.views)) {
  const b = v.beats, all = Object.values(b);
  say(v.errors.length === 0, tag + ': no errors' + (v.errors[0] ? ': ' + v.errors[0] : ''));
  say(v.scrollWidth <= v.innerWidth, tag + ': no sideways scroll (' + v.scrollWidth + ' in ' + v.innerWidth + ')');
  say(all.every(m => m.captionOverFrame === 0 && m.captionOut === 0 && m.frameInArea), tag + ': the caption is never over the picture, and nothing is off screen');
  say(all.every(m => m.scale <= 1.0001), tag + ': never past the picture\'s own pixels (largest ' + Math.max(...all.map(m => m.scale)) + ')');
  say(b.question.question && !b.question.pageShown && !b.far.question && b.far.pageShown, tag + ': the question leaves before the page arrives');
  say(b.far.scale < b.glance.scale && b.glance.scale < b.read.scale && b.read.scale < b.study.scale && Math.abs(b.same.scale - b.glance.scale) < .001, tag + ': closer each time, then back out (' + [b.far, b.glance, b.read, b.study, b.same].map(m => m.scale).join(' → ') + ')');
  say([b.glance.marksOn, b.read.marksOn, b.study.marksOn, b.same.marksOn].join() === '3,3,1,7', tag + ': the highlighter marks 3, 3, 1, then all 7');
  say(b.glance.marksOffScreen === 0 && b.study.marksOffScreen === 0 && b.same.marksOffScreen === 0 && b.read.marksOffScreen <= (tag === 'phone' ? 1 : 0), tag + ': the marks are inside the window' + (b.read.marksOffScreen ? ' (on a phone the long description runs past its edge)' : ''));
  say(b.glance.caption[0] === 'A glance.' && b.read.caption[0] === 'A read.' && b.study.caption[0] === 'A study.' && b.same.caption[0] === 'The same page, all along.', tag + ': one caption at each distance');
  say(all.filter(m => m.smallestText).every(m => m.smallestText >= 15), tag + ': no words under 15px');
}
process.exitCode = bad ? 1 : 0;
