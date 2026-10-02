// Shared checks for the subpage wireframes (Study 04 on). Each study's own
// check.cjs calls these and then tests what is specific to its page.
//   links(html, r, extra)  every <a> carries data-to naming a page type from Study 03
//                    (or one a later study adds, passed as extra)
//   chrome(html)     nav + footer carry exactly rev4's labels, each pointing
//                    where Study 03 says it points
//   rev4Pieces()     the 37 pieces from rev4's data, in rotation order, with
//                    their pill, sentence and tags
const fs = require('node:fs');
const path = require('node:path');
const studies = __dirname;
const ia = JSON.parse(fs.readFileSync(path.join(studies, 'iterations/03/ia.json'), 'utf8'));
const rev4 = fs.readFileSync(path.join(studies, 'iterations/02/rev4.html'), 'utf8');
const types = new Set(ia.pages.map(p => p.type));
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(m => ({
    attrs: m[1], text: text(m[2]),
    to: (m[1].match(/data-to="([^"]+)"/) || [])[1],
    filter: (m[1].match(/data-filter="([^"]+)"/) || [])[1],
    next: (m[1].match(/data-next="([^"]+)"/) || [])[1],
  }));
}

function links(html, report, extra = []) {
  // extra: page types a later study adds to Study 03 (and must say why)
  const as = anchors(html);
  const bad = as.filter(a => !a.to || !(types.has(a.to) || extra.includes(a.to)));
  bad.forEach(a => report.fail('link "' + a.text.slice(0, 40) + '" has ' + (a.to ? 'unknown data-to="' + a.to + '"' : 'no data-to')));
  if (!bad.length) report.ok(as.length + ' links, each names a Study 03 page type' + (extra.length ? ' (or ' + extra.join(', ') + ')' : ''));
  return as;
}

function chrome(html, report) {
  const want = Object.fromEntries(ia.clickables.filter(c => c.block === 'nav' || c.block === 'footer').map(c => [c.block + ':' + c.label, c.to]));
  const nav = anchors((html.match(/<header class="nav">[\s\S]*?<\/header>/) || [''])[0]).map(a => ['nav:' + (a.text || 'wordmark'), a.to]);
  const foot = anchors((html.match(/<footer class="foot">[\s\S]*?<\/footer>/) || [''])[0]).map(a => ['footer:' + (a.text || 'wordmark'), a.to]);
  const got = [...nav, ...foot];
  let bad = 0;
  for (const [k, to] of got) if (want[k] !== to) { bad++; report.fail('chrome ' + k + ' goes to ' + to + ', Study 03 says ' + want[k]); }
  for (const k of Object.keys(want)) if (!got.some(g => g[0] === k)) { bad++; report.fail('chrome is missing ' + k); }
  if (!bad) report.ok('nav + footer match rev4 and Study 03 (' + got.length + ' links)');
}

function rev4Pieces() {
  const out = [];
  const heads = [...rev4.matchAll(/\{id:'(\w+)',label:'([^']+)'/g)];
  heads.forEach((h, i) => {
    const block = rev4.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : rev4.indexOf('];', h.index));
    for (const m of block.matchAll(/\{c:'([^']+)',p:'([^']+)',s:'((?:[^'\\]|\\.)*)',t:\[([^\]]*)\]/g)) {
      out.push({ pillId: h[1], pill: h[2], client: m[1], piece: m[2], sentence: m[3].replace(/’/g, "'"), tags: [...m[4].matchAll(/'([^']+)'/g)].map(t => t[1]) });
    }
  });
  return out;
}

function reporter() {
  let failures = 0;
  return {
    ok: (m) => console.log('  ok   ' + m),
    fail: (m) => { failures++; console.log('  FAIL ' + m); },
    note: (m) => console.log('  note ' + m),
    done: () => { console.log(failures ? failures + ' failure(s)' : 'all checks passed'); process.exitCode = failures ? 1 : 0; },
  };
}

module.exports = { ia, rev4, text, anchors, links, chrome, rev4Pieces, reporter };
