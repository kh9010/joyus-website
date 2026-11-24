// Study 111: TomboyX investor storytelling, as questions (the way it is put in the work deck is no. 01).
//  - 20: as many as stayed different from each other; each opens on a question about what someone is trying to do, not on a page of the product
//  - no two share a question, a close, a picture, a quote or an opening line
//  - each has three running lines, a close that says what Joyus does, and a picture that exists
//  - the page is built from the list, in order
//  - every quote is in the Joyus work deck's TomboyX pages, word for word (typed out in
//    ../110/work-deck-tomboyx.txt from the PDF in this repo)
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const S = JSON.parse(fs.readFileSync(path.join(here, 'questions.json'), 'utf8'));
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');

say(S.length === 20, S.length + ' questions');
const notQ = S.filter(s => !/^(How|What) do you .+\?$/.test(s.q)).map(s => s.q);
say(!notQ.length, 'each opens on a "How do you …?" or "What do you …?" question' + (notQ.length ? ': ' + notQ.join(' | ') : ''));
// the question is about intent: it does not name a page, a screen or a deliverable
const THINGS = /\b(page|screen|slide|deck|appendix|chart|table|cover|template)\b/i;
const named = S.filter(s => THINGS.test(s.q)).map(s => s.q);
say(!named.length, 'no question names a page, a screen or a deliverable' + (named.length ? ': ' + named.join(' | ') : ''));
say(S.every(s => s.q.split(/\s+/).length <= 16), 'each question is 16 words at most');
const uniq = (k, f) => { const v = S.map(f); const d = v.filter((x, i) => v.indexOf(x) !== i); say(!d.length, 'no two share ' + k + (d.length ? ': ' + d.join(' | ') : '')); };
uniq('a question', s => s.q); uniq('a close', s => s.close); uniq('a picture', s => s.img); uniq('a quote', s => s.quote); uniq('an opening line', s => s.lines[0]);
say(S.every(s => s.lines.length === 3), 'three running lines each');
say(S.every(s => /^We /.test(s.close)), 'each close says what we do ("We …")');
const missing = S.filter(s => !fs.existsSync(path.join(here, 'img', s.img))).map(s => s.img);
say(!missing.length, 'every picture exists' + (missing.length ? ': ' + missing.join(', ') : ''));

const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const page = dec(html);
let at = 0, inOrder = true;
for (const s of S) { const i = page.indexOf(s.q, at); if (i < 0 || page.indexOf(s.close, i) < 0) { inOrder = false; console.log('       not on the page: ' + s.q); } else at = i; }
say(inOrder, 'every question and close is on the page, in order');
say((html.match(/class="item"/g) || []).length === S.length, 'one tick box per storyline');
say(!/class="(eyebrow|lede)"/.test(html), 'the title, then the list: nothing above or under the title');

{
  const norm = (t) => dec(dec(t)).replace(/&#39;/g, "'").replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\s+/g, ' ');
  const hay = norm(fs.readFileSync(path.join(here, '..', '110', 'work-deck-tomboyx.txt'), 'utf8'));
  const lost = S.filter(s => !hay.includes(norm(s.quote)));
  say(!lost.length, 'all ' + S.length + ' quotes are in the work deck, word for word' + (lost.length ? ':\n' + lost.map(s => '         ' + s.quote).join('\n') : ''));
}
process.exitCode = bad ? 1 : 0;
