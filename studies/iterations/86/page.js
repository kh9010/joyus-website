// 86: which variant (?v=a|b|c|d, a by default); the other three leave the document, so one of each thing is live
{ const v = new URLSearchParams(location.search).get('v'); document.body.dataset.v = /^[a-d]$/.test(v || '') ? v : 'a'; }
document.querySelectorAll('.case').forEach(c => { if (c.dataset.opt !== document.body.dataset.v) c.remove(); });
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// play once when in view: the prism lights, the beams fan, the plate lands, the seats fill and stand the tiles up
const onView = (els, fn, threshold = 0.25) => {
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(fn); return; }
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { threshold });
  els.forEach(x => io.observe(x));
};
onView($$('[data-anim]'), x => x.classList.add('in'));

// a beam: tap (or hover) its end and it lights, opens its other three wants with where each goes today, and
// lights the answer it came from (our reading)
const light = (m, on) => {
  $$(`.beam[data-m="${m}"], .strand[data-m="${m}"]`).forEach(b => b.classList.toggle('on', on));
  $$(`.srow .sticky[data-m="${m}"]`).forEach(s => { s.classList.toggle('on', on); s.style.setProperty('--c', on ? getComputedStyle($(`.end[data-m="${m}"]`)).getPropertyValue('--c') : ''); });
};
$$('.end').forEach(e => {
  const m = e.dataset.m;
  if (e.classList.contains('on')) light(m, true);
  e.addEventListener('mouseenter', () => light(m, true));
  e.addEventListener('mouseleave', () => { if (!e.classList.contains('on')) light(m, false); });
  e.addEventListener('click', () => {
    const was = e.classList.contains('on');
    $$('.end').forEach(x => { x.classList.remove('on'); light(x.dataset.m, false); });
    if (!was) { e.classList.add('on'); light(m, true); }
  });
});
// c: touch the small tile and the coloured row stands up, to a door ajar
$$('[data-stand]').forEach(b => b.addEventListener('click', () => b.closest('.standrow').classList.add('go')));
