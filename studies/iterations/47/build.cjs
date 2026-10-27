// Study 47: 46 · 2, six Tuesdays at once, alone (Kahran, 27 Oct: "two is the way
// to go. It's just that with EWC, it needs to be spaced out a little better, so
// it's a little more readable"). Same page, same words, same rules as 46 (the
// finding first, a word budget, every readable string in a data-copy="47.<id>"
// element, listed in copy.json). Only the "with EWC" state is re-spaced: the
// gives are paragraphs, so they get three columns (one on a phone), a longer
// line, more air between the six, and the struck-through places no longer
// hold the space above them. measure.mjs pins the numbers.
// Edit words.json, then:
//   node studies/iterations/47/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const PAGE = { file: 'six.html', body: 'six.html', title: 'six Tuesdays at once' };

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.give`] = p.give;
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.today`] = w.today; });
});

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag, tag = 'span', cls = '') => `<${tag} data-copy="${id}"${flag === 'draft' || cls ? ` class="${[flag === 'draft' ? 'line-draft' : '', cls].filter(Boolean).join(' ')}"` : ''}>${esc(text)}</${tag}>`;
const w = (k, tag, cls) => span('47.' + k, word(k).text, word(k).flag, tag, cls);
const d = (k, tag, cls) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('47.data.' + k, DATA[k], 'data', tag, cls); };

// the places, as 43–46: a "today" is a coffeeshop, a bar or home when the guide's line says so
const PLACE = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/]];
const placeOf = (today) => (PLACE.find(([, re]) => re.test(today)) || [''])[0];

const flip = () => `<div class="flip" role="group"><button type="button" aria-pressed="true" data-with="0">${w('t.without')}</button><button type="button" aria-pressed="false" data-with="1">${w('t.with')}</button></div>`;

// six Tuesdays at once: every member's evening side by side; the same few places light up
const six = () => `<p class="lead">${w('g.h')}</p>` + flip() + '<div class="six">' + personas.map((p, i) => `<div class="col">${d(`p${i}.name`, 'h3')}`
  + `<ul class="without">${p.wants.map((x, k) => `<li class="${placeOf(x.today) ? 'hit ' + placeOf(x.today) : ''}">${d(`p${i}.w${k}.today`)}</li>`).join('')}</ul>`
  + `<div class="with" hidden>${d(`p${i}.give`, 'p')}</div></div>`).join('') + '</div>';

function build() {
  const n = personas.reduce((s, p) => s + p.wants.length, 0);
  // counted as 43–46 count them: a want joins every place its line names
  const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
  const copy = {};
  const note = (id, text) => {
    const key = id.slice(3);
    const entry = id.startsWith('47.data.') ? { text: DATA[key.slice(5)], flag: 'sourced', src: 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' }
      : { text: WORDS[key].text, flag: WORDS[key].flag, ...(WORDS[key].src ? { src: WORDS[key].src } : {}) };
    if (id === '47.all.claim') entry.text = text;
    if (!copy[id]) copy[id] = { ...entry, slot: key };
  };
  let body = read('bodies/' + PAGE.body).replace(/\{\{SIX\}\}/g, () => six()).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
  body = body.slice(style.length);
  const html = read('shell.html').replace('{{TITLE}}', PAGE.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
    .replace('{{CLAIM}}', () => span('47.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? n : uses(k === 'countryclub' ? 'club' : k)), 'label'))
    .replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(PAGE.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  for (const m of html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2]);
  fs.writeFileSync(path.join(here, PAGE.file), html);
  console.log(PAGE.file);
  const out = { about: 'Every human-readable string on Study 47, by data-copy id. Written by build.cjs from words.json (ours and the site\'s) and personas.json (the brand guide). flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; chrome = round 4\'s nav, footer, next.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { PAGE, DATA, WORDS, PLACE, placeOf };
