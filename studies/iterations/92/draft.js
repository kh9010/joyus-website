// Study 92: the draft, assembled. One function, used by build.cjs (node) and the desk (browser):
// render(template, lines, picks) fills 91 a's page (the template, with {{slot}} markers where its eight
// lines were) with each row's pick. No pick, or a pick that no longer matches lines.json, means option 1,
// which is what 91 a says now: render(template, lines, {}) is 91 a byte for byte (check.cjs holds that).
// "My own words" arrive as plain text and are escaped here; the headline alone reads *stars* as the pink.
(function (root) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const QUOTE_CSS = '<style>.quote{margin:18px 0 0;padding:14px 0 0;border-top:1px solid var(--line)}.quote blockquote{font-size:18px;line-height:1.35;font-weight:500}.quote figcaption{margin-top:6px;font-size:14px;color:var(--soft)}</style>';
  const quoteBlock = (q) => QUOTE_CSS + '<figure class="quote"><blockquote>“' + q + '”</blockquote><figcaption>a founder, East West Club</figcaption></figure>';
  const pairRow = (who, what) => '  <li class="row" role="row"><span class="who" role="cell">' + who + '</span><span class="dot"><i></i></span><span class="what" role="cell">' + what + '</span></li>';
  const pairsHtml = (pairs) => '\n' + pairs.map((p) => pairRow(p[0], p[1])).join('\n') + '\n ';
  const labelsHtml = (w, m) => '<span class="w" role="columnheader">' + w + '</span><span></span><span class="m" role="columnheader">' + m + '</span>';
  const proofHtml = (p, small) => '<div class="proof"><p>' + p + '</p>' + (small ? '<small>' + small + '</small>' : '') + '</div>';
  // own words, row by row: plain text in, the slot's html out
  const EDIT = {
    headline: (t) => esc(t.trim()).replace(/\*([^*]+)\*/g, '<em>$1</em>'),
    lede: (t) => esc(t.trim()),
    labels: (t) => { const [w, m = ''] = t.split('/').map((s) => esc(s.trim())); return labelsHtml(w, m); },
    pairs: (t) => pairsHtml(t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); return i < 0 ? [esc(l), ''] : [esc(l.slice(0, i).trim()), esc(l.slice(i + 1).trim())]; })),
    proof: (t) => { const [p, ...rest] = t.split('\n').map((s) => s.trim()).filter(Boolean); return proofHtml(esc(p || ''), esc(rest.join(' '))); },
    quote: (t) => (t.trim() ? quoteBlock(esc(t.trim().replace(/^["“]|["”]$/g, ''))) : ''),
    cost: (t) => esc(t.trim()),
    close: (t) => esc(t.trim()),
  };
  // which option a pick resolves to (or the edit), for the desk and the draft alike
  function chosen(line, pick) {
    if (pick && typeof pick.edit === 'string') return { edit: pick.edit };
    if (pick && Number.isInteger(pick.i) && line.options[pick.i] && line.options[pick.i].from === pick.from) return { i: pick.i };
    return { i: 0 };
  }
  function render(template, lines, picks) {
    let out = template;
    for (const line of lines) {
      const c = chosen(line, (picks || {})[line.id]);
      const html = 'edit' in c ? EDIT[line.id](c.edit) : line.options[c.i].html;
      out = out.split('{{' + line.id + '}}').join(html);
    }
    return out;
  }
  const api = { render, chosen, esc, quoteBlock, pairsHtml, labelsHtml, proofHtml };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.Draft = api;
})(this);
