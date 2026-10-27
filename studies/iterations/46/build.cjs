// Study 46: six variations on 45 · 1, "a Tuesday night" (Kahran, 27 Oct: "tuesday
// night is the right one, but lets come up with some variations around that").
// Same page as 45 (the finding first, a word budget, every readable string in a
// data-copy="46.<id>" element, listed in copy.json). New here: the founders' own
// answers to the Tuesday question, and their evening walk, verbatim from the
// workshop 2 board; the club's live lines, verbatim from the brand guide's voice
// page. The board's real prospect names never come onto a page.
// Edit words.json, then:
//   node studies/iterations/46/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WJ = JSON.parse(read('words.json'));
const WORDS = WJ.words, CLOCK = WJ.clock;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const VARIANTS = [
  { key: '1', file: 'tue-1-clock.html', body: '1-clock.html', title: '1: the clock' },
  { key: '2', file: 'tue-2-six.html', body: '2-six.html', title: '2: six Tuesdays at once' },
  { key: '3', file: 'tue-3-voice.html', body: '3-voice.html', title: '3: in the club\'s voice' },
  { key: '4', file: 'tue-4-words.html', body: '4-words.html', title: '4: their words first' },
  { key: '5', file: 'tue-5-split.html', body: '5-split.html', title: '5: split screen' },
  { key: '6', file: 'tue-6-deep.html', body: '6-deep.html', title: '6: one member, deep' },
];

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.profile`] = p.profile;
  DATA[`p${i}.giveLabel`] = p.giveLabel; DATA[`p${i}.give`] = p.give;
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.want`] = w.want; DATA[`p${i}.w${k}.today`] = w.today; });
});

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag, tag = 'span', cls = '') => `<${tag} data-copy="${id}"${flag === 'draft' || cls ? ` class="${[flag === 'draft' ? 'line-draft' : '', cls].filter(Boolean).join(' ')}"` : ''}>${esc(text)}</${tag}>`;
const w = (k, tag, cls) => span('46.' + k, word(k).text, word(k).flag, tag, cls);
const d = (k, tag, cls) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('46.data.' + k, DATA[k], 'data', tag, cls); };

// the places, as 43–45: a "today" is a coffeeshop, a bar or home when the guide's line says so
const PLACE = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/]];
const placeOf = (today) => (PLACE.find(([, re]) => re.test(today)) || [''])[0];
const ANSWERS = ['f.a1', 'f.a2', 'f.a3', 'f.a4'];
const LINES = ['v.l1', 'v.l2', 'v.l3', 'v.l4'];

const pick = (cls = 'pick') => `<div class="${cls}" role="tablist">` + personas.map((p, i) =>
  `<button type="button" role="tab" aria-selected="${i ? 'false' : 'true'}" data-p="${i}">${d(`p${i}.name`)}</button>`).join('') + '</div>';
const flip = () => `<div class="flip" role="group"><button type="button" aria-pressed="true" data-with="0">${w('t.without')}</button><button type="button" aria-pressed="false" data-with="1">${w('t.with')}</button></div>`;
const give = (i) => `<p class="give">${d(`p${i}.giveLabel`, 'b')} ${d(`p${i}.give`)}</p>`;

// 1 · the clock: one member's day, morning to late, each want where it falls, and where they go for it
const clock = () => pick() + flip() + personas.map((p, i) => `<div class="day" data-p="${i}"${i ? ' hidden' : ''}>`
  + CLOCK.parts.map(part => {
    const ks = p.wants.map((_, k) => k).filter(k => CLOCK.p[i][k] === part);
    return `<div class="part${ks.length ? '' : ' empty'}">${w('k.' + part, 'h3')}<ul>`
      + ks.map(k => `<li>${d(`p${i}.w${k}.want`, 'b')}<span class="where">${d(`p${i}.w${k}.today`)}</span></li>`).join('') + '</ul></div>';
  }).join('') + give(i) + '</div>').join('')
  + `<p class="note">${w('k.note', 'b')} ${w('f.a6', 'q')}</p>`;

// 2 · six Tuesdays at once: every member's evening side by side; the same few places light up
const six = () => `<p class="lead">${w('g.h')}</p>` + flip() + '<div class="six">' + personas.map((p, i) => `<div class="col">${d(`p${i}.name`, 'h3')}`
  + `<ul class="without">${p.wants.map((x, k) => `<li class="${placeOf(x.today) ? 'hit ' + placeOf(x.today) : ''}">${d(`p${i}.w${k}.today`)}</li>`).join('')}</ul>`
  + `<div class="with" hidden>${d(`p${i}.give`, 'p')}</div></div>`).join('') + '</div>';

