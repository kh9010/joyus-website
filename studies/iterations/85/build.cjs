// Study 85: the EWC case study about ONE part of the work, the value broken down (who it's for, what they
// come for, what they'd do otherwise, with what). Four finished pages on one, behind ?v=a|b|c|d (a = the
// judge's top scorer): the top four of five concepts after three judged rounds against Kahran's 21 bet
// answers (6 Nov), after he said of 84 "it feels like it's losing the insight because it's so focused on
// [the Tuesday]". The Tuesday is one piece of evidence, one section at most, never the frame.
//   a  Untangle        a knot of chips the reader sorts (or watches sort), then ours, then theirs beside ours
//   b  Exploded View   one block taken apart in four cuts (who · for what · instead of · with what)
//   c  Taken Apart     an undivided bar, marked up and cut like an editor's page; the wiring diagram is the hero
//   d  Prism           a pooled slab passed through a prism into six beams, one per member
// Under each page, the bet against it: all 21 questions, the judge's final score, the section answering it.
// Words: words.json (ours, the club's verbatim) + personas.json (the brand guide) + ../../sitemap/bet.json.
// Every string sits in a data-copy="85.<id>" element; this writes case.html and copy.json.
//   node studies/iterations/85/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const { options: CONCEPTS } = JSON.parse(read('concepts.json'));
const BET = JSON.parse(fs.readFileSync(path.join(here, '../../sitemap/bet.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const PAGE = { file: 'case.html', title: 'the value, broken down, four ways' };
const N = '85';
const OPTIONS = CONCEPTS.map(c => c.v);
const MEMBERS = ['QC', 'CCG', 'SRO', 'NSF', 'EN', 'MCHE'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const QIDS = BET.beliefs.flatMap((b, i) => ['f', 'e', 'i'].map(k => `b${i + 1}.${k}`));
const sentences = (t) => t.split(/(?<=\."?)\s+(?=[A-Z"])/);
// a card: the guide's profile line from its second sentence (the first carries income; public repo)
const life = (p) => p.profile.slice(p.profile.indexOf('. ') + 2);

// the trays: each want filed under ONE place (our count, first match wins), so the 24 wants sum to 24.
// coffeeshop 4 · bar 3 · home 3 · country club 2 · charity events 2 · friends of friends 2 · eight of one each
const TRAY = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/], ['charity', /charity/], ['fof', /friends of friends/]];
const trayOf = (today) => (TRAY.find(([, re]) => re.test(today)) || ['one'])[0];
const count = (k) => personas.reduce((s, p) => s + p.wants.filter(x => trayOf(x.today) === k).length, 0);
const BIG4 = ['coffeeshop', 'bar', 'home', 'club'];

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name; DATA[`p${i}.life`] = life(p); DATA[`p${i}.give`] = p.give;
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
  return `<${tag} data-copy="${N}.${id}"${c ? ` class="${c}"` : ''}${attrs}>${esc(text)}</${tag}>`;
};
const w = (k, tag, cls, attrs) => { const x = WORDS[k]; if (!x) throw new Error('no word ' + k); reg(k, x.text, x.flag, x.src); return el(k, x.text, x.flag, tag, cls, attrs); };
const GUIDE_SRC = 'ewc/src/brand-guide.html, "Audience · what we replace" (personas.json)';
const d = (k, tag, cls, attrs) => { if (!(k in DATA)) throw new Error('no data ' + k); reg('data.' + k, DATA[k], 'sourced', GUIDE_SRC); return el('data.' + k, DATA[k], 'sourced', tag, cls, attrs); };
const g = (id, text, flag, tag, cls, attrs, src) => { reg(id, text, flag, src); return el(id, text, flag, tag, cls, attrs); };
const quote = (k, cite = 'x.cite.board', cls = '') => `<blockquote class="club${cls ? ' ' + cls : ''}"><p>${k.startsWith('<') ? k : w(k)}</p><footer>${w(cite)}</footer></blockquote>`;
const sec = (o, n, cls, body, label) => `<section class="s ${cls}" data-s="${n}" aria-label="${esc(label || '§' + n)}"><span class="sn" aria-hidden="true">§${n}</span>${body}</section>`;

