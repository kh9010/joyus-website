// Study 84: the EWC case study, four finished pages on one, behind ?v=a|b|c|d (a = the judge's top scorer).
// The top four of five concepts after three judged rounds against Kahran's 21 bet answers (6 Nov):
//   a  Sotto Voce          two registers: upright = the club, an italic margin = us; a picture per section
//   b  Your Move           a short game in three moves; the reader decides first, then the reveal; a third chair
//   c  Two Tuesdays        the same Tuesday twice, before and after, on a hinge; you choose the first domino
//   d  Tuesday to Tuesday  one week, from an empty Tuesday to one with the club in it
// Each option carries Study 50's six Tuesdays held (columns, gives, cards; the cards start at the life
// sentence, the income clause dropped for the public repo) and, under it, the bet against that page:
// all 21 questions with the judge's final score and where on the page each is answered (concepts.json).
// Words: words.json (ours, the club's verbatim) + personas.json (the guide) + ../../sitemap/bet.json (the
// questions). Every string sits in a data-copy="84.<id>" element; this writes six.html and copy.json.
//   node studies/iterations/84/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const { options: CONCEPTS } = JSON.parse(read('concepts.json'));
const BET = JSON.parse(fs.readFileSync(path.join(here, '../../sitemap/bet.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const PAGE = { file: 'six.html', title: 'the case study, four ways' };
const OPTIONS = CONCEPTS.map(c => c.v);
const MEMBERS = ['QC', 'CCG', 'SRO', 'NSF', 'EN', 'MCHE'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const QIDS = BET.beliefs.flatMap((b, i) => ['f', 'e', 'i'].map(k => `b${i + 1}.${k}`));
const sentences = (t) => t.split(/(?<=\."?)\s+(?=[A-Z"])/);
// the hover card: the guide's profile line from its second sentence (the first carries income; public repo)
const life = (p) => p.profile.slice(p.profile.indexOf('. ') + 2);

// the places, as 43-83: a "today" is a coffeeshop, a bar, home or a country club when the guide's line says so
const PLACE = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/]];
const placeOf = (today) => (PLACE.find(([, re]) => re.test(today)) || ['other'])[0];
// counted as 43-83 count them: a want lights every place its line names (coffeeshop 4 · bar 3 · home 4 · country club 2)
const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.life`] = life(p);
  sentences(p.give).forEach((x, n) => { DATA[`p${i}.give.s${n}`] = x; });
  p.wants.forEach((w, k) => { DATA[`p${i}.w${k}.today`] = w.today; DATA[`p${i}.w${k}.want`] = w.want; });
});

// ---- the registry: every string on the page, by id ----
const REG = {};
const reg = (id, text, flag, src) => {
  if (REG[id] && REG[id].text !== text) throw new Error('two texts for ' + id);
  REG[id] = { text, flag, ...(src ? { src } : {}) };
  return id;
};
const VOICE = { draft: 'it', sourced: 'up' };
const el = (id, text, flag, tag = 'span', cls = '', attrs = '') => {
  const c = [VOICE[flag] || '', cls].filter(Boolean).join(' ');
  return `<${tag} data-copy="84.${id}"${c ? ` class="${c}"` : ''}${attrs}>${esc(text)}</${tag}>`;
};
const w = (k, tag, cls, attrs) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); reg(k, x.text, x.flag, x.src); return el(k, x.text, x.flag, tag, cls, attrs); };
const GUIDE_SRC = 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)';
const d = (k, tag, cls, attrs) => { if (!(k in DATA)) throw new Error('no data ' + k); reg('data.' + k, DATA[k], 'sourced', GUIDE_SRC); return el('data.' + k, DATA[k], 'sourced', tag, cls, attrs); };
const g = (id, text, flag, tag, cls, attrs, src) => { reg(id, text, flag, src); return el(id, text, flag, tag, cls, attrs); };
const quote = (k, cite = 'x.cite.board', cls = '') => `<blockquote class="club${cls ? ' ' + cls : ''}"><p>${w(k)}</p><footer>${w(cite)}</footer></blockquote>`;
const ours = () => w('x.ours', 'span', 'ours');
const sec = (o, n, cls, body, label) => `<section class="s ${cls}" data-s="${n}" aria-label="${esc(label || '§' + n)}"><span class="sn" aria-hidden="true">§${n}</span>${body}</section>`;

// ---- drawn pieces (SVG) ----
const MCOL = ['#b0613a', '#2f6a57', '#7a4f86', '#bf912a', '#3f66a0', '#a3403c'];
const PCOL = { coffeeshop: '#9c6a43', bar: '#7b2f45', home: '#5d8b73', club: '#2f5a8a', other: '#cfcfcb' };
const person = (col, cls = 'who') => `<svg class="${cls}" viewBox="0 0 24 40" aria-hidden="true"><circle cx="12" cy="7" r="6" fill="${col}"/><path d="M2 40 V24 a10 10 0 0 1 20 0 V40 Z" fill="${col}"/></svg>`;
const marks = (cls = 'marks') => `<svg class="${cls}" viewBox="0 0 64 28" aria-hidden="true"><path d="M4 20 C8 4, 18 4, 16 16 S8 26, 22 18" /><path d="M36 22 L42 6 L48 20 L54 8 L60 18" /></svg>`;
const ICON = {
  kettle: `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M14 50 h32 l-4 -22 h-24 z" /><path d="M42 34 c8 -2 10 6 4 10" /><path d="M24 28 v-4 h12 v4" /><path class="steam" d="M22 18 c-4 -4 4 -6 0 -10 M30 16 c-4 -4 4 -6 0 -10 M38 18 c-4 -4 4 -6 0 -10" /></svg>`,
  sag: `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M6 18 C 20 18, 24 48, 30 48 S 40 18, 54 18" /><circle cx="30" cy="48" r="2.5" class="fill"/></svg>`,
  coats: `<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="14" y="6" width="32" height="50" /><path d="M20 14 h20" /><path d="M22 14 l-5 24 h12 l-3 -24" class="fill" /><path d="M36 14 l-4 20 h10 l-2 -20" class="fill" /><circle cx="42" cy="34" r="1.6" class="fill"/></svg>`,
  glass: `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M14 12 h32 l-16 20 z" /><path d="M30 32 v16 M20 50 h20" /><path d="M38 8 l-6 10" /></svg>`,
  cal: `<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="8" y="12" width="44" height="40" /><path d="M8 22 h44 M18 8 v8 M42 8 v8" /><path d="M14 30 h12 M30 30 h16 M14 38 h20 M38 38 h8 M14 46 h10 M28 46 h18" class="scrib" /></svg>`,
  room: `<svg viewBox="0 0 60 60" aria-hidden="true"><path class="glow" d="M30 14 L10 56 H50 Z" /><path d="M6 56 H54" /><path d="M30 4 v8" /><path d="M24 12 h12 l-2 4 h-8 z" class="fill" /></svg>`,
  lamp: `<svg viewBox="0 0 60 60" aria-hidden="true"><path class="glow" d="M30 22 L8 58 H52 Z" /><path d="M20 22 h20 l-5 -12 h-10 z" class="fill"/><path d="M30 22 v26 M22 50 h16" /></svg>`,
};
const NIGHT_ICON_B = { mon: 'kettle', wed: 'sag', thu: 'coats', fri: 'cal', sat: 'cal', sun: 'cal', tue: 'room' };
const NIGHT_ICON_C = { mon: 'kettle', wed: 'sag', thu: 'glass', fri: 'cal', sat: 'cal', sun: 'cal', tue: 'lamp' };
const NIGHT_TAG = { mon: 'x.n.mon', wed: 'x.n.wed', thu: 'x.n.thu', fri: 'x.n.planned', sat: 'x.n.planned', sun: 'x.n.planned', tue: 'x.n.tue' };

