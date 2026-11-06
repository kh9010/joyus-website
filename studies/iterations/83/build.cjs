// Study 83: why a Tuesday. Study 50's page held exactly (46 · 2's columns, the give one sentence to a
// paragraph, 49's cards), plus one piece above the six Tuesdays that answers one question: why is it a
// Tuesday? Four visual answers behind ?v=a|b|c|d (default a), one shown at a time:
//   a  the week as a strip: six nights already have a job, Tuesday is the open one
//   b  the week's curve: how spoken-for each night is; Tuesday sits on the floor
//   c  the competition as places: a Tuesday, otherwise, sized by the guide's own wants
//   d  a month: one Saturday event against every Tuesday, a regular
// The reading of the week (Mon steam, Wed slump, Thu out, the weekend planned) is Kahran's, 6 Nov,
// spoken, and is marked "our reading" on the page. The quotes are verbatim from the workshop 2 board
// and the brand guide, the sources 46-50 use; check.cjs finds them there.
// Edit words.json, then:
//   node studies/iterations/83/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// the guide's give line, cut at its full stops: one sentence to a paragraph
const sentences = (t) => t.split(/(?<=\."?)\s+(?=[A-Z"])/);
const PAGE = { file: 'six.html', body: 'six.html', title: 'why a Tuesday, four ways' };
const MEMBERS = ['QC', 'CCG', 'SRO', 'NSF', 'EN', 'MCHE'];
const OPTIONS = ['a', 'b', 'c', 'd'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
// b: how spoken-for each night is, 0..1 (our reading of Kahran's week, not a measurement)
const SPOKEN = { mon: 0.62, tue: 0, wed: 0.4, thu: 0.78, fri: 0.9, sat: 1, sun: 0.7 };

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.give`] = p.give; DATA[`p${i}.profile`] = p.profile;
  sentences(p.give).forEach((x, n) => { DATA[`p${i}.give.s${n}`] = x; });
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.today`] = w.today; });
});

const word = (k) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); return x; };
const span = (id, text, flag, tag = 'span', cls = '', attrs = '') => `<${tag} data-copy="${id}"${flag === 'draft' || cls ? ` class="${[flag === 'draft' ? 'line-draft' : '', cls].filter(Boolean).join(' ')}"` : ''}${attrs}>${esc(text)}</${tag}>`;
const w = (k, tag, cls) => span('83.' + k, word(k).text, word(k).flag, tag, cls);
const d = (k, tag, cls, attrs) => { if (!(k in DATA)) throw new Error('no data ' + k); return span('83.data.' + k, DATA[k], 'data', tag, cls, attrs); };

// the places, as 43-50: a "today" is a coffeeshop, a bar or home when the guide's line says so
const PLACE = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/]];
const placeOf = (today) => (PLACE.find(([, re]) => re.test(today)) || [''])[0];
const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);

const flip = () => `<div class="flip" role="group"><button type="button" aria-pressed="true" data-with="0">${w('t.without')}</button><button type="button" aria-pressed="false" data-with="1">${w('t.with')}</button></div>`;
const hov = (i) => `<div class="hov" id="hov-${MEMBERS[i]}" role="tooltip">${d(`p${i}.profile`, 'p', 'opt', ` data-opt="${MEMBERS[i]}-a"`)}</div>`;

// Study 50's six Tuesdays, unchanged
const six = () => `<p class="lead">${w('g.h')}</p><div class="bar">${flip()}<p class="hint">${w('h.hint')} <button type="button" class="all" aria-pressed="false">${w('h.all')}</button></p></div>` + '<div class="six">' + personas.map((p, i) => `<div class="col" data-m="${MEMBERS[i]}" tabindex="0" aria-describedby="hov-${MEMBERS[i]}">${d(`p${i}.name`, 'h3')}${hov(i)}`
  + `<ul class="without">${p.wants.map((x, k) => `<li class="${placeOf(x.today) ? 'hit ' + placeOf(x.today) : ''}">${d(`p${i}.w${k}.today`)}</li>`).join('')}</ul>`
  + `<div class="with" hidden>${sentences(p.give).map((_, n) => d(`p${i}.give.s${n}`, 'p')).join('')}</div></div>`).join('') + '</div>';

// ---- why a Tuesday ----
const head = () => `<p class="why-k">${w('why.k')}<span class="ours">${w('why.ours')}</span></p>`;
const quote = (k, cite) => `<blockquote class="why-q"><p>${w(k)}</p><footer>${w(cite)}</footer></blockquote>`;
const dots = (n) => `<span class="dots" aria-label="${n}">${'<i></i>'.repeat(n)}</span>`;

// a: the week as a strip; six nights filled, Tuesday open, pointing down at the six evenings
const optA = () => `${head()}<p class="why-line">${w('why.a.line')}</p><ol class="week">${DAYS.map(k =>
  `<li class="night${k === 'tue' ? ' open' : ''}">${w('why.d.' + k, 'b')}${w('why.n.' + k)}${k === 'tue' ? '<span class="down" aria-hidden="true">↓</span>' : ''}</li>`).join('')}</ol>`;