// ---- drawn pieces ----
const MCOL = ['#b0613a', '#2f6a57', '#7a4f86', '#bf912a', '#3f66a0', '#a3403c'];
const PCOL = { coffeeshop: '#9c6a43', bar: '#7b2f45', home: '#5d8b73', club: '#2f5a8a', charity: '#8a7a3a', fof: '#6a6aa0', one: '#b9b6ad' };
const person = (col, cls = 'who') => `<svg class="${cls}" viewBox="0 0 24 40" aria-hidden="true"><circle cx="12" cy="7" r="6" fill="${col}"/><path d="M2 40 V24 a10 10 0 0 1 20 0 V40 Z" fill="${col}"/></svg>`;
const chairs = () => `<svg class="chairs" viewBox="0 0 150 80" aria-hidden="true"><g><path d="M20 8 L18 46"/><rect x="14" y="44" width="40" height="6" rx="2"/><path d="M18 50 V76 M50 50 V76"/></g><g><path d="M130 8 L132 46"/><rect x="96" y="44" width="40" height="6" rx="2"/><path d="M100 50 V76 M132 50 V76"/></g></svg>`;
const door = () => `<svg class="door" viewBox="0 0 640 340" aria-hidden="true">
  <defs><linearGradient id="spill-OPT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cf7a" stop-opacity=".95"/><stop offset="1" stop-color="#f6cf7a" stop-opacity="0"/></linearGradient>
  <radialGradient id="inside-OPT" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#ffe3a3"/><stop offset="1" stop-color="#e9a23b"/></radialGradient></defs>
  <rect x="0" y="0" width="640" height="270" fill="#1b2a26"/><rect x="0" y="270" width="640" height="70" fill="#26332f"/>
  <path d="M250 270 L390 270 L560 340 L120 340 Z" fill="url(#spill-OPT)"/>
  <rect x="250" y="50" width="140" height="220" fill="url(#inside-OPT)"/>
  <path d="M250 50 L300 64 L300 262 L250 270 Z" fill="#3b2a1f" stroke="#120d09" stroke-width="2"/>
  <circle cx="290" cy="164" r="4" fill="#d6b067"/>
  <rect x="240" y="40" width="160" height="230" fill="none" stroke="#0e1513" stroke-width="10"/>
</svg>`;
const doorOf = (o) => door().replace(/OPT/g, o);
const hands = () => `<svg class="hands" viewBox="0 0 220 90" aria-hidden="true">
  <g class="h1"><rect x="0" y="40" width="34" height="34" rx="3" class="cuff1"/><path d="M34 46 C 60 40, 78 44, 92 52 C 96 58, 90 64, 80 62 L 60 60 C 50 72, 40 74, 34 70 Z" class="skin"/></g>
  <g class="h2"><rect x="186" y="18" width="34" height="30" rx="3" class="cuff2"/><path d="M186 26 C 160 20, 142 24, 130 34 C 126 40, 132 46, 142 44 L 160 42 C 170 52, 180 52, 186 48 Z" class="skin"/><path d="M134 36 L 96 74" class="pencil"/><path d="M96 74 L 92 82 L 100 78 Z" class="tip"/></g>
</svg>`;

// the project tag: one format on every case study (team · time · price range); time left to fill
const tag = () => `<div class="tag" data-tag aria-label="the project">${w('x.tag.k', 'small')}<span class="tag-row">${w('x.tag.ewc', 'b')}<i>·</i>${w('x.tag.kind')}<i>·</i>${w('x.tag.team')}<i>·</i>${w('x.tag.time', 'span', 'slot')}<i>·</i>${w('x.tag.price')}</span></div>`;
const more = () => `<a class="more" href="#" data-to="client">${w('x.more')} →</a>`;

// the seats: 100 founding seats fill to 88; the axis under them reaches 88% before the dashed 'expected'
const seats = (o, colors) => `<div class="pace" data-anim><div class="seats">${Array.from({ length: 100 }, (_, i) => `<i class="${i < 88 ? 'on' : ''}" style="--i:${i}${colors ? ';--c:' + colors[i % colors.length] : ''}"></i>`).join('')}</div>`
  + `<div class="track"><span class="prog"></span><span class="hit88">${w('x.88', 'b')}</span><span class="exp">${w('x.expected')}</span></div>${w('x.pace', 'small', 'pace-note')}</div>`;
const front = (cls = '') => `<figure class="front ${cls}"><div class="browser"><span class="url">eastwestclub.com</span><img src="img/front.png" alt="eastwestclub.com, home, as it is today: the club's own line" loading="lazy"></div><figcaption>${w('x.front')}</figcaption></figure>`;
const dominoes = (keys, cls = '', extra = '') => `<ol class="doms ${cls}">${keys.map((k, i) => `<li style="--i:${i}"><span class="dom"></span>${k.startsWith('<') ? k : w(k, 'span', 'dl')}</li>`).join('')}${extra}</ol>`;
const WRONG = ['x.dom.wrong', 'x.dom.money', 'x.dom.build', 'x.dom.next'];
const stickies = (ids) => `<div class="stickies">${ids.map((k, i) => `<div class="sticky" style="--r:${[-3, 2, -1.5, 3, -2.5, 1][i % 6]}deg">${w(k, 'p')}</div>`).join('')}</div>`;
const week = (o, opts = {}) => `<ol class="week ${opts.cls || ''}">${DAYS.map(k => {
  const t = { mon: 'x.n.mon', wed: 'x.n.wed', thu: 'x.n.thu' }[k];
  const wk = ['fri', 'sat', 'sun'].includes(k);
  return `<li class="${k === 'tue' ? 'open' : t ? 'job' : wk ? 'wknd' : ''}" data-day="${k}">${w('x.d.' + k, 'b')}${t ? w(t, 'span', 'jt') : ''}${k === 'tue' && opts.tue ? w(opts.tue, 'span', 'jt') : ''}</li>`;
}).join('')}</ol>`;

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