// the tag: the same small chip, bottom right, on every case study (team · time · price range)
const tag = (o, team) => `<div class="tag" data-tag aria-label="the project">${w('x.tag.k', 'small')}<span class="tag-row">${w('x.tag.ewc', 'b')}<i>·</i>${w('x.tag.kind')}<i>·</i>${team}<i>·</i>${w(o + '.tag.time', 'span', 'slot')}<i>·</i>${w('x.tag.price')}</span></div>`;

// thumbnails of the work, opened full size in place
const THUMBS = [['voice.png', 'the brand guide, Voice & tone'], ['values.jpg', 'the values board, session 4'], ['kit.png', 'the sales kit, routing'], ['site.png', 'eastwestclub.com, home']];
const thumbs = (o, keys, cls = '') => `<ul class="thumbs ${cls}">${THUMBS.map(([f, alt], i) => `<li><button type="button" class="thumb" data-full="img/${f}"><img src="img/${f}" alt="${esc(alt)}" loading="lazy"></button>${w(keys[i], 'span', 'tl')}</li>`).join('')}</ul>`;

// Study 50's six Tuesdays, held (46 · 2's grid; with EWC one sentence to a paragraph; 49's T-a cards)
const flip = () => `<div class="flip" role="group"><button type="button" aria-pressed="true" data-with="0">${w('t.without')}</button><button type="button" aria-pressed="false" data-with="1">${w('t.with')}</button></div>`;
const six = (o, opts = {}) => `<div class="body">${opts.head || ''}<p class="lead">${w('g.h')}</p><div class="bar">${flip()}<p class="hint">${w('h.hint')} <button type="button" class="all" aria-pressed="false">${w('h.all')}</button></p></div><div class="six">`
  + personas.map((p, i) => `<div class="col" data-m="${MEMBERS[i]}" tabindex="0" aria-describedby="hov-${o}-${MEMBERS[i]}">${d(`p${i}.name`, 'h3')}<div class="hov" id="hov-${o}-${MEMBERS[i]}" role="tooltip">${d(`p${i}.life`, 'p', 'opt', ` data-opt="${MEMBERS[i]}-a"`)}</div>`
    + `<ul class="without">${p.wants.map((x, k) => { const pl = placeOf(x.today); return `<li class="${pl !== 'other' ? 'hit ' + pl : ''}">${d(`p${i}.w${k}.today`)}</li>`; }).join('')}</ul>`
    + `<div class="with" hidden>${sentences(p.give).map((_, n) => d(`p${i}.give.s${n}`, 'p')).join('')}</div></div>`).join('') + `</div>${opts.foot || ''}</div>`;

