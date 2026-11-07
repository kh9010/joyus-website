// Study 86: the Prism (85 d), taken forward inside Divya's model: the bet's reader (a founder or creative, sent
// by someone they trust, missing one piece), her three moves in order (name the situation first; the client
// finds it: came for this, it turned out to be that, they did this with it; the haunting instead of fear) and
// the sum ("that's you, and you'd come out of this looking good", not "look at us"). Kahran, 6 Nov, on 85: "I
// think the prism has something special. Let's take that idea forward but reground in making sure we are
// operating within the bet and questions / model Divya designed." Four variants on one page behind ?v=a|b|c|d,
// in the judge's order (a best):
//   a  Refraction      the three moves, in her order, and nothing more; seats stand the grey tiles up
//   b  Their Spectrum  the founders split it; the prism is an instrument at the frame's edge, "our part"
//   c  Hold It Up      an unnamed slab the reader takes as their own, then a plate: this one was a club's
//   d  Their Light     every beam rises out of a founder's sticky; the prism only separates the colours
// Under each: the bet, against this page (21 questions with the judge's score and the section answering each,
// the three moves, the sum test). One EWC case study about one part of the work; the Tuesday is a stamp.
// Words: words.json + personas.json (the brand guide) + ../../sitemap/bet.json. Every string sits in a
// data-copy="86.<id>" element; this writes case.html and copy.json.   node studies/iterations/86/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const WORDS = JSON.parse(read('words.json')).words;
const { options: CONCEPTS } = JSON.parse(read('concepts.json'));
const BET = JSON.parse(fs.readFileSync(path.join(here, '../../sitemap/bet.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const PAGE = { file: 'case.html', title: 'the prism, inside the bet, four ways' };
const N = '86';
const OPTIONS = CONCEPTS.map(c => c.v);
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const QIDS = BET.beliefs.flatMap((b, i) => ['f', 'e', 'i'].map(k => `b${i + 1}.${k}`));
const sentences = (t) => t.split(/(?<=\."?)\s+(?=[A-Z"])/);

// the places bar: each want filed under ONE place (our count, first match wins), as 85
const TRAY = [['coffeeshop', /coffeeshop/], ['bar', /\bbar\b/], ['home', /\bhome\b|house/], ['club', /country club/], ['charity', /charity/], ['fof', /friends of friends/]];
const trayOf = (today) => (TRAY.find(([, re]) => re.test(today)) || ['one'])[0];
const count = (k) => personas.reduce((s, p) => s + p.wants.filter(x => trayOf(x.today) === k).length, 0);
const BIG4 = ['coffeeshop', 'bar', 'home', 'club'];

const DATA = {};
personas.forEach((p, i) => {
  DATA[`p${i}.name`] = p.name;
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
const sec = (n, cls, body, label) => `<section class="s ${cls}" data-s="${n}" aria-label="${esc(label)}"><span class="sn" aria-hidden="true">§${n}</span>${body}</section>`;

// ---- drawn pieces ----
const MCOL = ['#b0613a', '#2f6a57', '#7a4f86', '#bf912a', '#3f66a0', '#a3403c'];
const person = (col, cls = 'sil') => `<svg class="${cls}" viewBox="0 0 24 40" aria-hidden="true"><circle cx="12" cy="7" r="6" fill="${col}"/><path d="M2 40 V24 a10 10 0 0 1 20 0 V40 Z" fill="${col}"/></svg>`;
const tag = () => `<div class="tag" data-tag aria-label="the project">${w('x.tag.k', 'small')}<span class="tag-row">${w('x.tag.ewc', 'b')}<i>·</i>${w('x.tag.kind')}<i>·</i>${w('x.tag.team')}<i>·</i>${w('x.tag.time', 'span', 'slot')}<i>·</i>${w('x.tag.price')}</span></div>`;
const more = () => `<a class="more" href="#" data-to="client">${w('x.more')} →</a>`;
const beat = (k) => w(k, 'small', 'beat');
const confirm = () => w('x.confirm', 'small', 'confirm');

// the slab: one heavy grey block; one slot shows a line through it, a shade darker
const slab = ({ slot, label, plate, cls = '' } = {}) => `<figure class="slab ${cls}"><div class="block">${plate ? `<span class="plate">${w('x.tag.ewc', 'b')}</span>` : ''}${slot ? `<span class="slot-line">${w(slot, 'span')}</span>` : ''}</div>${label ? w(label, 'figcaption', 'slabk') : ''}</figure>`;
// the prism: a glass triangle, four facets; unlit (grey), lit (gold edges, white glass), glow (an afterglow)
const prismSvg = (state) => `<svg class="prism ${state}" viewBox="0 0 200 176" aria-hidden="true"><path class="tri" d="M100 6 L194 170 L6 170 Z"/><path class="facet" d="M100 6 L100 170 M100 6 L53 170 M100 6 L147 170"/></svg>`;
const facets = (cls = '', head) => `<div class="facets ${cls}">${head ? w(head, 'small', 'fhead') : ''}<ul>${[1, 2, 3, 4].map(k => `<li>${w('x.f.' + k)}</li>`).join('')}</ul></div>`;

// their stickies: the warm-up answer (split as it sits on the board) and four answers from the same board;
// beam i is lit by sticky i (our reading, marked)
const STICK = ['x.w.a1', 'x.w.a1.c', 'x.f.a3', 'x.f.a6', 'x.f.a4', 'x.f.a2'];
const stickyRow = ({ ask = true, cls = '' } = {}) => `<div class="srow ${cls}"><div class="sgrp g1">${ask ? `<blockquote class="club ask">${w('x.w.ask', 'p')}</blockquote>` : ''}<div class="sts">${STICK.slice(0, 2).map((k, i) => `<div class="sticky" data-m="${i}" style="--r:${[-2, 1.5][i]}deg">${w(k, 'p')}</div>`).join('')}</div>${w('x.cite.board', 'small', 'cite')}</div>`
  + `<div class="sgrp g2"><div class="sts">${STICK.slice(2).map((k, j) => `<div class="sticky" data-m="${j + 2}" style="--r:${[2, -1.5, 1, -2][j]}deg">${w(k, 'p')}</div>`).join('')}</div>${w('x.cite.board2', 'small', 'cite')}</div></div>`;

// the scene: six strands come in from the top (their answers), one prism, six beams fan to six ends
const cx = (i) => (i + 0.5) * 1000 / 6;
const scene = ({ roots = false, lit = true } = {}) => `<svg class="beams" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">`
  + personas.map((_, i) => `<path class="strand${roots ? ' root' : ''}" data-m="${i}" style="--c:${MCOL[i]}" d="M${cx(i)} 0 C ${cx(i)} 60, 500 50, 500 112"/>`).join('')
  + `<g class="glass ${lit ? 'lit' : ''}"><path class="tri" d="M500 100 L560 214 L440 214 Z"/><path class="facet" d="M500 100 L500 214 M500 100 L470 214 M500 100 L530 214"/></g>`
  + personas.map((_, i) => `<path class="beam" data-m="${i}" style="--c:${MCOL[i]};--i:${i}" d="M494 214 L506 214 L${cx(i) + 30} 380 L${cx(i) - 30} 380 Z"/>`).join('') + `</svg>`;
const ends = (open = -1) => `<div class="ends">${personas.map((p, i) => `<button type="button" class="end${i === open ? ' on' : ''}" data-m="${i}" style="--c:${MCOL[i]}">${person(MCOL[i])}<span class="et">${d(`p${i}.name`, 'b')}${d(`p${i}.w0.want`, 'span', 'w1')}</span><span class="more3">${p.wants.map((_, k) => `<span class="wt">${k ? d(`p${i}.w${k}.want`, 'span', 'wn') : ''}${d(`p${i}.w${k}.today`, 'small', 'today')}</span>`).join('')}</span></button>`).join('')}</div>`;
// the Operator: the guide's line upright beside ours in italic (the two voices meet in words)
const opPair = (ours = 'x.op', guide = true) => `<div class="oppair" style="--c:${MCOL[2]}">${person(MCOL[2])}${guide ? `<blockquote class="club">${d('p2.give.s0', 'p')}<footer>${w('x.cite.guide')}</footer></blockquote>` : ''}${w(ours, 'p', 'aside')}</div>`;
// where they go today, as one bar (our count); EWC a dashed segment beside, not over
const bar = (nums = false) => `<div class="pbar">${BIG4.map(k => `<span class="pseg" style="--n:${count(k)}"><span class="drops">${personas.map((p, i) => p.wants.filter(x => trayOf(x.today) === k).map(() => `<i style="--m:${MCOL[i]}"></i>`).join('')).join('')}</span>${w('x.pl.' + k, 'b')}${nums ? `<em>${count(k)}</em>` : ''}</span>`).join('')}<span class="pseg ewc" style="--n:2">${w('x.pl.ewc', 'b')}</span></div>${w('x.ourcount', 'small', 'ourcount')}`;
// the stamp: a postage-stamp week, Tuesday open (our reading). The only Tuesday on any page.
const stamp = ({ tue = 'x.n.open', sticky = true, line } = {}) => `<figure class="stamp"><ol class="week">${DAYS.map(k => {
  const t = { mon: 'x.n.mon', wed: 'x.n.wed', thu: 'x.n.thu', tue }[k];
  return `<li class="${k === 'tue' ? 'open' : t ? 'job' : 'wknd'}" data-day="${k}">${w('x.d.' + k, 'b')}${t ? w(t, 'span', 'jt') : ''}</li>`;
}).join('')}</ol>${w('x.ours', 'small', 'ours')}${line ? w(line, 'p', 'aside small') : ''}${sticky ? `<div class="sticky solo">${w('x.f.a5', 'p')}</div>` : ''}</figure>`;

// the tiles: grey, lying flat (what waiting cost); they stand when the seats pass "expected"
const tiles = (cls = '') => `<ol class="tiles ${cls}">${['x.t.money', 'x.t.build', 'x.t.next'].map((k, i) => `<li style="--i:${i}"><span class="tile"></span><span class="tl">${w('x.no', 'span', 'no')} ${w(k)}</span></li>`).join('')}</ol>`;
const seats = () => `<div class="pace"><div class="seats">${Array.from({ length: 100 }, (_, i) => `<i class="${i < 88 ? 'on' : ''}" style="--i:${i};--c:${MCOL[i % 6]}"></i>`).join('')}</div>`
  + `<div class="track"><span class="prog"></span><span class="hit88">${w('x.88', 'b')}</span><span class="exp">${w('x.expected')}</span></div>${w('x.pace', 'small', 'pace-note')}</div>`;
const big88 = () => `<p class="big88">${w('x.88', 'b')} ${w('x.signed', 'span')}</p>`;
const front = (cls = '') => `<figure class="front ${cls}"><div class="browser"><span class="url">eastwestclub.com</span><img src="img/front.png" alt="eastwestclub.com, home, as it is today: the club's own line" loading="lazy"></div><figcaption>${w('x.front')}</figcaption></figure>`;
const door = () => `<svg class="door" viewBox="0 0 120 150" aria-hidden="true"><rect x="0" y="0" width="120" height="150" fill="#1b2a26"/><rect x="34" y="20" width="56" height="118" fill="#f3c76b"/><path d="M34 20 L56 28 L56 132 L34 138 Z" fill="#3b2a1f"/><path d="M34 138 L90 138 L118 150 L6 150 Z" fill="#f3c76b" opacity=".5"/></svg>`;

// the reader's slab: the same grey weight, one field to type in; the prism beside it, unlit
const yourSlab = ({ label, glow = 'none' }) => `<div class="yours"><label class="yslab"><span class="block"><input type="text" maxlength="160" aria-label="what yours says to everyone"></span>${w(label, 'small', 'slabk')}</label><div class="ypr">${prismSvg('unlit')}${glow !== 'none' ? `<svg class="after ${glow}" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">${personas.map((_, i) => `<path d="M0 60 L300 ${8 + i * 21}"/>`).join('')}</svg>` : ''}</div></div>`;
const doors = (keys) => `<div class="doors">${keys.map(k => `<button type="button" class="doorlink">${w(k)}</button>`).join('<i>·</i>')}</div>`;

// ---- the bet, against this page ----
function betStrip(c) {
  const where = {};
  c.sections.forEach(s => s.answers.forEach(q => (where[q] ||= []).push('§' + s.n)));
  const rows = BET.beliefs.map((b, bi) => `<div class="belief">${g(`bet.say.b${bi + 1}`, b.say, 'bet', 'h4', '', '', 'studies/sitemap/bet.json')}<ul>` + ['f', 'e', 'i'].map(k => {
    const q = `b${bi + 1}.${k}`, s = c.scores[QIDS.indexOf(q)];
    return `<li class="q" data-q="${q}" data-score="${s}"><span class="sc" aria-label="${s} of 2"><i class="${s > 0 ? 'on' : ''}"></i><i class="${s > 1 ? 'on' : ''}"></i></span>${g(`bet.q.${q}`, b[k][0], 'bet', 'span', 'qt', '', 'studies/sitemap/bet.json')}${g(`bet.${c.v}.where.${q}`, (where[q] || ['none']).join(' '), 'label', 'span', 'wh')}</li>`;
  }).join('') + '</ul></div>').join('');
  const moves = `<ol class="moves">${BET.moves.map(([m, gloss], i) => `<li class="move" data-move="${i + 1}">${g(`bet.move.${i + 1}`, m, 'bet', 'b', '', '', 'studies/sitemap/bet.json')}${g(`bet.move.${i + 1}.gloss`, gloss, 'bet', 'span', 'gl', '', 'studies/sitemap/bet.json')}${g(`bet.${c.v}.move.${i + 1}`, c.moveAt[i].split(' ').map(n => '§' + n).join(' '), 'label', 'span', 'wh')}</li>`).join('')}</ol>`;
  const sum = `<p class="sumtest">${w('bet.sumk', 'b')}${g('bet.sum', BET.sum, 'bet', 'span', 'gl', '', 'studies/sitemap/bet.json')}<span class="sv"><b>${c.sum}</b></span></p>`;
  const extra = `<span class="ex">${w('bet.m')} <b>${c.moves}</b> · ${w('bet.s')} <b>${c.sum}</b> · ${w('bet.p')} <b>${c.prism}</b> · ${w('bet.b')} <b>${c.brevity}</b> · ${w('bet.total')} <b>${c.total}</b></span>`;
  return `<aside class="bet" aria-label="the bet, against this page"><div class="bet-h">${w('bet.k', 'b')}${g(`bet.${c.v}.name`, c.name, 'label', 'span', 'bn')}<span class="bt"><b>${c.bet}</b> ${w('bet.of')}</span>${extra}${w('bet.judge', 'small')}</div><div class="beliefs">${rows}</div><div class="mv">${w('bet.moves', 'h4')}${moves}${sum}</div></aside>`;
}

// =================== a · Refraction ===================
function optA() {
  return [
    sec('1', 'a1 hero', `${w('x.h', 'h1', 'head-it')}<div class="g0">${slab({ slot: 'x.w.a1', label: 'x.slab.said' })}<div class="pr0">${prismSvg('unlit')}${facets('faint')}${w('x.ask', 'p', 'aside pencil')}</div></div>${tag()}${w('x.two', 'small', 'twoline')}`, 'Move 1, the situation'),
    sec('2a', 'a2a', `${beat('x.came')}${w('a.came', 'p', 'aside lead')}<div class="intake" data-anim>${stickyRow()}<div class="pr1">${prismSvg('lit')}${facets()}</div></div><p class="room">${w('a.room', 'span', 'it')} ${confirm()}</p>`, 'Move 2, came for'),
    sec('2b', 'a2b', `${beat('x.turned')}<div class="fan" data-anim>${scene({ roots: false })}${ends()}</div>${w('x.hint', 'small', 'hint')} ${w('x.thread', 'small', 'hint')}${opPair()}${w('a.six', 'p', 'aside')}`
      + `<div class="rival">${w('x.bar', 'p', 'aside')}<div class="barwrap">${bar()}</div>${stamp()}</div>`, 'Move 2, turned out'),
    sec('2c', 'a2c', `${beat('x.did')}<div class="cost" data-anim>${tiles('stand')}${seats()}</div>${big88()}<div class="two">${w('x.solved', 'p', 'aside')}${front('circled')}</div>`, 'Move 2, did with it'),
    sec('3', 'a3 close', `${w('x.haunt', 'p', 'prompt')}${yourSlab({ label: 'a.field', glow: 'grey' })}${w('a.ask', 'p', 'aside')}${w('x.small', 'p', 'aside small')}${doors(['a.sheet', 'x.comment', 'x.email'])}${more()}`, 'Move 3, the haunting'),
  ].join('\n');
}

// =================== b · Their Spectrum ===================
function optB() {
  return [
    sec('0', 'b0 hero edge', `${w('b.k', 'p', 'kick')}${w('x.h', 'h1', 'head-it')}<div class="g0">${slab({ slot: 'x.w.a1.c', label: 'x.slab.pooled' })}<div class="pr0 off">${prismSvg('unlit')}${w('x.ask', 'p', 'aside pencil')}</div></div>${tag()}${w('x.two', 'small', 'twoline')}`, 'Came for this'),
    sec('1', 'b1', `${beat('x.turned')}<div class="fan" data-anim>${stickyRow({ ask: false, cls: 'top' })}<div class="partk">${w('b.part', 'small', 'ourpart')}${facets('row')}</div>${scene({ roots: true })}${ends(2)}</div>${w('b.src', 'small', 'hint')} ${w('x.hint', 'small', 'hint')}${opPair()}`
      + `<div class="rival">${w('x.bar', 'p', 'aside')}<div class="barwrap">${bar()}</div>${stamp({ tue: 'x.n.tue', sticky: false })}</div><p class="room">${w('b.room', 'span', 'it')} ${confirm()}</p>${w('b.glass', 'p', 'aside')}`, 'It turned out to be this'),
    sec('2', 'b2', `${beat('x.did')}<div class="rows">${w('x.grey', 'small', 'rk')}${tiles('fallen')}${w('x.know', 'small', 'rk')}<ol class="tiles colour"><li class="half"><span class="tile"></span></li>${MCOL.slice(0, 3).map((c, i) => `<li style="--c:${c}"><span class="tile"></span></li>`).join('')}</ol></div>${w('x.aim', 'p', 'aside small')}${w('x.acc', 'p', 'aside small')}`
      + `<div class="two"><div data-anim class="cost">${seats()}${big88()}</div>${front()}</div>`, 'They did this with it'),
    sec('3', 'b3 close', `${w('b.ask', 'p', 'aside')}${w('x.haunt', 'p', 'prompt')}${yourSlab({ label: 'b.field' })}${doors(['b.sheet', 'b.comment', 'x.email'])}${more()}`, 'Your slab'),
  ].join('\n');
}

// =================== c · Hold It Up ===================
function optC() {
  return [
    sec('0', 'c0 hero', `${w('c.h', 'h1', 'head-it')}<div class="g0">${slab({ slot: 'x.w.a1.a' })}<div class="pr0">${prismSvg('unlit hair')}</div></div>${tag()}${w('x.two', 'small', 'twoline')}`, 'Yours, first'),
    sec('1', 'c1', `<div class="plated" data-anim>${slab({ plate: true, cls: 'crack' })}<p class="beatrow">${beat('x.came')} ${w('c.came', 'span', 'it')}</p></div>`
      + `<div class="warm"><blockquote class="club ask">${w('x.w.ask', 'p')}</blockquote><div class="sts">${['x.w.a1.a', 'x.w.a1.b', 'x.w.a1.c'].map((k, i) => `<div class="sticky" data-m="${i}" style="--r:${[-2, 1.5, -1][i]}deg">${w(k, 'p')}</div>`).join('')}</div>${w('x.cite.board', 'small', 'cite')}${w('c.kept', 'p', 'aside small')}</div>`
      + `<div class="partk">${w('c.make', 'small', 'ourpart')}${facets('row')}</div><p class="beatrow">${beat('x.turned')} ${w('c.turned', 'span', 'it')}</p><div class="fan" data-anim>${scene({ roots: false })}${ends()}</div>${w('x.hint', 'small', 'hint')}${w('c.split', 'p', 'aside')}`
      + `<div class="rival">${w('x.bar', 'p', 'aside')}<div class="barwrap">${bar(true)}</div>${stamp({ tue: 'x.n.tue', sticky: false })}</div>`, "This one was a club's"),
    sec('2', 'c2', `<div class="standrow">${tiles('fallen')}<button type="button" class="tile small" data-stand aria-label="stand the row up"></button>${w('x.know', 'small', 'rk')}<ol class="tiles colour up">${MCOL.slice(0, 3).map((c, i) => `<li style="--c:${c};--i:${i}"><span class="tile"></span></li>`).join('')}<li class="doorend">${door()}</li></ol>${w('c.touch', 'small', 'hint')}</div>${w('x.ours', 'small', 'ours')}${w('x.aim', 'p', 'aside small')}`, 'What a grey slab costs'),
    sec('3', 'c3', `${beat('x.did')}<div class="two"><div class="cost" data-anim>${seats()}${big88()}${w('x.solved', 'p', 'aside small')}</div>${front('circled')}</div>`, 'Out the other side'),
    sec('4', 'c4 close', `${w('c.ask', 'p', 'aside')}${yourSlab({ label: 'c.field', glow: 'empty' })}<div class="partk">${facets('row')}</div>${w('c.haunt', 'p', 'aside small')}${doors(['c.sheet', 'x.comment', 'x.email'])}${w('x.small', 'p', 'aside small')}${more()}`, 'Hold yours up'),
  ].join('\n');
}

// =================== d · Their Light ===================
function optD() {
  return [
    sec('1', 'd1 hero', `${w('x.h', 'h1', 'head-it')}${w('d.came', 'p', 'aside lead')}<div class="g0">${slab({ slot: 'x.w.a1.b', label: 'x.slab.pooled' })}<div class="pr0">${prismSvg('unlit')}${facets('faint')}</div></div>${tag()}`, 'The slab'),
    sec('2', 'd2', `<div class="fan" data-anim>${stickyRow({ cls: 'top' })}<div class="partk">${facets('row', 'd.made')}</div>${scene({ roots: true })}${ends()}</div>${w('x.hint', 'small', 'hint')}${w('d.light', 'p', 'aside')}${opPair('d.op', false)}`
      + `<div class="rival">${w('x.bar', 'p', 'aside')}<div class="barwrap">${bar()}</div>${stamp({ line: 'd.strip' })}</div>`, 'Their light, and instead of what'),
    sec('3', 'd3', `<div class="rows cost" data-anim>${w('x.grey', 'small', 'rk')}${tiles('fallen')}<ol class="tiles colour up">${['x.know', 'd.sign', 'd.build', 'd.next'].map((k, i) => `<li class="${i ? '' : 'half'}" style="--c:${i ? MCOL[i * 2 - 1] : '#f3c76b'};--i:${i}"><span class="tile"></span>${w(k, 'span', 'tl')}</li>`).join('')}</ol>${w('x.aim', 'p', 'aside small')}${w('x.acc', 'p', 'aside small')}${seats()}</div>${big88()}<div class="two">${w('x.solved', 'p', 'aside')}${front()}</div>`, 'What it cost, what they did with it'),
    sec('4', 'd4 close', `${w('d.haunt', 'p', 'prompt')}${yourSlab({ label: 'd.field' })}${w('d.ask', 'p', 'aside')}${doors(['d.sheet', 'x.comment', 'x.email'])}<div class="tail">${stickyRow({ ask: false, cls: 'shrunk' })}${w('x.two', 'p', 'aside small')}</div><blockquote class="club">${w('x.v.l4', 'p')}<footer>${w('x.cite.guide')}</footer></blockquote>${more()}`, 'Your slab'),
  ].join('\n');
}

function build() {
  for (const k of Object.keys(REG)) delete REG[k];
  const BUILD = { a: optA, b: optB, c: optC, d: optD };
  const pageOf = {};
  const cases = CONCEPTS.map(c => {
    const html = `<div class="case" data-opt="${c.v}" aria-label="${esc(c.name)}">\n${BUILD[c.v]()}\n${betStrip(c)}\n</div>`;
    for (const m of html.matchAll(/data-copy="86\.([^"]+)"/g)) (pageOf[m[1]] ||= new Set()).add(c.v);
    return html;
  }).join('\n');
  let html = read('shell.html').replace('{{TITLE}}', PAGE.title).replace('<!--CASES-->', () => cases).replace('<!--STYLE-->', () => read('page.css'));
  html = html.replace(/\{\{w:([\w.]+)\}\}/g, (_, k) => w(k)).replace('<!--SCRIPT-->', () => read('page.js'));
  for (const m of html.matchAll(/data-copy="86\.([^"]+)"/g)) if (!pageOf[m[1]]) pageOf[m[1]] = new Set(['chrome']);
  if (/\{\{[\w:.]+\}\}/.test(html)) throw new Error('unfilled ' + html.match(/\{\{[\w:.]+\}\}/)[0]);
  fs.writeFileSync(path.join(here, PAGE.file), html);
  const copy = {};
  for (const [k, e] of Object.entries(REG)) copy[N + '.' + k] = { ...e, slot: k, pages: [...(pageOf[k] || [])].sort() };
  const out = { about: 'Every human-readable string on Study 86\'s page, by data-copy id. Written by build.cjs from words.json (ours and the club\'s), personas.json (the brand guide), ../../sitemap/bet.json (the bet\'s questions, moves and sum) and concepts.json (where each is answered). pages = the options it shows on (a, b, c, d) or chrome. flag: draft = ours, set italic; label = ours, wayfinding; sourced = the club\'s words verbatim, set upright, see src; bet = the bet\'s own words; chrome = the site\'s nav, footer, next.', copy };
  fs.writeFileSync(path.join(here, 'copy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(PAGE.file + ', copy.json ' + Object.keys(copy).length + ' strings');
}
if (require.main === module) build();
module.exports = { PAGE, N, DATA, WORDS, TRAY, OPTIONS, CONCEPTS, QIDS, DAYS, BET, MCOL, sentences, trayOf, count, build };