// =================== a · Untangle ===================
function optA() {
  const o = 'a';
  // the chips: who (the six, as the guide names them), what for (one want each), instead of what (where that want goes today)
  const chips = personas.flatMap((p, i) => [
    `<button type="button" class="chip" data-kind="who" data-m="${i}">${d(`p${i}.name`)}</button>`,
    `<button type="button" class="chip" data-kind="what" data-m="${i}">${d(`p${i}.w0.want`)}</button>`,
    `<button type="button" class="chip" data-kind="instead" data-m="${i}">${d(`p${i}.w0.today`)}</button>`,
  ]);
  // shuffled, fixed order (no random at build: the page and the check see the same knot)
  const order = [4, 10, 15, 1, 8, 13, 17, 3, 6, 11, 0, 14, 7, 2, 16, 9, 5, 12];
  const knot = `<div class="knot" data-knot><svg class="threads" aria-hidden="true"></svg>${order.map((k, j) => chips[k].replace('class="chip"', `class="chip" style="--j:${j}"`)).join('')}</div>`;
  const four = (cls) => `<ul class="four ${cls}">${[1, 2, 3, 4].map(k => `<li class="${k === 2 || k === 3 ? 'lit' : 'ghost'}">${w('a.four.' + k)}</li>`).join('')}</ul>`;
  const trays = `<div class="trays" data-trays>${['who', 'what', 'instead'].map(k => `<div class="tray" data-tray="${k}">${w('a.tray.' + k, 'b')}<div class="in-tray"></div></div>`).join('')}</div>`;
  const grid = `<div class="ourgrid" data-ourgrid>${personas.map((p, i) => `<button type="button" class="row" data-m="${i}"><span class="rn">${person(MCOL[i])}${d(`p${i}.name`, 'b')}</span><span class="rw">${p.wants.map((_, k) => d(`p${i}.w${k}.want`, 'span', 'wc')).join('')}</span><span class="rt">${p.wants.map((x, k) => d(`p${i}.w${k}.today`, 'span', 'tc t-' + trayOf(x.today))).join('')}</span><span class="rg">${d(`p${i}.give.s0`, 'span')}</span></button>`).join('')}</div>`;
  const bars = `<div class="bars"><div class="bars-in">${BIG4.map(k => `<div class="hb" style="--n:${count(k)};--c:${PCOL[k]}">${w('x.pl.' + k, 'b')}<span class="hbar"></span><i>${count(k)}</i></div>`).join('')}</div>${w('x.ourcount', 'small', 'ourcount')}</div>`;
  const mini = `<div class="mini">${personas.map((p, i) => `<div class="mrow"><span>${person(MCOL[i])}</span>${p.wants.map(x => `<i class="tc t-${trayOf(x.today)}"></i>`).join('')}</div>`).join('')}</div>`;
  return [
    sec(o, 0, 'a0 hero', `${w('a.s0.h', 'h1', 'head-it')}${w('a.four.k', 'small', 'fourk')}${four('top')}${more()}${tag()}`),
    sec(o, 1, 'a1', `${knot}<div class="warm">${quote('x.w.ask', 'x.cite.board', 'big')}<div class="sticky tilt"><p>${w('x.w.a1.a')} <span class="ul">${w('x.w.a1.b')}<svg class="ink" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 C 60 2, 120 11, 180 6 S 260 4, 298 8"/></svg></span> ${w('x.w.a1.c')}</p><footer>${w('x.cite.board')}</footer></div><svg class="hair" viewBox="0 0 120 60" aria-hidden="true"><path d="M2 8 C 40 10, 70 30, 118 52"/></svg>${w('a.s1.it', 'p', 'aside note')}</div>`),
    sec(o, 2, 'a2', `<div class="askrow">${w('a.s2.ask', 'p', 'prompt')}<button type="button" class="skip" data-skip>${w('a.s2.skip')}</button><button type="button" class="again" data-again>${w('a.s2.try')}</button></div>${trays}${w('a.s2.hint', 'small', 'hint')}`),
    sec(o, 3, 'a3', `${grid}${w('a.s3.tap', 'small', 'hint')}${bars}${w('a.s3.it', 'p', 'aside')}`),
    sec(o, 4, 'a4', `${w('a.s4.k', 'small', 'kicker')}${week(o, { cls: 'compact' })}<div class="ev">${quote('x.t.ask')}${stickies(['x.f.a1', 'x.f.a4', 'x.f.a5'])}</div><p class="line">${w('a.s4.it', 'span', 'it')} ${w('x.ours', 'span', 'ours')}</p>`
      + `<details class="six50"><summary>${w('a.s4.six')}</summary><iframe title="Study 50, six Tuesdays" data-src="../50/six.html" loading="lazy"></iframe></details>`),
    sec(o, 5, 'a5', `<div class="domplay" data-domplay><div class="wrongchip">${person('#9a9a95')}${w('x.dom.wrong')}</div>${dominoes(['x.dom.money', 'x.dom.build', 'x.dom.next'], 'grey')}`
      + `<div class="rights">${personas.map((_, i) => `<span style="--i:${i}">${person(MCOL[i])}</span>`).join('')}</div>${dominoes(['a.s5.right', 'a.s5.money', 'a.s5.build', 'a.s5.want'], 'warm', `<li class="doorend" style="--i:4">${doorOf(o)}<span class="light" aria-hidden="true"></span></li>`)}</div>`
      + `${w('a.s5.it', 'p', 'aside')}${quote('x.v.l4', 'x.cite.guide')}${w('a.s5.it2', 'p', 'aside')}`),
    sec(o, 6, 'a6', `<div class="two">${seats(o)}${front()}</div>${w('a.s6.fact', 'p', 'fact')}${w('a.s6.it', 'p', 'aside')}`),
    sec(o, 7, 'a7', `${w('a.s7.ask', 'p', 'prompt')}<div class="side"><div class="col-y">${w('a.s7.yours', 'b', 'k')}<div class="yours" data-yours></div>${w('a.s7.skipped', 'small', 'skipped')}</div><div class="col-o">${w('a.s7.ours', 'b', 'k')}${mini}</div></div>`
      + `<div class="reply"><label class="field"><textarea rows="2" maxlength="400" aria-label="how I'd have done it"></textarea>${w('a.s7.field', 'small')}</label><div class="ways"><button type="button">${w('a.s7.b1')}</button><button type="button">${w('a.s7.b2')}</button></div><div class="pair2">${chairs()}${w('a.s7.two', 'p', 'aside')}</div></div>`
      + `${four('foot')}${more()}${tag()}`),
  ].join('\n');
}

