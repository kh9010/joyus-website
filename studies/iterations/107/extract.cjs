// Study 107: reads the "Ideal flow" section of the CodeWords UX board (the FigJam pull kept, out of git, in
// .site-rebuild/agemo-figma) and writes data.json: where each flow box and each of the team's notes sits, and the
// lines between the boxes. No author names are written, and note text is kept only for the four the page quotes.
//   node studies/iterations/107/extract.cjs
const fs = require('node:fs');
const path = require('node:path');
const repo = path.resolve(__dirname, '..', '..', '..');
const t = fs.readFileSync(path.join(repo, '.site-rebuild', 'agemo-figma', 'raw', 'board-codewords-ux.xml.txt'), 'utf8');
const a = t.indexOf('name="Ideal flow"'), s0 = t.lastIndexOf('<section', a), s1 = t.indexOf('<section', a + 10);
const sec = t.slice(s0, s1 < 0 ? undefined : s1);
const dec = (x) => { for (let i = 0; i < 2; i++) x = x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); return x.replace(/\s+/g, ' ').trim(); };
const attr = (tag, k) => { const m = tag.match(new RegExp(' ' + k + '="([^"]*)"')); return m ? m[1] : null; };
const num = (tag, k) => Math.round(+attr(tag, k));

const boxes = [], ids = {};
for (const m of sec.matchAll(/<shape-with-text ([^>]*)>([\s\S]*?)<\/shape-with-text>/g)) {
  const tag = ' ' + m[1], kind = attr(tag, 'name');
  if (!/^(ROUNDED_RECTANGLE|DIAMOND|SQUARE)$/.test(kind)) continue;          // the flow itself; not the legend's ellipses
  ids[attr(tag, 'id')] = boxes.length;
  boxes.push({ x: num(tag, 'x'), y: num(tag, 'y'), w: num(tag, 'width'), h: num(tag, 'height'), d: kind === 'DIAMOND' ? 1 : 0, t: dec(m[2]) });
}
const links = [];
for (const m of sec.matchAll(/<connector ([^>]*)>/g)) { const tag = ' ' + m[1], i = ids[attr(tag, 'connectorStart')], j = ids[attr(tag, 'connectorEnd')]; if (i != null && j != null && i !== j) links.push([i, j]); }
const QUOTED = [
  'I don’t really know what types of thing I can build with CodeWords',
  'I don’t know what integrations is',
  'I’m not sure if there is anything I need during the build phase. Do I just sit and wait?',
  'What is this page for?',
];
const notes = [];
for (const m of sec.matchAll(/<sticky ([^>]*)>([\s\S]*?)<\/sticky>/g)) {
  const tag = ' ' + m[1], text = dec(m[2]);
  if (/^(Input|Output) mental model$/.test(text)) continue;                  // Divya's two row labels, not notes
  const n = { x: num(tag, 'x'), y: num(tag, 'y'), w: num(tag, 'width'), h: num(tag, 'height') };
  const q = QUOTED.indexOf(text); if (q >= 0) { n.q = q; n.t = text; }
  notes.push(n);
}
notes.sort((p, q) => p.x - q.x || p.y - q.y);
const lanes = [...sec.matchAll(/<text [^>]*name="(Home|New|Build|Run)"[^>]*?x="(-?[\d.]+)"[^>]*?y="(-?[\d.]+)"/g)].map(m => ({ t: m[1], x: Math.round(+m[2]), y: Math.round(+m[3]) }));
const all = [...boxes, ...notes];
const bb = { x0: Math.min(...all.map(e => e.x)), y0: Math.min(...all.map(e => e.y)), x1: Math.max(...all.map(e => e.x + e.w)), y1: Math.max(...all.map(e => e.y + e.h)) };
const out = { box: [bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0], boxes, links, notes, lanes };
fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(out));
console.log('boxes', boxes.length, 'links', links.length, 'notes', notes.length, 'quoted', notes.filter(n => n.t).length, 'lanes', lanes.length, 'bounds', out.box.join(' '));
console.log(boxes.map(b => b.t).join(' | '));
