// 85: which page (?v=a|b|c|d, a by default); the other three leave the document, so one of each thing is live
{ const v = new URLSearchParams(location.search).get('v'); document.body.dataset.v = /^[a-d]$/.test(v || '') ? v : 'a'; }
document.querySelectorAll('.case').forEach(c => { if (c.dataset.opt !== document.body.dataset.v) c.remove(); });
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const phone = () => innerWidth < 700;
const store = { get: (k) => { try { return JSON.parse(localStorage.getItem('85.' + k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('85.' + k, JSON.stringify(v)); } catch {} } };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// play once when in view
const onView = (els, fn, threshold = 0.3) => {
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(fn); return; }
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { threshold });
  els.forEach(x => io.observe(x));
};
onView($$('[data-anim], .ourgrid, .bars, .b3, .c5, .a3'), x => x.classList.add('in'));

// ---------- a · Untangle ----------
const knot = $('[data-knot]');
if (knot) {
  const chips = $$('.chip', knot);
  const trays = $$('[data-tray]');
  const KIND = { who: 'who', what: 'what', instead: 'instead' };
  // the knot: chips scattered on a fixed pattern (no randomness, so every visit is the same knot)
  const place = () => chips.forEach((c, j) => {
    if (c.closest('.in-tray')) return;
    const cols = phone() ? 3 : 6, r = Math.floor(j / cols), k = j % cols;
    const jx = [3, -4, 6, -2, 5, -6, 2][j % 7], jy = [-5, 4, -2, 6, -3, 3][j % 6];
    c.style.setProperty('--x0', (100 / cols * (k + 0.5) + jx) + '%');
    c.style.setProperty('--y0', (100 / Math.ceil(chips.length / cols) * (r + 0.5) + jy) + '%');
    c.style.setProperty('--rot', [-4, 3, -2, 5, -3, 2, 0][j % 7] + 'deg');
  });
  // threads: each chip tied to two others by a thin curve; a sorted chip's threads let go
  const threads = $('.threads', knot);
  const tie = () => {
    const kr = knot.getBoundingClientRect(); const live = chips.filter(c => !c.closest('.in-tray'));
    const pts = live.map(c => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2 - kr.left, r.top + r.height / 2 - kr.top]; });
    let p = '';
    pts.forEach((a, i) => [5, 7].forEach(s => { const b = pts[(i + s) % pts.length]; if (!b || b === a) return; const mx = (a[0] + b[0]) / 2 + ((i % 2) ? 40 : -40), my = (a[1] + b[1]) / 2 + ((i % 3) ? -30 : 30); p += `M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]} `; }));
    threads.innerHTML = p ? `<path d="${p}"/>` : '';
  };
  const save = () => store.set('sort', Object.fromEntries(trays.map(t => [t.dataset.tray, $$('.chip', t).map(c => chips.indexOf(c))])));
  const put = (c, t) => { $('.in-tray', t).appendChild(c); c.classList.remove('sel'); c.style.removeProperty('--x0'); tie(); save(); echoA(); };
  const reset = () => { chips.forEach(c => knot.appendChild(c)); place(); requestAnimationFrame(tie); store.set('sort', null); store.set('skip', false); $('.a7') && $('.a7').classList.remove('skip'); echoA(); };
  // drag (pointer) or tap a chip, then a tray
  let sel = null;
  chips.forEach(c => {
    c.addEventListener('click', () => { if (c.closest('.in-tray')) return; sel = sel === c ? null : c; chips.forEach(x => x.classList.toggle('sel', x === sel)); });
    c.addEventListener('pointerdown', (e) => {
      if (c.closest('.in-tray') || phone()) return;
      const kr = knot.getBoundingClientRect(); let moved = false;
      const mv = (ev) => { moved = true; c.classList.add('dragging'); c.style.setProperty('--x0', (ev.clientX - kr.left) + 'px'); c.style.setProperty('--y0', (ev.clientY - kr.top) + 'px'); trays.forEach(t => { const r = t.getBoundingClientRect(); t.classList.toggle('over', ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom); }); tie(); };
      const up = (ev) => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); c.classList.remove('dragging'); const t = trays.find(t => t.classList.contains('over')); trays.forEach(x => x.classList.remove('over')); if (t) put(c, t); else if (moved) tie(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
  });
  trays.forEach(t => t.addEventListener('click', (e) => { if (sel && !e.target.closest('.in-tray .chip')) { put(sel, t); sel = null; } }));
  // ours: everything sorted where it belongs, with no score
  const auto = (stagger) => chips.filter(c => !c.closest('.in-tray')).forEach((c, i) => setTimeout(() => put(c, trays.find(t => t.dataset.tray === KIND[c.dataset.kind])), stagger * i));
  $('[data-skip]').addEventListener('click', () => { store.set('skip', true); $('.a7').classList.add('skip'); auto(0); $('.a3').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  $('[data-again]').addEventListener('click', reset);
  place();
  const was = store.get('sort');
  if (was) Object.entries(was).forEach(([k, ids]) => ids.forEach(i => chips[i] && $('.in-tray', trays.find(t => t.dataset.tray === k)).appendChild(chips[i])));
  if (store.get('skip')) $('.a7').classList.add('skip');
  requestAnimationFrame(tie); addEventListener('resize', () => { place(); tie(); });
  // on a phone the sort plays itself over about four seconds, and stays
  if (phone()) { $('[data-skip]').style.display = 'none'; $('[data-again]').style.display = 'inline-block'; onView([$('[data-trays]')], () => auto(220), 0.4); }
  // §7 echoes the reader's sort (or the knot, if skipped) beside ours
  function echoA() {
    const y = $('[data-yours]'); if (!y) return;
    const sorted = trays.some(t => $('.chip', t));
    y.classList.toggle('knotted', !sorted);
    y.innerHTML = sorted ? trays.map(t => `<div class="col3"><b>${$('b', t).textContent}</b>${$$('.chip', t).map(c => `<span class="chip">${c.textContent}</span>`).join('')}</div>`).join('')
      : chips.map(c => `<span class="chip">${c.textContent}</span>`).join('');
  }
  echoA();
  // §3: tap a row for its give
  $$('.ourgrid .row').forEach((r, k) => { r.style.setProperty('--k', k); r.addEventListener('click', () => r.classList.toggle('open')); });
  // §4: Study 50, in place, only when asked
  $$('.six50').forEach(dt => dt.addEventListener('toggle', () => { const f = $('iframe', dt); if (dt.open && !f.src) f.src = f.dataset.src; }));
  // §5: the dominoes play themselves: the wrong member tips the row, then the six stand it back up
  onView([$('[data-domplay]')], (x) => { x.classList.add('p1'); setTimeout(() => x.classList.add('p2'), reduce ? 0 : 2200); }, 0.4);
}

// ---------- b · Exploded View ----------
$$('[data-block]').forEach(b => {
  const scrub = $('[data-scrub]');
  const set = () => { const v = +scrub.value; if (v) b.dataset.open = v; else delete b.dataset.open; b.style.setProperty('--gap', (v * (phone() ? 6 : 14)) + 'px'); };
  scrub.addEventListener('input', set);
  const tick = $('.tick', b);
  const showTick = (x) => { tick.hidden = false; tick.style.left = (x * 100) + '%'; };
  b.addEventListener('click', (e) => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; store.set('btick', x); showTick(x); replay(); });
  const was = store.get('btick'); if (was != null) showTick(was);
  function replay() {
    const t = store.get('btick'), rp = $('[data-replay]'); if (!rp) return;
    const tk = $('.tick', rp); const c = rp.closest('.compare');
    if (t == null) { tk.hidden = true; c.classList.add('nocut'); } else { tk.hidden = false; tk.style.left = (t * 100) + '%'; c.classList.remove('nocut'); }
  }
  replay();
});
$$('.bpiece').forEach(p => p.addEventListener('click', () => { const was = p.classList.contains('on'); $$('.bpiece').forEach(x => x.classList.remove('on')); p.classList.toggle('on', !was); }));
$$('.tile').forEach(t => t.addEventListener('click', () => t.classList.add('open')));
$$('.t14.one').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
$$('[data-ghost]').forEach(g => {
  $('[data-push]', g).addEventListener('click', () => { g.classList.remove('set'); g.classList.add('pushed'); });
  $('[data-set]', g).addEventListener('click', () => { g.classList.remove('pushed'); g.classList.add('set'); });
});
$$('[data-blank]').forEach(bl => {
  const inp = bl.parentElement.querySelector('.field input');
  inp.addEventListener('input', () => { $('.bv', bl).textContent = inp.value; });
  bl.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' || $$('.cut', bl).length >= 3) return;
    const r = bl.getBoundingClientRect(); const c = document.createElement('span'); c.className = 'cut'; c.style.left = ((e.clientX - r.left) / r.width * 100) + '%';
    const n = document.createElement('input'); n.type = 'text'; n.maxLength = 30; n.setAttribute('aria-label', 'name this part'); c.appendChild(n); bl.appendChild(c); n.focus();
  });
});