// =================== b · Exploded View ===================
function optB() {
  const o = 'b';
  const STOPS = [1, 2, 3, 4];
  const block = `<div class="block" data-block><div class="slices">${STOPS.concat(5).map(k => `<span class="sl" style="--k:${k}"></span>`).join('')}</div><img class="face" src="img/front.png" alt="the club's own line, on its home page" loading="lazy"><span class="tick" hidden></span></div>`;
  const widths = personas.map(p => p.give.length);
  const pieces = `<div class="pieces">${personas.map((p, i) => `<div class="bpiece" tabindex="0" style="--w:${widths[i]};--c:${MCOL[i]}">${person(MCOL[i], 'sil')}${d(`p${i}.name`, 'b')}<div class="card" role="tooltip">${d(`p${i}.life`, 'p')}</div></div>`).join('')}</div>`;
  const OPEN = { 'p3.w0': 1, 'p5.w1': 1, 'p0.w1': 1 };
  let part = 0;
  const tiles = `<div class="parts">${personas.map((p, i) => `<div class="pcol" style="--c:${MCOL[i]}">${p.wants.map((_, k) => { part++; const open = OPEN[`p${i}.w${k}`]; return `<button type="button" class="tile${open ? ' open' : ''}"><span class="pn">${String(part).padStart(2, '0')}</span>${d(`p${i}.w${k}.want`, 'span', 'tw')}</button>`; }).join('')}</div>`).join('')}</div>`;
  const TR = ['coffeeshop', 'bar', 'home', 'club', 'charity', 'fof'];
  const trays = `<div class="trays14">${TR.map(k => `<div class="t14" style="--n:${count(k)};--c:${PCOL[k]}">${w('x.pl.' + k, 'b')}<div class="drops">${personas.flatMap((p, i) => p.wants.map((x, j) => trayOf(x.today) === k ? `<i style="--m:${MCOL[i]}"></i>` : '')).join('')}</div></div>`).join('')}`
    + personas.flatMap((p, i) => p.wants.map((x, j) => trayOf(x.today) === 'one' ? `<button type="button" class="t14 one" style="--n:1"><span class="hid">${d(`p${i}.w${j}.today`)}</span><div class="drops"><i style="--m:${MCOL[i]}"></i></div></button>` : '')).join('') + `</div>`;
  const inset = `<figure class="plate"><span class="callno">1</span>${week(o, { cls: 'mini' })}<svg class="cutline" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="M20 76 C 50 40, 30 10, 60 4"/></svg><div class="sticky solo">${w('x.f.a5', 'p')}</div>${w('b.s3.inset', 'p', 'aside')}${w('x.ours', 'small', 'ours')}</figure>`;
  const faces = `<div class="assembled" data-assembled><div class="ablock">${[1, 2, 3, 4].map(k => `<span class="face${k}">${w('b.face.' + k)}</span>`).join('')}<span class="seams" aria-hidden="true"></span></div>`
    + `<ul class="gives">${personas.map((p, i) => `<li style="--c:${MCOL[i]}">${d(`p${i}.give.s0`)}</li>`).join('')}</ul></div>`;
  return [
    sec(o, 0, 'b0 hero', `<div class="b0grid"><div>${hands()}${block}<div class="scrub"><label>${w('b.s0.scrub', 'small')}<input type="range" min="0" max="4" step="1" value="0" data-scrub aria-label="take it apart"></label><ol class="stops">${STOPS.map(k => `<li>${w('b.stop.' + k)}</li>`).join('')}</ol></div></div>`
      + `<div class="marg">${w('b.s0.it', 'p', 'aside')}${w('b.s0.ask', 'p', 'prompt')}${w('b.s0.tap', 'small', 'hint')}</div></div>${tag()}`),
    sec(o, 1, 'b1', `${w('b.cut.1', 'small', 'cutk')}<div class="lead2">${pieces}<svg class="leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10 L100 50 M0 90 L100 50"/></svg>${w('b.s1.it', 'p', 'aside')}</div>${w('b.s1.hint', 'small', 'hint')}`),
    sec(o, 2, 'b2', `${w('b.cut.2', 'small', 'cutk')}<div class="lead2">${tiles}<div class="marg">${w('b.s2.label', 'small', 'hint')}${w('b.s2.it', 'p', 'aside')}</div></div>`),
    sec(o, 3, 'b3', `${w('b.cut.3', 'small', 'cutk')}${trays}${w('x.ourcount', 'small', 'ourcount')}${w('b.s3.one', 'small', 'hint')}<div class="b3row"><p class="callout"><span class="callno">1</span>${w('b.s3.it', 'span', 'it')}</p>${inset}</div>`),
    sec(o, 4, 'b4', `${w('b.cut.4', 'small', 'cutk')}${faces}<div class="ghostplay" data-ghost><div class="ghostpiece">${w('b.s4.ghost', 'small')}${person(MCOL[3], 'rightone')}</div>${dominoes(WRONG.slice(1))}<div class="gbtns"><button type="button" data-push>${w('b.s4.push')}</button><button type="button" data-set>${w('b.s4.set')}</button></div></div>`
      + `<div class="doorrow">${doorOf(o)}<div>${w('b.s4.it', 'p', 'aside')}${quote('x.v.l4', 'x.cite.guide')}${w('b.s4.it2', 'p', 'aside')}</div></div>`),
    sec(o, 5, 'b5', `<div class="two">${front('ringed')}${seats(o)}</div>${w('b.s5.fact', 'p', 'fact')}${w('b.s5.it', 'p', 'aside')}`),
    sec(o, 6, 'b6', `<div class="compare"><div class="ablock small" data-replay><span class="seams" aria-hidden="true"></span><span class="tick" hidden></span></div><p class="legend2"><span class="lk yt">${w('b.s6.yourtick')}</span><span class="lk os">${w('b.s6.ourseams')}</span>${w('b.s6.none', 'small', 'none')}</p></div>${w('b.s6.it', 'p', 'aside')}`
      + `${w('b.s6.ask', 'p', 'prompt')}<div class="yourblock"><label class="field"><input type="text" maxlength="80" aria-label="your value, in one line">${w('b.s6.field', 'small')}</label><div class="blank" data-blank><span class="bv"></span></div>${w('b.s6.cuts', 'small', 'hint')}${hands()}</div>`
      + `<div class="ways"><button type="button">${w('b.s6.b1')}</button><button type="button">${w('b.s6.b2')}</button><button type="button">${w('b.s6.b3')}</button></div>${more()}${tag()}`),
  ].join('\n');
}

