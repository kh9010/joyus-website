// Study 92: the draft, assembled. One function, used by build.cjs (node) and the desk (browser):
// render(template, lines, picks) fills 91 a's page (the template, with {{slot}} markers where its eight
// lines were) with each row's pick. No pick, or a pick that no longer matches lines.json, means option 1,
// which is what 91 a says now: render(template, lines, {}) is 91 a byte for byte (check.cjs holds that).
// The six people are six rows (Kahran, 8 Nov: more options for the people), joined into 91 a's list of pairs.
// "My own words" arrive as plain text and are escaped here; the headline alone reads *stars* as the pink. An empty
// proof leaves the proof out; the quote row takes several blocks (founders' lines and a line of ours, see QUOTES).
(function (root) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const QUOTE_CSS = '<style>.quote{margin:18px 0 0;padding:14px 0 0;border-top:1px solid var(--line)}.quote blockquote{font-size:18px;line-height:1.35;font-weight:500}.quote figcaption{margin-top:6px;font-size:14px;color:var(--soft)}</style>';
  const quoteBlock = (q) => QUOTE_CSS + '<figure class="quote"><blockquote>“' + q + '”</blockquote><figcaption>a founder, East West Club</figcaption></figure>';
  // several blocks at once (own words in the quote row, blocks split by a blank line): a block that opens with a quote
  // mark is a founder's line, any line under it its credit; a block without one is a plain line of ours
  const QUOTES_CSS = '<style>.quotes{margin:22px 0 0;padding:16px 0 12px;border-top:2px solid var(--ink);display:grid;gap:16px}.quotes blockquote{font-size:18px;line-height:1.35;font-weight:500}.quotes figcaption{margin-top:6px;font-size:14px;color:var(--soft)}.quotes .ours{font-size:16px;line-height:1.4;color:var(--ink)}</style>';
  const quotesBlock = (blocks) => QUOTES_CSS + '<div class="quotes">' + blocks.map((b) => (b.quote ? '<figure><blockquote>\u201c' + b.quote + '\u201d</blockquote>' + (b.credit ? '<figcaption>' + b.credit + '</figcaption>' : '') + '</figure>' : '<p class="ours">' + b.ours + '</p>')).join('') + '</div>';
  const pairRow = (who, what) => '  <li class="row" role="row"><span class="who" role="cell">' + who + '</span><span class="dot"><i></i></span><span class="what" role="cell">' + what + '</span></li>';
  const pairsHtml = (pairs) => '\n' + pairs.map((p) => pairRow(p[0], p[1])).join('\n') + '\n ';
  const labelsHtml = (w, m) => '<span class="w" role="columnheader">' + w + '</span><span></span><span class="m" role="columnheader">' + m + '</span>';
  const proofHtml = (p, small) => '<div class="proof"><p>' + p + '</p>' + (small ? '<small>' + small + '</small>' : '') + '</div>';
  // own words, row by row: plain text in, the slot's html out
  const EDIT = {
    headline: (t) => esc(t.trim()).replace(/\*([^*]+)\*/g, '<em>$1</em>'),
    lede: (t) => esc(t.trim()),
    labels: (t) => { const [w, m = ''] = t.split('/').map((s) => esc(s.trim())); return labelsHtml(w, m); },
    pair: (t) => { const l = t.replace(/\s+/g, ' ').trim(); const j = l.indexOf(':'); return j < 0 ? pairRow(esc(l), '') : pairRow(esc(l.slice(0, j).trim()), esc(l.slice(j + 1).trim())); },
    pairs: (t) => pairsHtml(t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); return i < 0 ? [esc(l), ''] : [esc(l.slice(0, i).trim()), esc(l.slice(i + 1).trim())]; })),
    proof: (t) => { if (!t.trim()) return ''; const [p, ...rest] = t.split('\n').map((s) => s.trim()).filter(Boolean); return proofHtml(esc(p || ''), esc(rest.join(' '))); },
    quote: (t) => {
      const blocks = t.trim().split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length);
      if (blocks.length < 2) return t.trim() ? quoteBlock(esc(t.trim().replace(/^["“]|["”]$/g, ''))) : '';
      return quotesBlock(blocks.map(([first, ...rest]) => (/^["“]/.test(first) ? { quote: esc(first.replace(/^["“]|["”]$/g, '')), credit: esc(rest.join(' ')) } : { ours: esc([first, ...rest].join(' ')) })));
    },
    cost: (t) => esc(t.trim()).replace('Kahran and Divya', '<b>Kahran and Divya</b>').replace('$5–10K', '<b style="white-space:nowrap">$5–10K</b>'),
    close: (t) => esc(t.trim()),
  };
  // which option a pick resolves to (or the edit), for the desk and the draft alike
  function chosen(line, pick) {
    if (pick && typeof pick.edit === 'string') return { edit: pick.edit };
    if (pick && Number.isInteger(pick.i) && line.options[pick.i] && line.options[pick.i].from === pick.from) return { i: pick.i };
    return { i: 0 };
  }
  // a row marked pair is one person: its html is one <li>, and the six together fill {{pairs}}, in row order
  function render(template, lines, picks) {
    let out = template;
    const pairs = [];
    for (const line of lines) {
      const c = chosen(line, (picks || {})[line.id]);
      const html = 'edit' in c ? EDIT[line.pair ? 'pair' : line.id](c.edit) : line.options[c.i].html;
      if (line.pair) pairs.push(html); else out = out.split('{{' + line.id + '}}').join(html);
    }
    if (pairs.length) out = out.split('{{pairs}}').join('\n' + pairs.join('\n') + '\n ');
    return out;
  }
  const api = { render, chosen, esc, quoteBlock, quotesBlock, pairRow, pairsHtml, labelsHtml, proofHtml };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.Draft = api;
})(this);
