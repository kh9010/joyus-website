// Study 45: the web (43 · 3) and the verbs (43 · 6) fused, not stacked. 44 put
// the two side by side; Kahran (27 Oct): "none of these are combining the idea,
// the sentiment… combine the ideas of these both, not the exact implementation."
// Each page here is one idea: people are where they already go, told as things
// done. Every word is in words.json (ours and the site's) or personas.json (the
// brand guide, word for word); each sits in an element with
// data-copy="45.<variant>.<slot>", and copy.json lists them all for a text pass.
// Edit words.json, then:
//   node studies/iterations/45/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const FUSES = [
  { key: '1', file: 'fuse-1-tuesday.html', body: '1-tuesday.html', title: '1: a Tuesday night' },
  { key: '2', file: 'fuse-2-instead.html', body: '2-instead.html', title: '2: instead of' },
  { key: '3', file: 'fuse-3-map.html', body: '3-map.html', title: '3: the map redrawn' },
  { key: '4', file: 'fuse-4-cast.html', body: '4-cast.html', title: '4: the cast' },
  { key: '5', file: 'fuse-5-verbs.html', body: '5-verbs.html', title: '5: two sets of verbs' },
];
const VERBS = ['reframe', 'meet', 'sort', 'price', 'cast', 'dress', 'open'];

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.profile`] = p.profile;
  DATA[`p${i}.giveLabel`] = p.giveLabel; DATA[`p${i}.give`] = p.give;
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.want`] = w.want; DATA[`p${i}.w${k}.today`] = w.today; });
});

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag, tag = 'span') => `<${tag} data-copy="${id}"${flag === 'draft' ? ' class="line-draft"' : ''}>${esc(text)}</${tag}>`;
const w = (k, tag) => span('45.' + k, word(k).text, word(k).flag, tag);
const d = (k, tag) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('45.data.' + k, DATA[k], 'data', tag); };

// the places, as 43/44: a "today" joins a place when the guide's line has its word;
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
    if (hit.length) for (const k of hit) edges.push({ p: pi, w: wi, s: at('45.web.place.' + k, word('web.place.' + k).text) });
    else edges.push({ p: pi, w: wi, s: at(`45.data.p${pi}.w${wi}.today`, x.today) });
  }));
  const order = places.map((_, i) => i).sort((a, b) => edges.filter(e => e.s === b).length - edges.filter(e => e.s === a).length || a - b);
  const remap = new Map(order.map((o, i) => [o, i]));
  return { places: order.map(o => places[o]), edges: edges.map(e => ({ ...e, s: remap.get(e.s) })) };
}
const uses = (W, k) => W.edges.filter(e => W.places[e.s].id === '45.web.place.' + k).length;
const placeSpan = (pl) => span(pl.id, pl.name, pl.id.startsWith('45.data.') ? 'data' : 'web');

// 1 · a Tuesday night: pick a member; their evening is what they want and where they go for it, then the club
const tuesday = () =>
  '<div class="pick" role="group">' + personas.map((p, i) => `<button type="button" aria-pressed="${i ? 'false' : 'true'}" data-p="${i}">${d(`p${i}.name`)}</button>`).join('') + '</div>\n'
  + personas.map((p, i) => `<div class="night"${i ? ' hidden' : ''} data-p="${i}">`
    + `<ol class="without">${p.wants.map((x, k) => `<li>${d(`p${i}.w${k}.want`, 'b')}<span class="where">${d(`p${i}.w${k}.today`)}</span></li>`).join('')}</ol>`
    + `<p class="with" hidden>${d(`p${i}.giveLabel`, 'b')} ${d(`p${i}.give`)}</p></div>`).join('\n');

// 2 · instead of: the wants filed under the place the club replaces, most-used first
const instead = (W) => {
  const groups = W.places.map((pl, s) => ({ pl, es: W.edges.filter(e => e.s === s) }));
  const big = groups.filter(g => g.es.length > 1), rest = groups.filter(g => g.es.length === 1);
  const li = (e, today) => `<li>${d(`p${e.p}.w${e.w}.want`)}<small>${d(`p${e.p}.name`)}${today ? ' · ' + d(`p${e.p}.w${e.w}.today`) : ''}</small></li>`;
  return big.map(g => `<section class="place"><h3>${w('i.instead')} ${placeSpan(g.pl)}<i>${g.es.length}</i></h3><ul>${g.es.map(e => li(e)).join('')}</ul></section>`).join('\n')
    + `\n<section class="place rest"><h3>${w('i.rest')}<i>${rest.length}</i></h3><ul>${rest.map(g => li(g.es[0], true)).join('')}</ul></section>`;
};