// =================== c · Taken Apart ===================
function optC() {
  const o = 'c';
  const lines = personas.map((p, i) => i === 0
    ? `<p class="ln" data-m="0">${d('p0.give.s0')} ${d('p0.give.s1')} ${w('c.stetpre')} <span class="stet">${w('c.stet')}</span></p>`
    : `<p class="ln" data-m="${i}">${d(`p${i}.give`)}</p>`).join('');
  // the wiring diagram: six silhouettes centre, want dots left, give dots right
  const H = 600, rowH = H / 6;
  const wires = personas.map((p, i) => { const y = rowH * i + rowH / 2; return p.wants.map((_, k) => { const wy = rowH * i + 18 + k * (rowH - 36) / 3; return `<path class="wire" data-m="${i}" d="M150 ${wy} C 260 ${wy}, 300 ${y}, 400 ${y}"/>`; }).join('') + `<path class="wire" data-m="${i}" d="M440 ${y} C 540 ${y}, 560 ${y}, 650 ${y}"/>`; }).join('');
  const dots = personas.map((p, i) => { const y = rowH * i + rowH / 2; return p.wants.map((_, k) => `<circle class="dot" data-m="${i}" cx="146" cy="${rowH * i + 18 + k * (rowH - 36) / 3}" r="5"/>`).join('') + `<circle class="dot give" data-m="${i}" cx="654" cy="${y}" r="7"/>`; }).join('');
  const PAIRS = [[0, 0], [3, 2], [2, 2]]; // [member, want] shown typeset with their give
  const PAIRGIVE = { 0: 'p0.give.s0', 3: 'p3.give.s0', 2: 'p2.give.s0' };
  const wiring = `<div class="wiring" data-wiring><svg class="wsvg" viewBox="0 0 800 ${H}" preserveAspectRatio="none" aria-hidden="true">${wires}${dots}</svg>`
    + `<div class="wcols">${w('c.s2.h.1', 'b', 'wh1')}${w('c.s2.h.2', 'b', 'wh2')}${w('c.s2.h.3', 'b', 'wh3')}</div>`
    + personas.map((p, i) => `<div class="wrow" data-m="${i}" style="--r:${i}"><span class="wl">${p.wants.map((_, k) => PAIRS.some(([m, j]) => m === i && j === k) ? d(`p${i}.w${k}.want`, 'span', 'set') : `<span class="cell"><span class="ghostline" style="--len:${p.wants[k].want.length}"></span>${d(`p${i}.w${k}.want`, 'span', 'full')}</span>`).join('')}</span>`
      + `<button type="button" class="wsil" aria-label="member ${i + 1}">${person(MCOL[i])}${d(`p${i}.name`, 'small', 'wn')}</button>`
      + `<span class="wr">${PAIRS.some(([m]) => m === i) ? d(PAIRGIVE[i], 'span', 'set') : `<span class="cell"><span class="ghostline" style="--len:${p.give.length / 3}"></span>${d(`p${i}.give.s0`, 'span', 'full')}</span>`}</span>`
      + `<div class="wcard" role="tooltip">${d(`p${i}.life`, 'p')}</div></div>`).join('')
    + `<div class="brackets">${[1, 2, 3, 4].map(k => `<span class="br br${k}">${w('c.s2.br.' + k)}</span>`).join('')}</div></div>`;
  const pbar = `<div class="pbar">${BIG4.map(k => `<span class="pseg" style="--n:${count(k)};--c:${PCOL[k]}">${w('x.pl.' + k, 'b')}<i>${count(k)}</i></span>`).join('')}<span class="pseg ewc" style="--n:2">${w('x.pl.ewc', 'b')}</span></div>`;
  return [
    sec(o, 0, 'c0 hero', `${more()}${w('c.s0.h', 'h1', 'head-it small')}${w('c.s0.ask', 'p', 'prompt')}<div class="lump" data-lump><div class="lump-text">${lines}</div><span class="solid"></span><span class="loupe" aria-hidden="true"></span><span class="cursor" aria-hidden="true"></span><span class="tick" hidden></span></div>${w('c.s0.loupe', 'small', 'hint')}${w('c.s0.it', 'p', 'aside')}${tag()}`),
    sec(o, 1, 'c1', `<div class="proof" data-anim><div class="lump-text open">${lines}</div><svg class="marks2" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"><path class="pencil" d="M330 10 L310 70 M610 70 L590 136 M220 140 L205 200 M470 200 L452 266 M760 266 L742 330"/><path class="pen" d="M40 60 C 20 90, 20 110, 40 130 M960 200 C 980 230, 980 250, 960 270"/></svg>`
      + `<span class="mk m1">${w('c.mk.1')}</span><span class="mk m2">${w('c.mk.2')}</span><span class="mk m3">${w('c.mk.3')}</span><span class="ghosttick" hidden></span></div><p class="stetnote">${w('c.s1.stet', 'span', 'it')}</p>${w('c.s1.it', 'p', 'aside')}`),
    sec(o, 2, 'c2 hero2', `${wiring}${w('c.s2.it', 'p', 'aside')}<p class="hint">${w('c.s2.hint', 'span')} <button type="button" class="all" aria-pressed="false">${w('c.s2.all')}</button></p>`),
    sec(o, 3, 'c3', `${pbar}${w('x.ourcount', 'small', 'ourcount')}<div class="c3row"><div class="ev">${stickies(['x.t.ask', 'x.f.a1', 'x.f.a5'])}</div>${week(o, { cls: 'tiny' })}</div><p class="line">${w('x.ours', 'span', 'ours')} ${w('c.s3.it', 'span', 'it')}</p>`),
    sec(o, 4, 'c4', `<div class="rows2" data-anim>${dominoes(WRONG, 'grey short', '<li class="gap"></li>')}${dominoes([`<span class="blankdom">${w('c.s4.yours', 'span', 'it')}</span>`, 'c.s4.f1', 'c.s4.f2', 'c.s4.f3', 'c.s4.f4', 'c.s4.f5'], 'ink')}</div>`
      + `<div class="doorrow">${doorOf(o)}<div>${quote('x.v.l4', 'x.cite.guide')}${w('c.s4.it2', 'p', 'aside')}</div></div>${w('c.s4.it', 'p', 'aside')}`),
    sec(o, 5, 'c5', `<div class="two"><div>${seats(o)}${w('c.s5.fact', 'p', 'aside')}${w('c.s5.it2', 'p', 'aside')}</div><div class="walk"><div class="walkers">${personas.map((_, i) => `<span style="--i:${i}">${person(MCOL[i])}</span>`).join('')}</div>${front('clean')}${w('c.s5.it', 'p', 'aside outside')}</div></div>`),
    sec(o, 6, 'c6', `<div class="replay"><div class="minibar"><span class="tick" hidden></span>${[1, 2, 3, 4, 5].map(k => `<i style="--k:${k}"></i>`).join('')}</div><p class="legend2"><span class="lk yt">${w('c.s6.yourtick')}</span><span class="lk os">${w('c.s6.ourcuts')}</span></p></div>${w('c.s6.ask', 'p', 'prompt')}`
      + `<label class="field box"><textarea rows="2" maxlength="240" aria-label="everything you offer, in one breath"></textarea>${w('c.s6.box', 'small')}</label><div class="yourbar" data-yourbar hidden></div>${w('c.s6.slash', 'small', 'hint')}<div class="piles">${[1, 2, 3].map(k => `<div class="pile">${w('c.s2.h.' + k, 'b')}<div class="pin"></div></div>`).join('')}</div>${w('c.s6.it', 'p', 'aside')}`
      + `<div class="ways"><button type="button">${w('c.s6.w1')}</button><button type="button">${w('c.s6.w2')}</button><button type="button">${w('c.s6.w3')}</button></div>${tag()}${w('c.s6.sign', 'p', 'aside sign')}`),
  ].join('\n');
}

