// Study 49: 47's page with the hovers Kahran picked from Study 48 (27 Oct: "Let's just go
// the A for all of them"): option a, who they are, for all six members, shown as T-a, a
// card over the column, under the name. The card's words are the brand guide's profile
// line for that member, word for word (personas.json, as 43–48). No picking sheet.
// Edit words.json, then:
//   node studies/iterations/49/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const PAGE = { file: 'six.html', body: 'six.html', title: 'six Tuesdays at once, a card for each' };
const MEMBERS = ['QC', 'CCG', 'SRO', 'NSF', 'EN', 'MCHE'];

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.give`] = p.give; DATA[`p${i}.profile`] = p.profile;
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.today`] = w.today; });
});

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag, tag = 'span', cls = '', attrs = '') => `<${tag} data-copy="${id}"${flag === 'draft' || cls ? ` class="${[flag === 'draft' ? 'line-draft' : '', cls].filter(Boolean).join(' ')}"` : ''}${attrs}>${esc(text)}</${tag}>`;
const w = (k, tag, cls) => span('49.' + k, word(k).text, word(k).flag, tag, cls);
const d = (k, tag, cls, attrs) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('49.data.' + k, DATA[k], 'data', tag, cls, attrs); };

// the places, as 43–48: a "today" is a coffeeshop, a bar or home when the guide's line says so
const PLACE = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/]];
const placeOf = (today) => (PLACE.find(([, re]) => re.test(today)) || [''])[0];

const flip = () => `<div class="flip" role="group"><button type="button" aria-pressed="true" data-with="0">${w('t.without')}</button><button type="button" aria-pressed="false" data-with="1">${w('t.with')}</button></div>`;

// each member's card: who they are (48's option a), nothing else
const hov = (i) => `<div class="hov" id="hov-${MEMBERS[i]}" role="tooltip">${d(`p${i}.profile`, 'p', 'opt', ` data-opt="${MEMBERS[i]}-a"`)}</div>`;

// six Tuesdays at once: every member's evening side by side; the same few places light up
const six = () => `<p class="lead">${w('g.h')}</p><div class="bar">${flip()}<p class="hint">${w('h.hint')} <button type="button" class="all" aria-pressed="false">${w('h.all')}</button></p></div>` + '<div class="six">' + personas.map((p, i) => `<div class="col" data-m="${MEMBERS[i]}" tabindex="0" aria-describedby="hov-${MEMBERS[i]}">${d(`p${i}.name`, 'h3')}${hov(i)}`
  + `<ul class="without">${p.wants.map((x, k) => `<li class="${placeOf(x.today) ? 'hit ' + placeOf(x.today) : ''}">${d(`p${i}.w${k}.today`)}</li>`).join('')}</ul>`
  + `<div class="with" hidden>${d(`p${i}.give`, 'p')}</div></div>`).join('') + '</div>';

function build() {
  const n = personas.reduce((s, p) => s + p.wants.length, 0);
  const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
  const copy = {};
  const note = (id, text, page) => {
    const key = id.slice(3);
    let entry;
    if (id.startsWith('49.data.')) {
      const dk = key.slice(5);
      entry = { text: DATA[dk], flag: 'sourced', src: /\.profile$/.test(dk) ? 'ewc/src/brand-guide.html, "Audience" (personas.json); Study 48 option ' + MEMBERS[+dk.match(/^p(\d)/)[1]] + '-a' : 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' };
    } else entry = { text: WORDS[key].text, flag: WORDS[key].flag, ...(WORDS[key].src ? { src: WORDS[key].src } : {}) };
    if (id === '49.all.claim') entry.text = text;
    if (!copy[id]) copy[id] = { ...entry, slot: key, pages: [] };
    if (!copy[id].pages.includes(page)) copy[id].pages.push(page);
  };
  let body = read('bodies/' + PAGE.body).replace(/\{\{SIX\}\}/g, () => six()).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
  body = body.slice(style.length);
  const html = read('shell.html').replace('{{TITLE}}', PAGE.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
    .replace('{{CLAIM}}', () => span('49.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? n : uses(k === 'countryclub' ? 'club' : k)), 'label'))
    .replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(PAGE.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  for (const m of html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], 'six');
  fs.writeFileSync(path.join(here, PAGE.file), html);
  console.log(PAGE.file);
  const out = { about: 'Every human-readable string on Study 49\'s page, by data-copy id. Written by build.cjs from words.json (ours and the site\'s) and personas.json (the brand guide). The hover cards are each member\'s profile line (Study 48 option a, Kahran\'s pick). flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; chrome = round 4\'s nav, footer, next.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { PAGE, DATA, WORDS, PLACE, MEMBERS, placeOf };
