// Study 10: say hi. Kahran's copy verbatim from say-hi.html; B's context code
// run for real: every piece's ?from= resolves back to that piece and
// preselects its pill; an unknown or missing ?from= leaves B behaving like A.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const src = w.text(fs.readFileSync(path.resolve(__dirname, '../../../say-hi.html'), 'utf8')).replace(/’/g, "'");
const { WORK } = require('./work-data.js');
const copy = ['say hi', 'Being friendly', "Tell us what you're working on and what's keeping you up at night.", 'drop us a line', 'Your name', 'Email', "What's on your mind?", 'Send it →', 'talk soon →',
  "Your email app should be opening with the note ready to send. If it didn't, write us directly at hello@joyus.studio — we read everything.", 'other ways to find us', 'The podcast', 'on Spotify, Apple Podcasts & iHeart'];
const placeholders = ['you, a studio, your dog', 'you@something.com', 'A brand that feels like me. A product to launch from zero. Or just a conversation worth having.'];

for (const f of ['sayhi-a-open-note.html', 'sayhi-b-carries-context.html']) {
  console.log(f);
  const html = read(f);
  w.links(html.replace(/<script[\s\S]*?<\/script>/g, ''), r);
  w.chrome(html, r);
  const page = w.text(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));
  const miss = copy.filter(s => !page.includes(s) || !src.includes(s));
  miss.length ? r.fail('copy not verbatim on page + in say-hi.html: ' + miss.join(' | ')) : r.ok(copy.length + ' lines of say-hi.html, verbatim');
  const ph = [...html.matchAll(/placeholder="([^"]+)"/g)].map(m => m[1]);
  placeholders.every(p => ph.includes(p) && fs.readFileSync(path.resolve(__dirname, '../../../say-hi.html'), 'utf8').includes('placeholder="' + p + '"')) ? r.ok('3 placeholders, verbatim') : r.fail('placeholders differ');
}

// run B's context code with a fake document
console.log('B · context, run');
const b = read('sayhi-b-carries-context.html');
const code = (b.match(/<script id="ctx">([\s\S]*?)<\/script>/) || [])[1];
function run(query) {
  const els = {}; const el = (id) => els[id] || (els[id] = { id, hidden: true, innerHTML: '', textContent: '' });
  const document = { getElementById: el, querySelectorAll: () => [...(el('opts').innerHTML.matchAll(/value="(\w+)" checked/g))].map(m => ({ value: m[1] })) };
  const c = { WORK, document, URLSearchParams }; vm.createContext(c); vm.runInContext(code, c);
  const params = new URLSearchParams(query);
  c.initCtx(params);
  return { FROM: vm.runInContext('FROM', c), els, subject: c.subject(params), checked: document.querySelectorAll().map(x => x.value) };
}
let bad = 0;
for (const p of WORK.pieces) {
  const slug = p.url.replace(/^\/(work|experiments)\//, '').replace(/\.html$/, '');
  const o = run('from=' + slug);
  const ok = o.FROM && o.FROM.client === p.client && o.FROM.piece === p.piece && o.els.ctx.hidden === false && o.els['ctx-s'].textContent === p.s && o.checked.join() === p.pill && o.subject.includes('re: ' + p.client + ' · ' + p.piece);
  if (!ok) { bad++; r.fail('?from=' + slug + ' did not resolve to ' + p.client + ' · ' + p.piece); }
}
bad ? 0 : r.ok('all ' + WORK.pieces.length + ' pieces: ?from= names the piece, shows its sentence, preselects its one pill, carries it into the subject');
for (const q of ['', 'from=nobody/nothing']) {
  const o = run(q);
  // untouched, the box keeps its hidden attribute from the HTML
  !o.FROM && (!o.els.ctx || o.els.ctx.hidden) && o.checked.length === 0 && o.subject === 'say hi' ? r.ok((q || 'no ?from=') + ': no context, nothing preselected, subject "say hi" (as A)') : r.fail((q || 'no ?from=') + ' leaked context');
}

console.log('A vs B');
const strip = (h) => h.replace(/<title>[^<]*<\/title>/, '').replace(/\/\* <!--CTX-CSS-->[\s\S]*?<!--\/CTX-CSS--> \*\/[\s\S]*?(?=\n  @media)/, '').replace(/<!--CTX-->[\s\S]*?(?=\n      <label>Your name)/, '').replace(/<script id="ctx">[\s\S]*?<\/script>/, '');
strip(read('sayhi-a-open-note.html')) === strip(b) ? r.ok('identical outside the context block, its CSS and subject()') : r.fail('A and B differ elsewhere');
r.done();