// 3 · the map redrawn: one picture, seven verbs acting on it
function map(W) {
  const VW = 1200, VH = 640, cx = VW / 2, cy = VH / 2;
  const ring = (n, rx, ry, k, off = -Math.PI / 2) => ({ x: cx + rx * Math.cos(off + (2 * Math.PI * k) / n), y: cy + ry * Math.sin(off + (2 * Math.PI * k) / n) });
  const P = personas.map((p, i) => ({ ...ring(personas.length, 200, 125, i, -Math.PI / 2 + Math.PI / personas.length), i }));
  const S = W.places.map((pl, s) => ({ ...ring(W.places.length, 340, 270, s), pl, n: W.edges.filter(e => e.s === s).length }));
  const anchor = (x) => (x < cx - 40 ? 'end' : x > cx + 40 ? 'start' : 'middle');
  const out = [];
  out.push(`<svg class="map" id="map" data-step="0" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Six members, the places they go today, and the club">`);
  out.push(`<ellipse class="s4 mix" cx="${cx}" cy="${cy}" rx="200" ry="125"/>`);
  for (const e of W.edges) { const a = P[e.p], b = S[e.s]; out.push(`<line class="s2 to-place" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`); }
  for (const a of P) out.push(`<line class="s6 to-club" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${cx}" y2="${cy}"/>`);
  S.forEach(s => {
    const cc = s.pl.id === '45.web.place.countryclub' ? ' cc' : '';
    out.push(`<g class="place${cc}"><circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${4 + s.n * 2}"/><text x="${(s.x + (anchor(s.x) === 'start' ? 12 : anchor(s.x) === 'end' ? -12 : 0)).toFixed(1)}" y="${(s.y + (anchor(s.x) === 'middle' ? (s.y < cy ? -14 : 22) : 4)).toFixed(1)}" text-anchor="${anchor(s.x)}"><tspan data-copy="${s.pl.id}">${esc(s.pl.name)}</tspan><tspan class="s3 n" dx="6">${s.n}</tspan></text></g>`);
  });
  for (const a of P) out.push(`<g class="s1 member"><rect x="${(a.x - 90).toFixed(1)}" y="${(a.y - 13).toFixed(1)}" width="180" height="26" rx="2"/><text x="${a.x.toFixed(1)}" y="${(a.y + 4).toFixed(1)}" text-anchor="middle" data-copy="45.data.p${a.i}.name">${esc(personas[a.i].name)}</text></g>`);
  out.push(`<g class="s5 club"><circle cx="${cx}" cy="${cy}" r="46"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" data-copy="45.m.club">${esc(word('m.club').text)}</text></g>`);
  out.push('</svg>');
  const steps = '<ol class="steps">' + VERBS.map((v, k) => `<li data-verb="${v}" data-k="${k}"${k ? '' : ' aria-current="step"'}><button type="button">${w(`m.${v}.verb`, 'b')}${v === 'open' ? `<small>${w('m.open.after')}</small>` : ''}</button>${w(`m.${v}.line`, 'p')}</li>`).join('') + '</ol>';
  // each step shows its own layer and every one before it
  const css = '<style>' + [1, 2, 3, 4, 5, 6].map(s => `.map .s${s}{opacity:0;transition:opacity .5s}`
    + [...Array(7 - s)].map((_, j) => `.map[data-step="${s + j}"] .s${s}`).join(',') + '{opacity:1}').join('')
    + '.map[data-step="6"] line.to-place{opacity:.1}</style>';
  return css + '\n' + out.join('\n') + '\n' + steps;
}

// 4 · the cast: a playbill. The six, by where they come from; then the parts the room needs
function cast(W) {
  const from = (i) => [...new Set(W.edges.filter(e => e.p === i).map(e => e.s))].map(s => placeSpan(W.places[s])).join('<i>·</i>');
  const people = '<ol class="bill">' + personas.map((p, i) => `<li>${d(`p${i}.name`, 'b')}<span class="dots"></span><span class="from">${w('c.from', 'small')} ${from(i)}</span></li>`).join('') + '</ol>';
  const roles = [['anchors', true], ['hosts', true], ['bridges', true], ['makers'], ['seekers'], ['quiet'], ['wild']];
  const parts = '<ul class="parts">' + roles.map(([r, does]) => `<li>${w(`c.r.${r}`, 'b')}${does ? w(`c.r.${r}.does`, 'small') : ''}</li>`).join('') + '</ul>';
  return `<h3 class="bill-h">${w('c.cast')}</h3>${people}<h3 class="bill-h">${w('c.parts')}</h3>${parts}<p class="rule">${w('c.rule')}</p>`;
}

