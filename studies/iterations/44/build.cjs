// Study 44: the web (43 · 3) and the seven verbs (43 · 6), combined five ways.
// Every word is in words.json (ours and the site's) or personas.json (the brand
// guide, word for word); the pages carry each one in an element with
// data-copy="44.<variant>.<slot>", and copy.json lists them all for a text pass.
// Edit words.json, then:
//   node studies/iterations/44/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); // text only: no attribute ever takes one

const COMBOS = [
  { key: 'a', file: 'combo-a-stacked.html', body: 'a-stacked.html', title: 'A: stacked' },
  { key: 'b', file: 'combo-b-halves.html', body: 'b-halves.html', title: 'B: two halves' },
  { key: 'c', file: 'combo-c-spine.html', body: 'c-spine.html', title: 'C: the verbs as the spine' },
  { key: 'd', file: 'combo-d-member.html', body: 'd-member.html', title: 'D: one member at a time' },
  { key: 'e', file: 'combo-e-lines.html', body: 'e-lines.html', title: 'E: six lines' },
];
const VERBS = ['reframe', 'meet', 'sort', 'price', 'cast', 'dress', 'open'];

// the guide's lines, by id
const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.profile`] = p.profile;
  DATA[`p${i}.giveLabel`] = p.giveLabel; DATA[`p${i}.give`] = p.give;
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.want`] = w.want; DATA[`p${i}.w${k}.today`] = w.today; });
});

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag) => `<span data-copy="${id}"${flag === 'draft' ? ' class="line-draft"' : ''}>${esc(text)}</span>`;
const w = (k) => span('44.' + k, word(k).text, word(k).flag);
const d = (k) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('44.data.' + k, DATA[k], 'data'); };

// places for the web (as 43): a "today" joins a place when the guide's line has its word;
// a line with none of them is its own place, named by the line itself
const PLACES = [
  ['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['countryclub', /country club/],
  ['gym', /\bgym\b/], ['charity', /charity events/], ['friends', /friends of friends/], ['work', /\bwork\b|office/],
  ['dinners', /dinners|restaurant/], ['concerts', /concerts/],
];
function web() {
  const places = [], edges = [];
  const at = (id, name) => { let i = places.findIndex(p => p.id === id); if (i < 0) { places.push({ id, name }); i = places.length - 1; } return i; };
  personas.forEach((p, pi) => p.wants.forEach((x, wi) => {
    const hit = PLACES.filter(([, re]) => re.test(x.today)).map(([k]) => k);
    if (hit.length) for (const k of hit) edges.push({ p: pi, w: wi, s: at('44.web.place.' + k, word('web.place.' + k).text) });
    else edges.push({ p: pi, w: wi, s: at(`44.data.p${pi}.w${wi}.today`, x.today) });
  }));
  const order = places.map((_, i) => i).sort((a, b) => edges.filter(e => e.s === b).length - edges.filter(e => e.s === a).length || a - b);
  const remap = new Map(order.map((o, i) => [o, i]));
  return { personas: personas.map((p, i) => ({ ...p, i })), places: order.map(o => places[o]), edges: edges.map(e => ({ ...e, s: remap.get(e.s) })), today: word('web.today').text };
}
const uses = (W, k) => W.edges.filter(e => W.places[e.s].id === '44.web.place.' + k).length;

const parts = (W) => ({
  CLAIM: span('44.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? personas.reduce((n, p) => n + p.wants.length, 0) : uses(W, k)), 'label'),
  WEB: read('parts/web.html').replace('{{WEB_JSON}}', () => JSON.stringify(W)),
  VERBS: '<ol class="verbs">\n' + VERBS.map(v => `  <li class="vb" data-verb="${v}"><p class="verb">${w(`all.v.${v}.verb`)}<small>${w(`all.v.${v}.date`)}</small></p><p class="vline">${w(`all.v.${v}.line`)}</p></li>`).join('\n') + '\n</ol>',
  STRIP: '<ol class="strip">' + VERBS.map(v => `<li data-verb="${v}">${w(`all.v.${v}.verb`)}<small>${w(`all.v.${v}.date`)}</small></li>`).join('') + '</ol>',
  PICK: '<div class="pick" role="group">' + personas.map((p, i) => `<button type="button" aria-pressed="${i ? 'false' : 'true'}" data-p="${i}">${d(`p${i}.name`)}</button>`).join('') + '</div>\n'
    + personas.map((p, i) => `<div class="member"${i ? ' hidden' : ''} data-p="${i}"><p class="profile">${d(`p${i}.profile`)}</p>`
      + `<div class="cols"><div><h3>${w('d.today')}</h3><ul>${p.wants.map((x, k) => `<li>${d(`p${i}.w${k}.today`)}<small>${d(`p${i}.w${k}.want`)}</small></li>`).join('')}</ul></div>`
      + `<div><h3>${w('d.give')}</h3><p>${d(`p${i}.give`)}</p></div></div></div>`).join('\n'),
  LINES: '<ul class="lines">\n' + personas.map((p, i) => `  <li><b>${d(`p${i}.name`)}</b><span class="want">${d(`p${i}.w0.want`)}</span><span class="instead">${w('e.instead')} ${d(`p${i}.w0.today`)}</span></li>`).join('\n') + '\n</ul>',
});

function build() {
  const W = web(), P = parts(W);
  const shell = read('shell.html');
  const copy = {};
  const note = (id, text, variant) => {
    const key = id.slice(3), x = id.startsWith('44.data.') ? null : WORDS[key];
    const entry = x ? { text: x.text, flag: x.flag, ...(x.src ? { src: x.src } : {}) } : { text: DATA[key.slice(5)], flag: 'sourced', src: 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' };
    if (id === '44.all.claim') entry.text = text;
    const slot = key.split('.').slice(1).join('.');
    if (!copy[id]) copy[id] = { ...entry, variant: key.split('.')[0], slot, pages: [] };
    if (!copy[id].pages.includes(variant)) copy[id].pages.push(variant);
  };
  for (const c of COMBOS) {
    let body = read('bodies/' + c.body).replace(/\{\{(WEB|VERBS|STRIP|PICK|LINES)\}\}/g, (_, k) => P[k]).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
    const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
    body = body.slice(style.length);
    let html = shell.replace('{{TITLE}}', c.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
      .replace('{{CLAIM}}', () => P.CLAIM).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
    if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(c.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
    for (const m of html.matchAll(/data-copy="([^"$]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], c.key);
    fs.writeFileSync(path.join(here, c.file), html);
    console.log(c.file);
  }
  // the web's panel and nodes are drawn by script: their ids are the guide's lines and the place names
  const withWeb = COMBOS.filter(c => read('bodies/' + c.body).includes('{{WEB}}')).map(c => c.key);
  for (const v of withWeb) {
    for (const pl of W.places) note(pl.id, pl.name, v);
    for (const k of Object.keys(DATA)) note('44.data.' + k, DATA[k], v);
    note('44.web.today', word('web.today').text, v);
  }
  const out = { about: 'Every human-readable string on Study 44, by data-copy id. Written by build.cjs from words.json (ours) and personas.json (the brand guide). flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; web = our grouping of the guide\'s lines; chrome = round 4\'s nav, footer, next. pages = the combinations it appears on.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { COMBOS, VERBS, web, uses, DATA, WORDS };