// 3 · in the club's voice: their Tuesday in the founders' words, then the same day in the club's
const voice = () => `<p class="rule">${w('v.rule')}</p>`
  + `<div class="two"><div><h3 class="by">${w('t.without')}<small>${w('f.by')}</small></h3><ol class="said">${ANSWERS.map(a => w(a, 'li')).join('')}</ol></div>`
  + `<div><h3 class="by">${w('t.with')}<small>${w('v.by')}</small></h3><ol class="lines">${LINES.map(l => w(l, 'li')).join('')}</ol></div></div>`;

// 4 · their words first: the founders' six answers, big; then what we made of them
const words = () => `<blockquote class="said">${ANSWERS.concat(['f.a5', 'f.a6']).map(a => w(a, 'p')).join('')}<footer>${w('f.by')}</footer></blockquote>`
  + `<p class="heard">${w('w.heard')}</p><h3 class="then">${w('w.then')}</h3>` + pick()
  + personas.map((p, i) => `<ul class="night" data-p="${i}"${i ? ' hidden' : ''}>${p.wants.map((_, k) => `<li>${d(`p${i}.w${k}.want`, 'b')}<span class="where">${d(`p${i}.w${k}.today`)}</span></li>`).join('')}</ul>`).join('');

// 5 · split screen: scroll through the six; each is without on the left, with on the right
const split = () => `<p class="hint">${w('s.hint')} ↓</p><div class="heads"><b>${w('t.without')}</b><b>${w('t.with')}</b></div>` + personas.map((p, i) => `<section class="pair" data-p="${i}">`
  + `<div class="l">${d(`p${i}.name`, 'h3')}<ul>${p.wants.map((_, k) => `<li>${d(`p${i}.w${k}.want`, 'b')}<span class="where">${d(`p${i}.w${k}.today`)}</span></li>`).join('')}</ul></div>`
  + `<div class="r">${give(i)}</div></section>`).join('');

// 6 · one member, deep: a tab each; who they are, their four wants and where they go, then the club
const deep = () => pick('tabs') + personas.map((p, i) => `<article class="member" data-p="${i}"${i ? ' hidden' : ''}>`
  + `${d(`p${i}.name`, 'h3')}${d(`p${i}.profile`, 'p', 'profile')}`
  + `<ol class="night">${p.wants.map((_, k) => `<li>${d(`p${i}.w${k}.want`, 'b')}<span class="where">${d(`p${i}.w${k}.today`)}</span></li>`).join('')}</ol>`
  + give(i) + '</article>').join('');

function build() {
  const P = { CLOCK: clock(), SIX: six(), VOICE: voice(), WORDS: words(), SPLIT: split(), DEEP: deep() };
  const n = personas.reduce((s, p) => s + p.wants.length, 0);
  // counted as 43–45 count them: a want joins every place its line names
  const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
  const shell = read('shell.html');
  const copy = {};
  const note = (id, text, variant) => {
    const key = id.slice(3);
    const entry = id.startsWith('46.data.') ? { text: DATA[key.slice(5)], flag: 'sourced', src: 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' }
      : { text: WORDS[key].text, flag: WORDS[key].flag, ...(WORDS[key].src ? { src: WORDS[key].src } : {}) };
    if (id === '46.all.claim') entry.text = text;
    if (!copy[id]) copy[id] = { ...entry, variant: key.split('.')[0], slot: key.split('.').slice(1).join('.'), pages: [] };
    if (!copy[id].pages.includes(variant)) copy[id].pages.push(variant);
  };
  for (const v of VARIANTS) {
    let body = read('bodies/' + v.body).replace(/\{\{([A-Z]+)\}\}/g, (_, k) => { if (!(k in P)) throw new Error('no part ' + k); return P[k]; }).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
    const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
    body = body.slice(style.length);
    const html = shell.replace('{{TITLE}}', v.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
      .replace('{{CLAIM}}', () => span('46.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? n : uses(k === 'countryclub' ? 'club' : k)), 'label'))
      .replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
    if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(v.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
    for (const m of html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], v.key);
    fs.writeFileSync(path.join(here, v.file), html);
    console.log(v.file);
  }
  const out = { about: 'Every human-readable string on Study 46, by data-copy id. Written by build.cjs from words.json (ours, the founders\', the site\'s) and personas.json (the brand guide). flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; chrome = round 4\'s nav, footer, next. pages = the variants it appears on.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { VARIANTS, DATA, WORDS, CLOCK, PLACE, placeOf };