// 5 · two sets of verbs: one index of the club's verbs, the members' and ours, a–z; "meet" is both
function verbIndex() {
  const ix = new Map();
  const add = (v, entry) => { if (!ix.has(v)) ix.set(v, []); ix.get(v).push(entry); };
  personas.forEach((p, i) => p.wants.forEach((_, k) => add(word(`v.p${i}.w${k}`).text, { kind: 'theirs', i, k })));
  VERBS.forEach(v => add(word(`v.o.${v}`).text, { kind: 'ours', v }));
  const keys = [...ix.keys()].sort((a, b) => a.localeCompare(b));
  const row = (e) => e.kind === 'theirs'
    ? `<li class="theirs">${d(`p${e.i}.w${e.k}.want`)}<small>${d(`p${e.i}.name`)} · ${d(`p${e.i}.w${e.k}.today`)}</small></li>`
    : `<li class="ours">${w(`v.o.${e.v}.date`)}</li>`;
  const head = (v, es) => { const e = es[0]; return e.kind === 'theirs' ? w(`v.p${e.i}.w${e.k}`) : w(`v.o.${e.v}`); };
  const legend = `<p class="legend"><span class="t">${w('v.theirs')}</span><span class="o">${w('v.ours')}</span></p>`;
  return legend + '<ul class="ix">' + keys.map(v => {
    const es = ix.get(v), kinds = [...new Set(es.map(e => e.kind))].join(' ');
    // a verb used more than once keeps one heading; the other uses carry their id on the row
    const extra = es.slice(1).map(e => e.kind === 'theirs' ? `<span hidden>${w(`v.p${e.i}.w${e.k}`)}</span>` : `<span hidden>${w(`v.o.${e.v}`)}</span>`).join('');
    return `<li class="${kinds}" data-verb="${esc(v)}"><details><summary>${head(v, es)}${extra}</summary><ul>${es.map(row).join('')}</ul></details></li>`;
  }).join('') + '</ul>';
}

function build() {
  const W = web();
  const P = { TUESDAY: tuesday(), INSTEAD: instead(W), MAP: map(W), CAST: cast(W), VERBINDEX: verbIndex() };
  const claim = span('45.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? personas.reduce((n, p) => n + p.wants.length, 0) : uses(W, k)), 'label');
  const shell = read('shell.html');
  const copy = {};
  const note = (id, text, variant) => {
    const key = id.slice(3);
    const entry = id.startsWith('45.data.') ? { text: DATA[key.slice(5)], flag: 'sourced', src: 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' }
      : { text: WORDS[key].text, flag: WORDS[key].flag, ...(WORDS[key].src ? { src: WORDS[key].src } : {}) };
    if (id === '45.all.claim') entry.text = text;
    if (!copy[id]) copy[id] = { ...entry, variant: key.split('.')[0], slot: key.split('.').slice(1).join('.'), pages: [] };
    if (!copy[id].pages.includes(variant)) copy[id].pages.push(variant);
  };
  for (const f of FUSES) {
    let body = read('bodies/' + f.body).replace(/\{\{(TUESDAY|INSTEAD|MAP|CAST|VERBINDEX)\}\}/g, (_, k) => P[k]).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
    const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
    body = body.slice(style.length);
    const html = shell.replace('{{TITLE}}', f.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
      .replace('{{CLAIM}}', () => claim).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
    if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(f.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
    for (const m of html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], f.key);
    fs.writeFileSync(path.join(here, f.file), html);
    console.log(f.file);
  }
  const out = { about: 'Every human-readable string on Study 45, by data-copy id. Written by build.cjs from words.json (ours) and personas.json (the brand guide). flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; web = our grouping of the guide\'s lines; chrome = round 4\'s nav, footer, next. pages = the variants it appears on.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { FUSES, VERBS, web, uses, DATA, WORDS };
