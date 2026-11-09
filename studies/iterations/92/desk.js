// Study 92, the desk on the client. Reads picks.json (as saved), marks each row's pick, rebuilds the draft
// (draft.js over the template inside index.html) and sends each new pick to POST /api/study-92/pick, which
// writes picks.json. With no server the taps still change the draft here, and the status line says they
// were not saved. With no JS the page is option 1 everywhere: 91 a as it is.
(() => {
  const tpl = document.getElementById('template').textContent;
  const frame = document.getElementById('draft');
  const status = document.getElementById('status');
  let LINES = null, picks = {}, saved = '';
  const rowsOf = () => [...document.querySelectorAll('section.row')];
  function paint() {
    let changed = 0;
    for (const sec of rowsOf()) {
      const line = LINES.find((l) => l.id === sec.dataset.row);
      const c = Draft.chosen(line, picks[line.id]);
      if ('edit' in c || c.i !== 0) changed++;
      sec.classList.toggle('picked', 'edit' in c || c.i !== 0);
      sec.classList.toggle('edited', 'edit' in c);
      sec.querySelectorAll('.opt').forEach((b) => b.toggleAttribute('aria-current', !('edit' in c) && +b.dataset.i === c.i));
      const ta = sec.querySelector('textarea');
      if (document.activeElement !== ta) ta.value = 'edit' in c ? c.edit : line.options[c.i].edit;
    }
    status.innerHTML = '<b>' + changed + ' of ' + LINES.length + '</b> changed from 91 a' + (saved ? ' · ' + saved : '');
    const y = frame.contentWindow ? frame.contentWindow.scrollY : 0;
    frame.addEventListener('load', () => { try { frame.contentWindow.scrollTo(0, y); } catch {} }, { once: true });
    frame.srcdoc = Draft.render(tpl, LINES, picks);
  }
  async function send(row, pick) {
    if (pick === null) delete picks[row]; else picks[row] = pick;
    paint();
    try {
      const r = await fetch('/api/study-92/pick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ row, pick }) });
      saved = r.status === 204 ? 'saved' : 'not saved (' + r.status + ')';
    } catch { saved = 'not saved (no server)'; }
    paint();
  }
  function wire() {
    document.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => send(b.dataset.row, +b.dataset.i === 0 ? null : { from: b.dataset.from, i: +b.dataset.i })));
    document.querySelectorAll('form.edit').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); send(f.dataset.row, { edit: f.elements.edit.value }); }));
    document.getElementById('see').addEventListener('click', () => { document.body.classList.add('drafting'); });
    document.getElementById('back').addEventListener('click', () => { document.body.classList.remove('drafting'); });
  }
  Promise.all([
    fetch('lines.json', { cache: 'no-store' }).then((r) => r.json()),
    fetch('picks.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
  ]).then(([l, p]) => { LINES = l; picks = p || {}; wire(); paint(); })
    .catch(() => { status.textContent = 'opened without the server: showing 91 a as it is, taps do nothing'; });
})();