// =================== d · Prism ===================
function optD() {
  const o = 'd';
  const FRAG = { 0: [0, 1], 1: [1], 5: [0] }; // the three fragments a shade darker, so it reads as a club's offer
  const slab = (cls) => `<div class="slab ${cls}">${personas.map((p, i) => `<span class="sg" data-m="${i}">${sentences(p.give).map((_, n) => d(`p${i}.give.s${n}`, 'span', (FRAG[i] || []).includes(n) ? 'frag' : '')).join(' ')}</span>`).join(' ')}</div>`;
  const prism = (lit) => `<svg class="prism ${lit ? 'lit' : ''}" viewBox="0 0 200 180" aria-hidden="true"><path class="tri" d="M100 6 L194 172 L6 172 Z"/><path class="facet" d="M100 6 L100 172 M100 6 L53 172 M100 6 L147 172"/></svg>`;
  const facets = `<ul class="facets">${[1, 2, 3, 4].map(k => `<li>${w('d.f.' + k)}</li>`).join('')}</ul>`;
  const cx = (i) => (i + 0.5) * 1000 / 6;
  const beams = `<svg class="beams" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path class="in" d="M0 40 L462 120" />${personas.map((_, i) => `<path class="beam" data-m="${i}" style="--c:${MCOL[i]};--i:${i}" d="M494 170 L506 170 L${cx(i) + 28} 300 L${cx(i) - 28} 300 Z"/>`).join('')}</svg>`;
  const ends = `<div class="ends">${personas.map((p, i) => `<div class="end" data-m="${i}" tabindex="0" style="--c:${MCOL[i]}">${person(MCOL[i], 'sil')}${d(`p${i}.name`, 'b')}${d(`p${i}.w0.want`, 'p', 'w1')}${d(`p${i}.w0.today`, 'small', 'today')}<div class="more3">${p.wants.slice(1).map((_, k) => `<div>${d(`p${i}.w${k + 1}.want`, 'p')}${d(`p${i}.w${k + 1}.today`, 'small', 'today')}</div>`).join('')}</div></div>`).join('')}</div>`;
  const bar = `<div class="pbar edged">${BIG4.map(k => `<span class="pseg" style="--n:${count(k)}">${personas.map((p, i) => p.wants.filter(x => trayOf(x.today) === k).map(() => `<i style="--m:${MCOL[i]}"></i>`).join('')).join('')}${w('x.pl.' + k, 'b')}</span>`).join('')}<span class="pseg ewc" style="--n:2">${w('x.pl.ewc', 'b')}</span></div>`;
  const firstTile = `<button type="button" class="dom small" data-first aria-label="push the first tile"></button>`;
  return [
    sec(o, 0, 'd0 hero', `${w('d.s0.h', 'h1', 'head-it')}<div class="d0grid"><div>${slab('top')}${w('d.s0.slab', 'small', 'slabk')}</div><div class="pr">${prism(false)}${facets}${w('d.s0.ask', 'p', 'aside pencil')}</div></div>${tag()}${w('d.s0.two', 'small', 'twoline')}`),
    sec(o, 1, 'd1', `<div class="through" data-anim>${beams}<div class="pr lit">${prism(true)}</div><div class="fkey">${facets}</div></div>${ends}${w('d.s1.hint', 'small', 'hint')}`
      + `<div class="d1row"><div>${slab('mini')}</div><div>${w('d.s1.it2', 'p', 'aside')}<div class="touch">${quote('<span>' + d('p2.give.s0') + '</span>', 'x.cite.guide')}${w('d.s1.it1', 'p', 'aside')}</div>${w('d.s1.it3', 'p', 'aside')}</div></div>`),
    sec(o, 2, 'd2', `<div class="d2row">${bar}<figure class="stamp">${week(o, { cls: 'tiny', tue: 'd.n.tue' })}${w('x.ours', 'small', 'ours')}<div class="sticky solo">${w('x.f.a5', 'p')}</div></figure></div>${w('x.ourcount', 'small', 'ourcount')}${w('d.s2.it', 'p', 'aside')}${w('d.s2.aside', 'p', 'aside small')}`),
    sec(o, 3, 'd3', `<div class="rows2" data-anim>${w('d.s3.top', 'small', 'rk')}${dominoes(WRONG.slice(1), 'grey fall')}<div class="ghosts">${personas.map((_, i) => person('#c9c6be')).join('')}</div>${w('d.s3.first', 'small', 'rk')}<ol class="doms up" data-up><li>${firstTile}${w('d.s3.push', 'span', 'dl')}</li>${['d.s3.f2', 'd.s3.f3', 'd.s3.f4'].map((k, i) => `<li style="--i:${i + 1}"><span class="dom" style="--c:${MCOL[i * 2]}"></span>${w(k, 'span', 'dl')}</li>`).join('')}</ol></div>`
      + `<div class="doorrow">${doorOf(o)}<div>${w('d.s3.it', 'p', 'aside')}${quote('x.v.l4', 'x.cite.guide')}${w('d.s3.it2', 'p', 'aside small')}</div></div>`),
    sec(o, 4, 'd4', `<div class="two">${seats(o, MCOL)}<div class="pride">${front('circled')}</div></div><p class="big88">${w('x.88', 'b')} ${w('d.s4.fact', 'span', 'it')}</p>${w('d.s4.it', 'p', 'aside')}`),
    sec(o, 5, 'd5', `${w('d.s5.ask', 'p', 'prompt')}<div class="d5row"><div class="yourslab"><label class="field"><textarea rows="3" maxlength="300" aria-label="what your offer says to everyone"></textarea>${w('d.s5.field', 'small')}</label><div class="pr">${prism(false)}</div><svg class="beams empty" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">${personas.map((_, i) => `<path d="M300 0 L${30 + i * 100} 120"/>`).join('')}</svg></div>`
      + `<div class="tableview"><div class="tabletop">${stickies(['x.f.a1', 'x.f.a2', 'x.f.a3', 'x.f.a4', 'x.f.a5', 'x.f.a6'])}</div>${chairs()}${w('d.s5.table', 'p', 'aside small')}</div></div>`
      + `<div class="ways"><button type="button">${w('d.s5.w1')}</button><button type="button">${w('d.s5.w2')}</button><button type="button">${w('d.s5.w3')}</button></div>${more()}`),
  ].join('\n');
}

