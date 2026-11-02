// The same picking in every wireframe, so the only thing that differs is the layout. Grey stones stand in for Study 61's real ones.
(async () => {
  const W = await (await fetch('../59/words.json')).json();
  const STORY = { D: W.D.flatMap(p => p.split(/(?<=\.)\s+(?=[A-Z])/)), K: [...W.K, W.Q, ...W.Y.map(([y, t]) => y + ': ' + t)] };
  const NAME = { D: 'Divya', K: 'Kahran' }, told = { D: 0, K: 0 };
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const story = $('[data-story]'), prompt = $('[data-prompt]'), latest = $('[data-latest]'), latestWho = $('[data-latest-who]'), end = $('[data-end]');
  function draw() {
    for (const s of ['D', 'K']) { const n = STORY[s].length - told[s]; $$('[data-left="' + s + '"]').forEach(e => { e.textContent = n ? n + ' left' : 'all told'; }); $$('[data-pick="' + s + '"]').forEach(b => { b.disabled = !n; }); }
    const t = told.D + told.K;
    if (prompt) prompt.textContent = t ? 'your order so far' : 'Pick a stone. Whichever you pick, you hear from next.';
    if (end) end.classList.toggle('on', t >= 8);
    window.__told = t;
  }
  function pick(s) {
    if (told[s] >= STORY[s].length) return;
    const text = STORY[s][told[s]++];
    const a = document.createElement('article'); a.dataset.who = s;
    const w = document.createElement('small'); w.textContent = NAME[s]; const p = document.createElement('p'); p.textContent = text;
    a.append(w, p); story.appendChild(a); a.scrollIntoView({ block: 'nearest' });
    if (latest) { latest.textContent = text; latestWho.textContent = NAME[s]; }
    draw();
  }
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));
  window.__pick = pick; window.__total = STORY.D.length + STORY.K.length;
  draw(); window.__ready = 1;
})();