// ---------- c · Taken Apart ----------
$$('[data-lump]').forEach(l => {
  const mv = (e) => { const r = l.getBoundingClientRect(); l.style.setProperty('--lx', (e.clientX - r.left) + 'px'); l.style.setProperty('--ly', (e.clientY - r.top) + 'px'); l.classList.add('looking'); };
  l.addEventListener('pointermove', mv); l.addEventListener('pointerleave', () => l.classList.remove('looking'));
  const tick = $('.tick', l), ghost = $('.ghosttick'), mini = $('.minibar .tick');
  const show = (x) => [tick, ghost, mini].forEach(t => { if (t) { t.hidden = false; t.style.left = (x * 100) + '%'; } });
  l.addEventListener('click', (e) => { const r = l.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; store.set('ctick', x); show(x); });
  const was = store.get('ctick'); if (was != null) show(was);
  // on a phone, a still loupe sits over the first line so the bar is seen to hold words
  if (phone()) { l.style.setProperty('--lx', '40%'); l.style.setProperty('--ly', '30px'); l.classList.add('looking'); }
});
$$('[data-wiring]').forEach(wg => {
  const light = (i) => { wg.classList.toggle('lit', i != null); $$('.wire, .dot', wg).forEach(x => x.classList.toggle('on', x.dataset.m === String(i))); $$('.wrow', wg).forEach(r => r.classList.toggle('on', r.dataset.m === String(i))); };
  $$('.wrow', wg).forEach(r => {
    const s = $('.wsil', r);
    s.addEventListener('mouseenter', () => light(r.dataset.m)); s.addEventListener('mouseleave', () => { if (!r.classList.contains('pin')) light(null); });
    s.addEventListener('click', () => { const was = r.classList.contains('pin'); $$('.wrow', wg).forEach(x => x.classList.remove('pin')); if (!was) { r.classList.add('pin'); light(r.dataset.m); } else light(null); });
  });
  const all = wg.parentElement.querySelector('.all');
  if (all) all.addEventListener('click', () => { const on = all.getAttribute('aria-pressed') !== 'true'; all.setAttribute('aria-pressed', on); wg.classList.toggle('show-all', on); });
});
$$('[data-yourbar]').forEach(bar => {
  const ta = bar.parentElement.querySelector('.box textarea');
  const piles = $$('.pile .pin', bar.parentElement);
  let words = [];
  const draw = () => { words = ta.value.trim().split(/\s+/).filter(Boolean); bar.hidden = !words.length; bar.innerHTML = words.map((x, i) => `<span data-i="${i}">${x.replace(/</g, '&lt;')}</span>`).join(''); };
  ta.addEventListener('input', draw);
  let n = 0;
  bar.addEventListener('click', (e) => {
    const s = e.target.closest('span'); if (!s) return; const i = +s.dataset.i;
    const slip = words.slice(0, i + 1).join(' '); if (!slip) return;
    const el = document.createElement('span'); el.textContent = slip; piles[n++ % 3].appendChild(el);
    ta.value = words.slice(i + 1).join(' '); draw();
  });
});

// ---------- d · Prism ----------
$$('.end').forEach(e => {
  const m = e.dataset.m;
  const on = (v) => { $$(`.beam[data-m="${m}"]`).forEach(b => b.classList.toggle('on', v)); $$(`.slab.mini .sg[data-m="${m}"]`).forEach(s => s.classList.toggle('on', v)); };
  e.addEventListener('mouseenter', () => on(true)); e.addEventListener('mouseleave', () => { if (!e.classList.contains('on')) on(false); });
  e.addEventListener('click', () => { const was = e.classList.contains('on'); $$('.end').forEach(x => { x.classList.remove('on'); $$(`.beam[data-m="${x.dataset.m}"]`).forEach(b => b.classList.remove('on')); $$(`.slab.mini .sg[data-m="${x.dataset.m}"]`).forEach(s => s.classList.remove('on')); }); if (!was) { e.classList.add('on'); on(true); } });
});
$$('[data-first]').forEach(b => b.addEventListener('click', () => b.closest('.doms').classList.add('go')));
