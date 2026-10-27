// Study 48: 47's page plus a hover on each member's evening (Kahran, 27 Oct: "maybe we
// could have a onHover for each of them… give me some options for the hovers for all
// of the different personas, and I can tell you which ones to choose"). The page
// carries every option, hidden; the picking sheet (index.html) shows them as cards
// coded QC-a … MCHE-e and T-a … T-c, and tells the page which to show. Every option
// is verbatim from the source it names (options.json, written by extract.py).
// Edit words.json, or rerun extract.py, then:
//   node studies/iterations/48/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const OPTIONS = JSON.parse(read('options.json'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const PAGE = { file: 'six.html', body: 'six.html', title: 'six Tuesdays at once, with hovers' };

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.give`] = p.give;
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.today`] = w.today; });
});
const OPT = {};
for (const t of OPTIONS.treatments) OPT[t.code] = t;
for (const p of OPTIONS.personas) for (const o of p.options) OPT[o.code] = { ...o, member: p.code, name: p.name };

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag, tag = 'span', cls = '', attrs = '') => `<${tag} data-copy="${id}"${flag === 'draft' || cls ? ` class="${[flag === 'draft' ? 'line-draft' : '', cls].filter(Boolean).join(' ')}"` : ''}${attrs}>${esc(text)}</${tag}>`;
const w = (k, tag, cls) => span('48.' + k, word(k).text, word(k).flag, tag, cls);
const d = (k, tag, cls) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('48.data.' + k, DATA[k], 'data', tag, cls); };
const o = (code, tag = 'span', cls = '', attrs = '') => span('48.opt.' + code, OPT[code].text, OPT[code].flag, tag, cls, attrs);

// the places, as 43–47: a "today" is a coffeeshop, a bar or home when the guide's line says so
const PLACE = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/]];
const placeOf = (today) => (PLACE.find(([, re]) => re.test(today)) || [''])[0];

const flip = () => `<div class="flip" role="group"><button type="button" aria-pressed="true" data-with="0">${w('t.without')}</button><button type="button" aria-pressed="false" data-with="1">${w('t.with')}</button></div>`;

// each member's hover: every option, hidden; the picking sheet (or the default, option a) says which show
const hov = (i) => { const m = OPTIONS.personas[i]; return `<div class="hov" id="hov-${m.code}">` + m.options.map((x, k) => o(x.code, 'p', 'opt', ` data-opt="${x.code}"${k ? ' hidden' : ''}`)).join('') + '</div>'; };

// six Tuesdays at once: every member's evening side by side; the same few places light up
const six = () => `<p class="lead">${w('g.h')}</p><div class="bar">${flip()}<p class="hint">${w('h.hint')} <button type="button" class="all" aria-pressed="false">${w('h.all')}</button></p></div>` + '<div class="six">' + personas.map((p, i) => `<div class="col" data-m="${OPTIONS.personas[i].code}" tabindex="0" aria-describedby="hov-${OPTIONS.personas[i].code}">${d(`p${i}.name`, 'h3')}${hov(i)}`
  + `<ul class="without">${p.wants.map((x, k) => `<li class="${placeOf(x.today) ? 'hit ' + placeOf(x.today) : ''}">${d(`p${i}.w${k}.today`)}</li>`).join('')}</ul>`
  + `<div class="with" hidden>${d(`p${i}.give`, 'p')}</div></div>`).join('') + '</div>';

// the picking sheet: the treatments once, then each member's options, every one a tappable card with its code
const card = (code, kind) => `<button type="button" class="card" data-code="${code}"${OPT[code].member ? ` data-m="${OPT[code].member}"` : ''} aria-pressed="false"><b class="code">${code}</b><small>${esc(kind)}</small>${o(code)}</button>`;
const sheet = () => `<section class="pickset" aria-labelledby="ph-t"><h3 id="ph-t">Treatment <small>how the hover appears</small></h3><div class="cards">`
  + OPTIONS.treatments.map(t => card(t.code, t.name)).join('') + '</div></section>'
  + OPTIONS.personas.map(m => `<section class="pickset" data-m="${m.code}" aria-labelledby="ph-${m.code}"><h3 id="ph-${m.code}">${esc(m.name)} <small>${m.code}</small></h3><div class="cards">`
    + m.options.map(x => card(x.code, x.kind)).join('') + '</div></section>').join('');

function build() {
  const n = personas.reduce((s, p) => s + p.wants.length, 0);
  const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
  const copy = {};
  const note = (id, text, page) => {
    const key = id.slice(3);
    let entry;
    if (id.startsWith('48.data.')) entry = { text: DATA[key.slice(5)], flag: 'sourced', src: 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' };
    else if (id.startsWith('48.opt.')) { const x = OPT[key.slice(4)]; entry = { text: x.text, flag: x.flag, ...(x.src ? { src: x.src } : {}), code: x.code, ...(x.kind ? { kind: x.kind } : { kind: 'treatment' }) }; }
    else entry = { text: WORDS[key].text, flag: WORDS[key].flag, ...(WORDS[key].src ? { src: WORDS[key].src } : {}) };
    if (id === '48.all.claim') entry.text = text;
    if (!copy[id]) copy[id] = { ...entry, slot: key, pages: [] };
    if (!copy[id].pages.includes(page)) copy[id].pages.push(page);
  };
  let body = read('bodies/' + PAGE.body).replace(/\{\{SIX\}\}/g, () => six()).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
  body = body.slice(style.length);
  const html = read('shell.html').replace('{{TITLE}}', PAGE.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
    .replace('{{CLAIM}}', () => span('48.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? n : uses(k === 'countryclub' ? 'club' : k)), 'label'))
    .replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(PAGE.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  for (const m of html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], 'six');
  fs.writeFileSync(path.join(here, PAGE.file), html);
  console.log(PAGE.file);

  const pick = { members: OPTIONS.personas.map(m => ({ code: m.code, name: m.name, options: m.options.map(x => x.code) })), treatments: OPTIONS.treatments.map(t => t.code), text: Object.fromEntries(Object.entries(OPT).map(([k, x]) => [k, x.text])) };
  const idx = read('index.tpl.html').replace('<!--SHEET-->', () => sheet()).replace('/*PICK*/', () => 'const PICK = ' + JSON.stringify(pick) + ';');
  for (const m of idx.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], 'index');
  fs.writeFileSync(path.join(here, 'index.html'), idx);
  console.log('index.html');
  const out = { about: 'Every human-readable string on Study 48\'s page and picking sheet, by data-copy id. Written by build.cjs from words.json (ours and the site\'s), personas.json (the brand guide) and options.json (the hover options, verbatim from the sales kit, the guide, the EWC handoff and the workshop board). flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; chrome = round 4\'s nav, footer, next. code = what Kahran picks by. pages = six (the page) / index (the picking sheet).', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { PAGE, DATA, WORDS, OPTIONS, OPT, PLACE, placeOf };