function build() {
  for (const k of Object.keys(REG)) delete REG[k];
  const BUILD = { a: optA, b: optB, c: optC, d: optD };
  const pageOf = {};
  const cases = CONCEPTS.map(c => {
    const html = `<div class="case" data-opt="${c.v}" aria-label="${esc(c.name)}">\n${BUILD[c.v]()}\n${betStrip(c)}\n</div>`;
    for (const m of html.matchAll(/data-copy="85\.([^"]+)"/g)) (pageOf[m[1]] ||= new Set()).add(c.v);
    return html;
  }).join('\n');
  const shell = read('shell.html');
  let html = shell.replace('{{TITLE}}', PAGE.title).replace('<!--CASES-->', () => cases).replace('<!--STYLE-->', () => read('page.css'));
  html = html.replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k)).replace('<!--SCRIPT-->', () => read('page.js'));
  for (const m of html.matchAll(/data-copy="85\.([^"]+)"/g)) if (!pageOf[m[1]]) pageOf[m[1]] = new Set(['chrome']);
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error('unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  fs.writeFileSync(path.join(here, PAGE.file), html);
  const copy = {};
  for (const [k, e] of Object.entries(REG)) copy[N + '.' + k] = { ...e, slot: k, pages: [...(pageOf[k] || [])].sort() };
  const out = { about: 'Every human-readable string on Study 85\'s page, by data-copy id. Written by build.cjs from words.json (ours and the club\'s), personas.json (the brand guide), ../../sitemap/bet.json (the bet\'s questions) and concepts.json (where each is answered). pages = the options it shows on (a, b, c, d) or chrome. flag: draft = ours, set italic; label = ours, wayfinding; sourced = the club\'s words verbatim, set upright, see src; bet = the bet\'s question; chrome = round 4\'s nav, footer, next.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(PAGE.file + ', copy.json ' + Object.keys(copy).length + ' strings');
}
if (require.main === module) build();
module.exports = { PAGE, N, DATA, WORDS, TRAY, MEMBERS, OPTIONS, CONCEPTS, QIDS, DAYS, BET, sentences, life, trayOf, count, build };