// the places, as one proportional bar (coffeeshop 4 · bar 3 · home 4 · country club 2) with EWC an empty dashed end
const placesBar = (cls = '') => `<div class="pbar ${cls}">${PLACE.map(([k]) => `<span class="pseg" style="--n:${uses(k)};--c:${PCOL[k]}">${w('x.pl.' + k, 'b')}<i>${uses(k)}</i></span>`).join('')}<span class="pseg ewc" style="--n:2">${w('x.pl.ewc', 'b')}</span></div>`;

// the night picker: seven nights, tap one; the reveal fills each night's job; data-echo elsewhere reads the pick
const nights = (o, mode) => `<ol class="nights ${mode}" data-pick="${o}">${DAYS.map(k => {
  const icon = mode === 'icons-b' ? ICON[NIGHT_ICON_B[k]] : mode === 'icons-c' ? ICON[NIGHT_ICON_C[k]] : '';
  const inner = k === 'tue' && mode === 'quote' ? `<span class="tue-q">${quote('x.f.a5')}</span>` : `<span class="job">${icon}${k === 'tue' && mode !== 'quote' ? '' : w(NIGHT_TAG[k], 'span', 'jt')}</span>`;
  return `<li data-day="${k}" class="${k === 'tue' ? 'tue' : ''}"><button type="button" class="nb" aria-label="${k}">${w('x.d.' + k, 'b')}</button>${inner}<span class="tick" aria-hidden="true"></span></li>`;
}).join('')}</ol>`;

// a row of dominoes (labels under), falling on scroll
const dominoes = (keys, cls = '') => `<ol class="doms ${cls}">${keys.map((k, i) => `<li style="--i:${i}"><span class="dom"></span>${k.startsWith('<') ? k : w(k, 'span', 'dl')}</li>`).join('')}</ol>`;

// the pace: seats filling, past a dashed 'expected'
const seats = (n, filled, cls = '') => `<div class="seats ${cls}" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<i class="${i < filled ? 'on' : ''}" style="--i:${i}"></i>`).join('')}</div>`;
const track = () => `<div class="track"><span class="prog"></span><span class="hit88">${w('x.88', 'b')}</span><span class="exp">${w('x.expected')}</span></div>`;

const door = () => `<svg class="door" viewBox="0 0 640 380" aria-hidden="true">
  <defs><linearGradient id="spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cf7a" stop-opacity=".95"/><stop offset="1" stop-color="#f6cf7a" stop-opacity="0"/></linearGradient>
  <radialGradient id="inside" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#ffe3a3"/><stop offset="1" stop-color="#e9a23b"/></radialGradient></defs>
  <rect x="0" y="0" width="640" height="300" fill="#1b2a26"/><rect x="0" y="300" width="640" height="80" fill="#26332f"/>
  <path d="M250 300 L390 300 L560 380 L120 380 Z" fill="url(#spill)"/>
  <rect x="250" y="70" width="140" height="230" fill="url(#inside)"/>
  <path d="M250 70 L318 86 L318 292 L250 300 Z" fill="#3b2a1f" stroke="#120d09" stroke-width="2"/>
  <circle cx="306" cy="190" r="4" fill="#d6b067"/>
  <rect x="240" y="60" width="160" height="240" fill="none" stroke="#0e1513" stroke-width="10"/>
  <rect x="236" y="298" width="168" height="10" fill="#3a4743"/>
  <g class="ghost"><path d="M70 300 V230 M150 300 V230 M70 238 C 95 262, 125 262, 150 238"/><circle cx="70" cy="226" r="6"/><circle cx="150" cy="226" r="6"/><path class="strike" d="M54 290 L166 220"/></g>
  <g class="ghost"><circle cx="520" cy="120" r="34"/><path d="M520 120 V98 M520 120 L536 128"/><path class="strike" d="M480 160 L560 80"/></g>
  <g class="ghost"><rect x="430" y="196" width="96" height="34" rx="3"/><path d="M444 213 h68"/><path class="strike" d="M424 238 L532 190"/></g>
