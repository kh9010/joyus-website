// 84: which page (?v=a|b|c|d, a by default); the other three leave the document, so one of each thing is live
{ const v = new URLSearchParams(location.search).get('v'); document.body.dataset.v = /^[a-d]$/.test(v || '') ? v : 'a'; }
document.querySelectorAll('.case').forEach(c => { if (c.dataset.opt !== document.body.dataset.v) c.remove(); });
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

// on scroll: pieces that move (the lump splits, dominoes fall, seats fill) play once when they come into view
const anim = $$('[data-anim]:not(.block), .doms.fall, .pace, .drop, .stand, .clubblock');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.35 });
  anim.forEach(x => io.observe(x));
} else anim.forEach(x => x.classList.add('in'));
$$('.crack').forEach(b => b.addEventListener('click', () => b.previousElementSibling.classList.toggle('in')));
$$('.block[data-tap]').forEach(b => {
  b.addEventListener('click', () => b.classList.toggle('in'));
  if ('IntersectionObserver' in window) { const o = new IntersectionObserver((es) => { if (es[0].isIntersecting) { setTimeout(() => b.classList.add('in'), 2200); o.disconnect(); } }, { threshold: 0.6 }); o.observe(b); }
});

// the night picker: tap a night; every night's job is revealed (Tuesday last); the pick is remembered for the close
const PICK = {};
$$('.nights').forEach(ol => {
  const o = ol.dataset.pick;
  $$('li', ol).forEach((li, i) => li.style.setProperty('--k', li.classList.contains('tue') ? 8 : i));
  const choose = (li) => {
    $$('li', ol).forEach(x => x.classList.toggle('picked', x === li));
    ol.classList.add('revealed');
    ol.classList.toggle('picked-tue', li.dataset.day === 'tue');
    if (li.dataset.day !== 'tue') { li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); }
    PICK[o] = li;
    echo(o);
  };
  $$('li', ol).forEach(li => li.addEventListener('click', () => choose(li)));
});
// the close echoes the pick: its night and that night's job, copied from the picker (no new words)
function echo(o) {
  const li = PICK[o]; if (!li) return;
  const day = $('.nb b', li).textContent, job = $('.jt', li) ? $('.jt', li).textContent : ($('blockquote p', li) || {}).textContent || '';
  $$(`[data-echo="${o}"]`).forEach(e => {
    e.classList.add('has');
    const d = $('.echo-day', e), t = $('.echo-tag', e);
    if (d) { d.textContent = day; t.textContent = li.dataset.day === 'tue' ? '✓ ' + job : job; }
    else e.textContent = '↑ ' + day;
  });
}

// b §3: either card opens the doors; a door shows the wants it holds today
$$('[data-choose]').forEach(ch => $$('button', ch).forEach(b => b.addEventListener('click', () => {
  $$('button', ch).forEach(x => x.classList.toggle('on', x === b));
  ch.nextElementSibling.classList.add('open');
})));
$$('.doorb:not(.ewc)').forEach(d => d.addEventListener('click', () => d.classList.toggle('on')));

// b §5: two runs, one shown; "try the other" switches
$$('[data-runs]').forEach(r => $$('[data-run]', r).forEach(b => b.addEventListener('click', () => {
  r.dataset.on = b.dataset.run;
  $$('.rsw button', r).forEach(x => x.classList.toggle('on', x.dataset.run === b.dataset.run));
})));

// b §7: what the reader types lands on the table, in our italic, in front of the third chair
$$('input[data-into]').forEach(inp => inp.addEventListener('input', () => {
  const m = $('[data-mine]'); m.textContent = inp.value; m.className = 'mine it';
}));

// c §1: the hinge
$$('[data-hinge]').forEach(h => { const r = $('input', h); const set = () => h.style.setProperty('--h', r.value + '%'); if (innerWidth < 560) { r.value = 16; set(); } r.addEventListener('input', set); });

// c §4: drag (or tap) a chip onto the first domino
$$('[data-domrow]').forEach(row => {
  const drop = $('[data-drop]', row);
  const put = (kind) => { row.classList.remove('go-right', 'go-wrong'); void row.offsetWidth; row.classList.add(kind === 'member' ? 'go-right' : 'go-wrong'); };
  $$('.chip', row).forEach(c => {
    c.addEventListener('click', () => put(c.dataset.chip));
    c.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', c.dataset.chip));
  });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); put(e.dataTransfer.getData('text/plain')); });
});

// c §7 and d §6: tap your night; it lights and the way in opens
$$('[data-reply]').forEach(ol => $$('li', ol).forEach(li => li.addEventListener('click', () => {
  $$('li', ol).forEach(x => x.classList.toggle('lit', x === li));
  const box = ol.parentElement.querySelector('.reply, .card3'); if (box) box.hidden = false;
})));

// d §5: flip the six (in §1) to with EWC, and go there
$$('.flipup').forEach(b => b.addEventListener('click', () => { const w = $('.flip button[data-with="1"]'); w.click(); w.closest('.body').scrollIntoView({ behavior: 'smooth' }); }));

// thumbnails open full size
const lb = $('.lightbox');
$$('.thumb').forEach(t => t.addEventListener('click', () => { $('img', lb).src = t.dataset.full; $('img', lb).alt = $('img', t).alt; lb.showModal(); }));
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

// Study 50's six: the cards (T-a), kept on screen, under the name; show all; the without/with flip
const fit = (c) => {
  const h = c.querySelector('.hov'), n = c.querySelector('h3');
  h.style.setProperty('--dy', Math.round(n.offsetTop + n.offsetHeight + 4) + 'px'); h.style.setProperty('--dx', '0px');
  const r = h.getBoundingClientRect(), vw = document.documentElement.clientWidth, g = 16;
  let dx = 0; if (r.right > vw - g) dx = vw - g - r.right; if (r.left + dx < g) dx = g - r.left;
  h.style.setProperty('--dx', Math.round(dx) + 'px');
};
const cols = $$('.col');
cols.forEach(c => {
  ['mouseenter', 'focus'].forEach(ev => c.addEventListener(ev, () => fit(c)));
  c.addEventListener('click', (e) => { if (e.target.closest('button')) return; const was = c.classList.contains('is-open'); cols.forEach(x => x.classList.remove('is-open')); c.classList.toggle('is-open', !was); if (!was) fit(c); });
});
document.addEventListener('click', (e) => { if (!e.target.closest('.col')) cols.forEach(x => x.classList.remove('is-open')); });
addEventListener('resize', () => cols.filter(c => c.classList.contains('is-open')).forEach(fit));
const all = $('.hint .all');
if (all) all.addEventListener('click', () => { const on = all.getAttribute('aria-pressed') !== 'true'; all.setAttribute('aria-pressed', on); document.body.classList.toggle('show-all', on); });
const fs = $$('.flip button');
fs.forEach(b => b.addEventListener('click', () => { const on = b.dataset.with === '1'; fs.forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.col').forEach(c => { c.querySelector('.without').hidden = on; c.querySelector('.with').hidden = !on; }); }));
