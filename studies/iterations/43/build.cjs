// Study 43: writes the six pages from shell.html + bodies/*.html, so all six are
// the same page outside the body. The grid, the people and the web come from
// personas.json (Study 42's snapshot of the brand guide), never hand-typed.
//   node studies/iterations/43/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// the six tellings: file, body, the shape line, and the Study 15 picks each borrows from
const TELLINGS = [
  { file: 'telling-1-log.html', body: '1-log.html', title: '1: the log', shape: 'every dated touchpoint, nothing left out', picks: ['rauno', 'increpare'] },
  { file: 'telling-2-lenses.html', body: '2-lenses.html', title: '2: lenses', shape: 'one project, four lenses', picks: ['quicksand'] },
  { file: 'telling-3-web.html', body: '3-web.html', title: '3: the web', shape: 'people linked to what they use instead', picks: ['trousdale'] },
  { file: 'telling-4-record.html', body: '4-record.html', title: '4: the record', shape: 'a short story, then the full record', picks: ['mindy-seu', 'forme'] },
  { file: 'telling-5-references.html', body: '5-references.html', title: '5: the references', shape: 'filed beside the places that shaped it', picks: ['archive-for-space'] },
  { file: 'telling-6-voice.html', body: '6-voice.html', title: '6: in its own voice', shape: 'seven verbs, in the club\'s voice', picks: ['fathom', 'lucas-pope'] },
];

// places for the web: a want's "today" joins a place when the guide's line has its word;
// a line with none of them is its own place, named by the line itself
const PLACES = [
  ['a coffeeshop', /coffeeshop/], ['a bar', /\bbar\b/], ['home, a house', /\bhome\b|house/], ['the country club', /country club/],
  ['a gym', /\bgym\b/], ['charity events', /charity events/], ['friends of friends', /friends of friends/], ['work, the office', /\bwork\b|office/],
  ['dinners, a restaurant', /dinners|restaurant/], ['concerts', /concerts/],
];

function web() {
  const places = [], edges = [];
  const at = (name) => { let i = places.findIndex(p => p.name === name); if (i < 0) { places.push({ name }); i = places.length - 1; } return i; };
  personas.forEach((p, pi) => p.wants.forEach((w, wi) => {
    const hit = PLACES.filter(([, re]) => re.test(w.today)).map(([n]) => n);
    for (const n of (hit.length ? hit : [w.today])) edges.push({ p: pi, w: wi, s: at(n) });
  }));
  // most-used places first, so the shared ones sit at the top
  const order = places.map((_, i) => i).sort((a, b) => edges.filter(e => e.s === b).length - edges.filter(e => e.s === a).length || a - b);
  const remap = new Map(order.map((o, i) => [o, i]));
  return { personas, places: order.map(o => places[o]), edges: edges.map(e => ({ ...e, s: remap.get(e.s) })) };
}

const people = personas.map(p => `        <div><h4>${esc(p.name)}</h4><p>${esc(p.profile)}</p></div>`).join('\n');
const rows = (credit) => '    <tbody>\n' + personas.map(p => p.wants.map((w, i) => `    <tr${i ? '' : ' class="first"'}>${
  i ? '' : `<td class="who" rowspan="${p.wants.length}"><h4>${esc(p.name)}</h4><p>${esc(p.profile)}</p></td>`
}<td class="want">${esc(w.want)}</td><td class="today">${esc(w.today)}</td>${
  i ? '' : `<td class="give" rowspan="${p.wants.length}"><b>${esc(p.giveLabel)}</b><span class="gives">${esc(p.give)}</span></td>`
}${credit && !i ? `<td class="by" rowspan="${p.wants.length}">persona: Divya<br>wants &amp; today: Kahran + founders, 27 May<br>words: the brand guide<br>carried forward: —</td>` : ''}</tr>`).join('\n')).join('\n') + '\n    </tbody>';

function build() {
const refs = JSON.parse(read('../15/refs.json')).refs;
const shell = read('shell.html');
for (const t of TELLINGS) {
  let body = read('bodies/' + t.body)
    .replace('{{PEOPLE_CARDS}}', () => people)
    .replace('{{GRID_TABLE_CREDIT}}', () => rows(true))
    .replace('{{GRID_TABLE}}', () => rows(false))
    .replace('{{WEB_JSON}}', () => JSON.stringify(web()));
  const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
  body = body.slice(style.length);
  const borrow = t.picks.map(s => { const r = refs.find(x => x.slug === s); if (!r || r.picked !== true) throw new Error(s + ' is not a Study 15 pick'); return `<a href="${r.url}" data-to="external" data-pick="${s}">${esc(r.name)}</a> (${esc(r.idea.charAt(0).toLowerCase() + r.idea.slice(1))})`; }).join(' + ');
  const html = shell.replace('{{TITLE}}', t.title).replace('{{SHAPE}}', esc(t.shape)).replace('{{BORROW}}', () => borrow)
    .replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim());
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error(t.file + ': unfilled ' + html.match(/\{\{[A-Z_]+\}\}/)[0]);
  fs.writeFileSync(path.join(here, t.file), html);
  console.log(t.file);
}
}
if (require.main === module) build();
module.exports = { TELLINGS, web };