// b: the week's curve; the line is drawn through each night's centre, Tuesday on the floor
const optB = () => {
  const pts = DAYS.map((k, i) => [i * 100 + 50, 100 - SPOKEN[k] * 84 - 8]);
  let p = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    p += ` C${c1.map(Math.round)},${c2.map(Math.round)},${p2}`;
  }
  return `${head()}<div class="curve"><span class="axis">${w('why.b.axis')}</span>`
    + `<svg viewBox="0 0 700 100" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="700" y1="92" y2="92"/><path d="${p}"/></svg>`
    + `<ol>${DAYS.map((k, i) => `<li class="${k === 'tue' ? 'open' : ''}" style="--t:${(pts[i][1] / 100).toFixed(3)}"><i class="pt"></i>${w('why.d.' + k, 'b')}${w('why.n.' + k)}</li>`).join('')}</ol></div>`
    + quote('why.b.q', 'why.q.cite.board');
};

// c: the competition as places; each place as wide as the wants it already holds, EWC the empty one
const optC = () => `${head()}<p class="why-line">${w('why.c.line')}</p><p class="why-sub">${w('why.c.k')}</p><div class="street">`
  + PLACE.map(([k]) => `<div class="place" style="--n:${uses(k)}">${w('why.c.' + k, 'b')}${dots(uses(k))}</div>`).join('')
  + `<div class="place ewc" style="--n:3">${w('why.c.ewc', 'b')}${quote('why.c.q', 'why.q.cite.board')}</div></div>`;

// d: a month; one Saturday event, and the same small mark on every Tuesday
const optD = () => `${head()}<div class="month"><div class="mh">${DAYS.map(k => w('why.d.' + k, 'b', k === 'tue' ? 'tue' : '')).join('')}</div>`
  + `<div class="mg">${Array.from({ length: 35 }, (_, n) => { const k = DAYS[n % 7], wk = Math.floor(n / 7);
    if (k === 'tue') return `<span class="cell tue">${wk === 0 ? w('why.cal.every', 'small') : ''}</span>`;
    if (k === 'sat' && wk === 2) return `<span class="cell event">${w('why.cal.event', 'small')}</span>`;
    return '<span class="cell"></span>'; }).join('')}</div></div>` + quote('why.cal.q', 'why.q.cite.guide');

const why = () => [optA, optB, optC, optD].map((f, i) => `<section class="why" data-opt="${OPTIONS[i]}" aria-label="why a Tuesday">${f()}</section>`).join('\n');

function build() {
  const n = personas.reduce((s, p) => s + p.wants.length, 0);
  const copy = {};
  const note = (id, text, page) => {
    const key = id.slice(3);
    let entry;
    if (id.startsWith('83.data.')) {
      const dk = key.slice(5);
      entry = { text: DATA[dk], flag: 'sourced', src: /\.profile$/.test(dk) ? 'ewc/src/brand-guide.html, "Audience" (personas.json); Study 48 option ' + MEMBERS[+dk.match(/^p(\d)/)[1]] + '-a' : 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)' };
    } else entry = { text: WORDS[key].text, flag: WORDS[key].flag, ...(WORDS[key].src ? { src: WORDS[key].src } : {}) };
    if (id === '83.all.claim') entry.text = text;
    if (!copy[id]) copy[id] = { ...entry, slot: key, pages: [] };
    if (!copy[id].pages.includes(page)) copy[id].pages.push(page);
  };
  let body = read('bodies/' + PAGE.body).replace(/\{\{SIX\}\}/g, () => six()).replace(/\{\{WHY\}\}/g, () => why()).replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  const style = (body.match(/^<style>[\s\S]*?<\/style>\n/) || [''])[0];
  body = body.slice(style.length);
  const html = read('shell.html').replace('{{TITLE}}', PAGE.title).replace('<!--STYLE-->', () => style.trim()).replace('<!--BODY-->', () => body.trim())
    .replace('{{CLAIM}}', () => span('83.all.claim', word('all.claim').text.replace(/\{(\w+)\}/g, (_, k) => k === 'n' ? n : uses(k === 'countryclub' ? 'club' : k)), 'label'))
    .replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k));
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error(PAGE.file + ': unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  for (const m of html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)) note(m[1], m[2], 'six');
  fs.writeFileSync(path.join(here, PAGE.file), html);
  console.log(PAGE.file);
  const out = { about: 'Every human-readable string on Study 83\'s page, by data-copy id. Written by build.cjs from words.json (ours and the site\'s) and personas.json (the brand guide). Study 50\'s strings unchanged (as 83.*), plus the why-a-Tuesday piece (83.why.*), four options behind ?v=a|b|c|d. flag: draft = ours, for Kahran\'s pass; label = ours, wayfinding; sourced = verbatim, see src; chrome = round 4\'s nav, footer, next.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('copy.json', Object.keys(copy).length, 'strings');
}
if (require.main === module) build();
module.exports = { PAGE, DATA, WORDS, PLACE, MEMBERS, OPTIONS, DAYS, SPOKEN, placeOf, sentences, uses };