</svg>`;

const table = (o, chairs, extra = '') => `<div class="table t-${o}"><div class="top">${extra}</div><div class="chairs">${chairs}</div></div>`;
const chair = (cls = '', inner = '') => `<div class="chair ${cls}"><svg viewBox="0 0 60 70" aria-hidden="true"><path d="M18 6 L16 42" /><rect x="12" y="40" width="40" height="6" rx="2" class="seat" /><path d="M16 46 V68 M48 46 V68" /></svg>${inner}</div>`;
const stickies = (ids) => `<div class="stickies">${ids.map((k, i) => `<div class="sticky" style="--r:${[-3, 2, -1.5, 3, -2.5, 1][i % 6]}deg">${w(k, 'p')}</div>`).join('')}</div>`;

// ---- the bet, against this page ----
function betStrip(c) {
  const where = {};
  c.sections.forEach(s => s.answers.forEach(q => (where[q] ||= []).push('§' + s.n)));
  const total = c.scores.reduce((a, b) => a + b, 0);
  if (total !== c.total) throw new Error(c.v + ': scores sum to ' + total + ', total says ' + c.total);
  const rows = BET.beliefs.map((b, bi) => `<div class="belief">${g(`bet.say.b${bi + 1}`, b.say, 'bet', 'h4', '', '', 'studies/sitemap/bet.json')}<ul>` + ['f', 'e', 'i'].map(k => {
    const q = `b${bi + 1}.${k}`, s = c.scores[QIDS.indexOf(q)];
    return `<li class="q" data-q="${q}" data-score="${s}"><span class="sc" aria-label="${s} of 2"><i class="${s > 0 ? 'on' : ''}"></i><i class="${s > 1 ? 'on' : ''}"></i></span>${g(`bet.q.${q}`, b[k][0], 'bet', 'span', 'qt', '', 'studies/sitemap/bet.json')}${g(`bet.${c.v}.where.${q}`, (where[q] || ['none']).join(' '), 'label', 'span', 'wh')}</li>`;
  }).join('') + '</ul></div>').join('');
  return `<aside class="bet" aria-label="the bet, against this page"><div class="bet-h">${w('bet.k', 'b')}${g(`bet.${c.v}.name`, c.name, 'label', 'span', 'bn')}<span class="bt"><b>${total}</b> ${w('bet.of')}</span>${w('bet.judge', 'small')}</div><div class="beliefs">${rows}</div></aside>`;
}

// =================== a · Sotto Voce ===================
function optA() {
  const o = 'a';
  const lump = `<div class="lump" data-anim>${personas.map((p, i) => p.wants.map((x, k) => `<i style="--c:${PCOL[placeOf(x.today)]};--d:${i * 4 + k}"></i>`).join('')).join('')}</div>`
    + `<p class="legend">${PLACE.map(([k]) => `<span style="--c:${PCOL[k]}">${w('x.pl.' + k)}</span>`).join('')}<span style="--c:${PCOL.other}">${w('x.pl.other')}</span></p>`;
  return [
    sec(o, 0, 'a0 hero', `<ol class="strip" aria-hidden="true">${DAYS.map(k => `<li class="${k === 'tue' ? 'open' : ''}">${w('x.d.' + k, 'b')}</li>`).join('')}</ol><span class="spine" aria-hidden="true"></span>`
      + `<div class="pair">${quote('x.t.ask')}${w('a.s0.it', 'p', 'aside')}</div>${tag(o, `<span class="team">${marks()}</span>`)}`),
    sec(o, 1, 'a1', `${lump}${w('a.s1.it', 'p', 'aside')}`),
    sec(o, 2, 'a2', `${w('a.s2.ask', 'p', 'prompt')}${nights(o, 'quote')}<div class="credit"><svg class="arrow" viewBox="0 0 120 60" aria-hidden="true"><path d="M110 50 C 80 50, 40 40, 14 12" /><path d="M14 12 l2 12 M14 12 l12 2" /></svg>${w('a.s2.it', 'p', 'aside')}</div>`),
    sec(o, 3, 'a3', `${placesBar()}${w('a.s3.it', 'p', 'aside')}${six(o, { head: `<h2 class="ask">${w('x.t.ask', 'span', 'q-ask')}</h2>` })}`),
    sec(o, 4, 'a4', `${dominoes(['a.s4.d1', 'a.s4.d2', 'a.s4.d3', 'a.s4.d4'], 'fall')}${w('a.s4.it', 'p', 'aside')}`),
    sec(o, 5, 'a5', `<figure class="doorway">${door()}<figcaption>${quote('x.v.l4', 'x.cite.guide', 'step')}</figcaption></figure>${w('a.s5.it', 'p', 'aside')}`),
    sec(o, 6, 'a6', `<div class="pace">${seats(50, 44)}${track()}${w('a.s6.fact', 'p', 'fact')}</div>`
      + `<figure class="live"><button type="button" class="thumb" data-full="img/site.png"><img src="img/site.png" alt="eastwestclub.com, home" loading="lazy"></button><figcaption>${w('a.s6.cap')}</figcaption></figure>`
      + thumbs(o, ['a.s6.t1', 'a.s6.t2', 'a.s6.t3', 'a.s6.t4']) + w('a.s6.it', 'p', 'aside')),
    sec(o, 7, 'a7', `<div class="board">${stickies(['x.f.a1', 'x.f.a3', 'x.f.a4', 'x.f.a2', 'x.f.a6'])}${marks('marks m1')}${marks('marks m2')}</div>${w('a.s7.it', 'p', 'aside')}`),
    sec(o, 8, 'a8', `<div class="close-row"><div class="echo" data-echo="a">${w('a.s8.you', 'small')}<b class="echo-day"></b><span class="echo-tag"></span>${w('a.s8.none', 'small', 'echo-none')}</div>`
      + `<label class="blank">${w('x.d.tue', 'b')}<input type="text" maxlength="80" aria-label="your Tuesday">${w('a.s8.field', 'small')}</label></div>${w('a.s8.it', 'p', 'aside')}`
      + `<div class="ways"><button type="button">${w('a.s8.b1')}</button><button type="button">${w('a.s8.b2')}</button><span class="mail"><input type="email" aria-label="email"><button type="button">${w('a.s8.b3')}</button>${marks()}${w('a.s8.two', 'small')}</span></div>${tag(o, `<span class="team">${marks()}</span>`)}`),
  ].join('\n');
}

// =================== b · Your Move ===================
function optB() {
  const o = 'b';
  const block = `<div class="block" data-anim data-tap><div class="face">${w('x.p0.give', 'p', 'club-face')}</div>${personas.map((_, i) => `<span class="piece" style="--i:${i};--c:${MCOL[i]}"></span>`).join('')}<div class="cast">${personas.map((_, i) => person(MCOL[i])).join('')}</div></div>`;
  const doors = PLACE.map(([k]) => `<button type="button" class="doorb" style="--n:${uses(k)};--c:${PCOL[k]}"><span class="frame"></span>${w('x.pl.' + k, 'b')}<span class="wants">${personas.flatMap((p, i) => p.wants.map((x, j) => placeOf(x.today) === k ? d(`p${i}.w${j}.want`, 'span', 'wt') : '')).join('')}</span></button>`).join('')
    + `<div class="doorb ewc" style="--n:3"><span class="frame"></span>${w('x.pl.ewc', 'b')}${quote('x.v.l4', 'x.cite.guide')}</div>`;
  const chartLine = `<svg class="chart" viewBox="0 0 400 220" aria-hidden="true"><path class="ax" d="M30 200 H390 M30 200 V10"/><path class="exp" d="M30 200 C 150 190, 300 120, 390 30"/><path class="sig" d="M30 200 C 90 170, 170 70, 250 36"/><circle cx="250" cy="36" r="6"/></svg>`;
  return [
    sec(o, 1, 'b1 hero', `<div class="margin-wrap"><div class="tedge">${w('b.k.us', 'small', 'k-us')}${w('b.s1.it', 'p', 'aside')}</div><div>${w('b.k.club', 'small', 'k-club')}${block}<button type="button" class="crack">${w('b.s1.crack')}</button></div></div>${tag(o, w('b.tag.team'))}`),
    sec(o, 2, 'b2', `${w('b.s2.ask', 'p', 'prompt')}${nights(o, 'icons-b')}<div class="under-tue">${w('b.s2.it', 'p', 'aside')}${quote('x.f.a5')}${ours()}</div>`),
    sec(o, 3, 'b3', `${w('b.s3.ask', 'p', 'prompt')}<div class="choose" data-choose><button type="button">${w('b.s3.c1')}</button><button type="button">${w('b.s3.c2')}</button></div><div class="doors">${doors}</div>${w('b.s3.tap', 'small', 'tap')}${w('b.s3.it', 'p', 'aside')}`),
    sec(o, 4, 'b4', `${six(o, { head: `<h2 class="ask">${w('x.t.ask', 'span', 'q-ask')}</h2>` })}${thumbs(o, ['b.s4.t1', 'b.s4.t2', 'b.s4.t3', 'b.s4.t4'])}`),
    sec(o, 5, 'b5', `${w('b.s5.ask', 'p', 'prompt')}<div class="runs" data-runs><div class="rsw"><button type="button" data-run="1">${w('b.s5.r1')}</button><button type="button" data-run="2">${w('b.s5.r2')}</button></div>`
      + `<div class="run r1"><ol class="doms grey">${['', 'tray', 'crane', ''].map((k, i) => `<li style="--i:${i}"><span class="dom">${i === 0 ? person('#9a9a95') : ''}${k === 'tray' ? '<i class="mtray"></i>' : ''}${k === 'crane' ? '<i class="crane down"></i>' : ''}</span></li>`).join('')}</ol>${w('b.s5.chain', 'p', 'aside')}<button type="button" class="try" data-run="2">${w('b.s5.try')}</button></div>`
      + `<div class="run r2"><ol class="doms warm"><li style="--i:0"><span class="dom card">${w('x.p2.give', 'span', 'cardq')}</span></li><li style="--i:1"><span class="dom"><i class="mtray full"></i></span></li><li style="--i:2"><span class="dom"><i class="crane"></i></span></li><li style="--i:3"><span class="dom card">${w('x.p5.give', 'span', 'cardq')}</span></li><li style="--i:4" class="doorend"><span class="dom"></span></li></ol>`
      + `<div class="warmroom">${personas.map((_, i) => person(MCOL[i])).join('')}</div>${w('b.s5.it', 'p', 'aside')}${quote('x.v.l2', 'x.cite.guide')}</div></div>`),
    sec(o, 6, 'b6', `<div class="two"><figure class="pacechart">${chartLine}<span class="l-exp">${w('x.expected')}</span><span class="l-sig">${w('b.s6.signed')}</span><b class="big88">${w('x.88')}</b>${w('b.s6.note', 'small', 'note')}</figure>`
      + `<figure class="live"><button type="button" class="thumb" data-full="img/site.png"><img src="img/site.png" alt="eastwestclub.com, home" loading="lazy"></button>${w('b.s6.stamp', 'span', 'stamp')}${quote('x.v.l3', 'x.cite.guide')}</figure></div>`
      + `${w('b.s6.fact', 'p', 'fact')}${w('b.s6.it1', 'p', 'aside')}${w('b.s6.it2', 'p', 'aside')}`),
    sec(o, 7, 'b7', table(o, chair('two', marks()) + chair('two', marks()) + chair('third', `${w('b.s7.yours', 'small')}`),
      `<ul class="notes">${['b.s1.it', 'b.s2.it', 'b.s3.it', 'b.s5.it', 'b.s6.it2'].map(k => `<li>${w(k, 'span')}</li>`).join('')}<li class="mine" data-mine></li></ul>`)
      + `<div class="ask-row"><span class="qtile">?</span><label class="type">${w('b.s7.ask', 'span', 'prompt')}<input type="text" maxlength="80" data-into="b" aria-label="your Tuesday"></label></div>${w('b.s7.it', 'p', 'aside')}`
      + `<div class="ways"><button type="button">${w('b.s7.d1')}</button><button type="button">${w('b.s7.d2')}</button><button type="button">${w('b.s7.d3')}</button></div>${tag(o, w('b.tag.team'))}`),
  ].join('\n');
}

// =================== c · Two Tuesdays ===================
function optC() {
  const o = 'c';
  const cols = [...PLACE.map(([k]) => k), 'other'];
  const after = `<div class="after"><div class="pcols">${cols.map(k => `<div class="pcol" style="--c:${PCOL[k]}">${w('x.pl.' + k, 'b')}<div class="tiles">${personas.flatMap((p, i) => p.wants.map((x, j) => placeOf(x.today) === k ? `<i style="--m:${MCOL[i]}"></i>` : '')).join('')}</div></div>`).join('')}</div></div>`;
  return [
    sec(o, 1, 'c1 hero', `<div class="key">${w('c.key.us', 'span', 'it')}${w('c.key.them', 'span', 'up')}</div>${w('c.s1.h', 'h1', 'head-it')}`
      + `<div class="hinge" data-hinge style="--h:30%">${after}<div class="before"><div class="slab">${w('c.s1.slab', 'span')}</div></div><span class="hl">${w('c.s1.before', 'small')}</span><span class="hr">${w('c.s1.after', 'small')}</span><span class="hbar" aria-hidden="true"></span><input type="range" min="8" max="80" value="30" aria-label="the hinge">${w('c.s1.drag', 'small', 'drag')}</div>`
      + `<div class="tray">${w('c.s1.tray', 'span', 'it tray-k')}${thumbs(o, ['c.s1.t1', 'c.s1.t2', 'c.s1.t3', 'c.s1.t4'], 'small')}</div>${w('c.s1.note', 'p', 'aside')}`),
    sec(o, 2, 'c2', `${w('c.s2.ask', 'p', 'prompt')}${nights(o, 'icons-c')}<div class="under-tue">${w('c.s2.it', 'p', 'aside')}${ours()}${w('c.s2.saw', 'p', 'aside saw')}${quote('x.f.a5')}</div>`),
    sec(o, 3, 'c3', six(o, { head: `<h2 class="ask big">${w('x.t.ask', 'span', 'q-ask')}</h2><p class="pencil">${w('c.s3.it', 'span')}</p>` })),
    sec(o, 4, 'c4', `<div class="rows">${dominoes(['c.s4.b1', 'c.s4.b2', 'c.s4.b3', 'c.s4.b4'], 'grey fallen')}`
      + `<div class="afterrow" data-domrow><ol class="doms fwd"><li class="first" data-drop><span class="dom blank"></span>${w('c.s4.drop', 'span', 'dl')}</li>${['c.s4.f2', 'c.s4.f3', 'c.s4.f4'].map((k, i) => `<li style="--i:${i + 1}"><span class="dom"></span>${w(k, 'span', 'dl')}</li>`).join('')}<li class="doorend"><span class="dom"></span></li></ol>`
      + `<div class="chips"><button type="button" class="chip" draggable="true" data-chip="grey">${person('#9a9a95')}${w('c.s4.chip1')}</button><button type="button" class="chip" draggable="true" data-chip="member">${person(MCOL[1])}${w('c.s4.chip2')}</button></div><span class="f1">${w('c.s4.f1', 'span', 'dl')}</span></div></div>`
      + `<p class="line">${w('c.s4.it', 'span', 'it')} ${ours()}</p>`),
    sec(o, 5, 'c5', `<div class="two"><div class="pace">${w('c.s5.tag', 'small', 'rep')}${seats(100, 88, 'round')}<div class="drop">${personas.map((_, i) => person(MCOL[i])).join('')}</div>${track()}${w('c.s5.fact', 'p', 'fact')}</div>`
      + `<figure class="live ringed"><div class="shot"><button type="button" class="thumb" data-full="img/site.png"><img src="img/site.png" alt="eastwestclub.com, home" loading="lazy"></button><span class="ring" aria-hidden="true"></span>${w('c.s5.stamp', 'span', 'stamp')}</div><figcaption>${w('c.s5.cap')}</figcaption>${quote('x.site.l1', 'x.cite.site')}</figure></div>`),
    sec(o, 6, 'c6', table(o, chair('two', person(MCOL[4], 'fig')) + chair('two', person(MCOL[1], 'fig')),
      `<div class="cards">${['x.f.a1', 'x.f.a2', 'x.f.a3', 'x.f.a4', 'x.f.a5', 'x.f.a6'].map(k => `<div class="icard">${w(k, 'p')}</div>`).join('')}</div><span class="paper">${w('c.s6.it', 'span')}</span>`)),
    sec(o, 7, 'c7', `${w('c.s7.ask', 'p', 'prompt')}<ol class="strip empty" data-reply>${DAYS.map(k => `<li><button type="button">${w('x.d.' + k, 'b')}</button></li>`).join('')}</ol>`
      + `<label class="reply" hidden><input type="text" maxlength="80" class="it-input" aria-label="your night">${w('c.s7.field', 'small')}</label>`
      + `<div class="ways"><button type="button">${w('c.s7.d1')}</button><button type="button">${w('c.s7.d2')}</button><button type="button">${w('c.s7.d3')}</button></div>`
      + tag(o, `<span class="glyphs"><svg viewBox="0 0 30 16" aria-hidden="true"><circle cx="8" cy="5" r="3.5"/><circle cx="22" cy="5" r="3.5"/><path d="M2 16 a6 6 0 0 1 12 0 M16 16 a6 6 0 0 1 12 0"/></svg>${w('c.tag.team')}</span>`)),
  ].join('\n');
}

// =================== d · Tuesday to Tuesday ===================
function optD() {
  const o = 'd';
  const order = [['tue', null], ['wed', 'x.n.wed'], ['thu', 'x.n.thu'], ['wknd', 'x.n.wknd'], ['mon', 'x.n.mon']];
  const strip = (cls) => `<ol class="tstrip ${cls}">${order.map(([k, t]) => `<li class="${k}">${k === 'wknd' ? `<b>${w('x.d.fri', 'span')}–${w('x.d.sun', 'span')}</b>` : w('x.d.' + k, 'b')}${t ? w(t, 'span', 'jt') : ''}</li>`).join('')}</ol>`;
  return [
    sec(o, 0, 'd0 hero', `${w('d.s0.h', 'h1', 'head-it')}${strip('top')}<p class="key">${w('d.key.it', 'span', 'it')}${w('d.key.up', 'span', 'up')}</p>`),
    sec(o, 1, 'd1', `${w('d.s1.ask', 'p', 'prompt')}${nights(o, 'strike')}${w('d.s1.not', 'p', 'aside')}`
      + `<div class="clubblock" data-anim>${w('d.s1.club', 'b')}${personas.map((_, i) => `<span style="--i:${i}"></span>`).join('')}</div>`
      + six(o, { head: `<h2 class="ask">${w('x.t.ask', 'span', 'q-ask')}</h2>${w('d.s1.it', 'p', 'aside')}`, foot: placesBar('ribbon') })),
    sec(o, 2, 'd2', `<div class="stand" data-anim>${dominoes(['d.s2.d1', 'd.s2.d2', 'd.s2.d3', 'd.s2.d4'], 'back')}<svg class="hand" viewBox="0 0 80 60" aria-hidden="true"><path d="M4 40 C 20 36, 30 30, 44 30 L70 26 M44 30 L66 34 M44 30 L64 42 M40 36 L58 48"/></svg>`
      + `<span class="handl">${w('d.s2.hand', 'span', 'dl')}</span>${dominoes([w('d.s2.hand', 'span', 'dl'), 'd.s2.f2', 'd.s2.f3', 'd.s2.f4'], 'fwd')}</div>`
      + `<p class="line">${w('d.s2.it', 'span', 'it')} ${ours()}</p>${quote('x.v.l4', 'x.cite.guide')}`),
    sec(o, 3, 'd3', `<div class="street">${PLACE.map(([k]) => `<div class="place" style="--n:${uses(k)}">${w('x.pl.' + k, 'b')}<span class="dots">${'<i></i>'.repeat(uses(k))}</span></div>`).join('')}`
      + `<div class="place ewc" style="--n:4">${w('x.pl.ewc', 'b')}${quote('x.f.a5')}</div></div><div class="readback"><svg class="arrow" viewBox="0 0 120 40" aria-hidden="true"><path d="M6 8 C 40 36, 80 36, 112 20"/><path d="M112 20 l-12 -2 M112 20 l-6 10"/></svg>${w('d.s3.it', 'p', 'aside')}</div>`),
    sec(o, 4, 'd4', `<div class="above">${stickies(['x.f.a1', 'x.f.a2', 'x.f.a3', 'x.f.a4', 'x.f.a5', 'x.f.a6'])}<div class="ink">${marks()}${marks()}</div></div>${w('d.s4.it', 'p', 'aside big')}${w('d.s4.small', 'p', 'aside')}`),
    sec(o, 5, 'd5', `<div class="pace">${seats(40, 35, 'line')}<span class="expline" aria-hidden="true"></span>${w('x.expected', 'small', 'expk')}${w('d.s5.fact', 'p', 'fact')}</div>`
      + `<button type="button" class="flipup">${w('d.s5.flip')}</button>${thumbs(o, ['d.s5.t1', 'd.s5.t2', 'd.s5.t3', 'd.s5.t4'])}`
      + `<figure class="live big"><div class="scroller"><img src="img/site.png" alt="eastwestclub.com, home" loading="lazy"></div><span class="stamp">${w('d.s5.open', 'b', 'up')}${w('d.s5.after', 'small')}</span></figure>${w('d.s5.it', 'p', 'aside')}`),
    sec(o, 6, 'd6', `${strip('again')}<span class="echo-mark" data-echo="d"></span>${w('d.s6.ask', 'p', 'prompt')}`
      + `<div class="yours">${w('d.s6.yours', 'small')}<ol class="strip empty" data-reply>${DAYS.map(k => `<li><button type="button">${w('x.d.' + k, 'b')}</button></li>`).join('')}</ol>`
      + `<div class="card3" hidden><button type="button">${w('d.s6.c1')}</button><button type="button">${w('d.s6.c2')}</button><span class="mail"><input type="email" aria-label="email"><button type="button">${w('d.s6.c3')}</button></span></div></div>${tag(o, w('d.tag.team'))}`),
  ].join('\n');
}

function build() {
  for (const k of Object.keys(REG)) delete REG[k];
  const BUILD = { a: optA, b: optB, c: optC, d: optD };
  const pageOf = {};
  const cases = CONCEPTS.map(c => {
    const before = new Set(Object.keys(REG));
    const html = `<div class="case" data-opt="${c.v}" aria-label="${esc(c.name)}">\n${BUILD[c.v]()}\n${betStrip(c)}\n</div>`;
    for (const m of html.matchAll(/data-copy="84\.([^"]+)"/g)) (pageOf[m[1]] ||= new Set()).add(c.v);
    return html;
  }).join('\n');
  // chrome (nav, next, footer) and the page
  const shell = read('shell.html');
  let html = shell.replace('{{TITLE}}', PAGE.title).replace('<!--CASES-->', () => cases).replace('<!--STYLE-->', () => read('page.css'));
  html = html.replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k)).replace('<!--SCRIPT-->', () => read('page.js'));
  for (const m of html.matchAll(/data-copy="84\.([^"]+)"/g)) if (!pageOf[m[1]]) pageOf[m[1]] = new Set(['chrome']);
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error('unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  fs.writeFileSync(path.join(here, PAGE.file), html);
  const copy = {};
  for (const [k, e] of Object.entries(REG)) copy['84.' + k] = { ...e, slot: k, pages: [...(pageOf[k] || [])].sort() };
  const out = { about: 'Every human-readable string on Study 84\'s page, by data-copy id. Written by build.cjs from words.json (ours and the club\'s), personas.json (the brand guide), ../../sitemap/bet.json (the bet\'s questions) and concepts.json (where each is answered). pages = the options it shows on (a, b, c, d) or chrome. flag: draft = ours, set italic; label = ours, wayfinding; sourced = the club\'s words verbatim, set upright, see src; bet = the bet\'s question; chrome = round 4\'s nav, footer, next.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(PAGE.file + ', copy.json ' + Object.keys(copy).length + ' strings');
}
if (require.main === module) build();
module.exports = { PAGE, DATA, WORDS, PLACE, MEMBERS, OPTIONS, CONCEPTS, QIDS, DAYS, BET, sentences, life, placeOf, uses, build };
