// ---------------------------------------------------------------------------
// HTML TOKENIZER — hand-rolled, zero-dependency, identical in Node and Workers.
//
// This is deliberately the ONLY parser. An earlier draft kept a second,
// HTMLRewriter-driven path that only existed inside the Workers runtime, which
// meant the code that ran in production was the one code path nothing could
// test. Two unverifiable risks came with it (the `*` selector can dispatch a
// text node once per matching ancestor scope, duplicating page text; and
// `onEndTag` never fires for unclosed elements in malformed HTML, so a hidden
// ancestor latches on forever). Deleting it removes both, removes the
// dual-parser drift surface, and costs nothing: this tokenizer is pure JS and
// runs unchanged on workerd.
//
// It is not a full HTML5 tree builder — no error-recovery tree construction —
// but it handles what text extraction actually depends on: void elements,
// raw-text elements (script/style/textarea/title/noscript), quoted and
// unquoted attributes, comments, and mismatched close tags.
// ---------------------------------------------------------------------------

export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

export const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea', 'title', 'noscript']);

// Named character references. The 13-entry table this replaces let `&rarr;`
// and `&amp;` through untouched: `&rarr;` leaked into link labels the model
// might quote to a visitor, and an undecoded `&amp;` inside a resolved href
// produced a URL the crawler would then follow wrongly. This is the HTML4 set
// plus the common HTML5 additions, which covers what real sites emit.
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  iexcl: '¡', cent: '¢', pound: '£', curren: '¤', yen: '¥', brvbar: '¦', sect: '§',
  uml: '¨', copy: '©', ordf: 'ª', laquo: '«', not: '¬', shy: '­', reg: '®',
  macr: '¯', deg: '°', plusmn: '±', sup2: '²', sup3: '³', acute: '´', micro: 'µ',
  para: '¶', middot: '·', cedil: '¸', sup1: '¹', ordm: 'º', raquo: '»',
  frac14: '¼', frac12: '½', frac34: '¾', iquest: '¿',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å',
  AElig: 'Æ', Ccedil: 'Ç', Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï', ETH: 'Ð', Ntilde: 'Ñ',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', times: '×',
  Oslash: 'Ø', Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü', Yacute: 'Ý',
  THORN: 'Þ', szlig: 'ß',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å',
  aelig: 'æ', ccedil: 'ç', egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï', eth: 'ð', ntilde: 'ñ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', divide: '÷',
  oslash: 'ø', ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý',
  thorn: 'þ', yuml: 'ÿ',
  OElig: 'Œ', oelig: 'œ', Scaron: 'Š', scaron: 'š', Yuml: 'Ÿ', fnof: 'ƒ',
  circ: 'ˆ', tilde: '˜',
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ',
  Eta: 'Η', Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν',
  Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ', Upsilon: 'Υ',
  Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigmaf: 'ς', sigma: 'σ', tau: 'τ',
  upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  ensp: ' ', emsp: ' ', thinsp: ' ', zwnj: '‌', zwj: '‍',
  lrm: '‎', rlm: '‏',
  ndash: '–', mdash: '—', horbar: '―', lsquo: '‘', rsquo: '’', sbquo: '‚',
  ldquo: '“', rdquo: '”', bdquo: '„', dagger: '†', Dagger: '‡', bull: '•',
  hellip: '…', permil: '‰', prime: '′', Prime: '″', lsaquo: '‹', rsaquo: '›',
  oline: '‾', frasl: '⁄', euro: '€', trade: '™', minus: '−', lowast: '∗',
  radic: '√', prop: '∝', infin: '∞', ang: '∠', and: '∧', or: '∨', cap: '∩',
  cup: '∪', int: '∫', there4: '∴', sim: '∼', cong: '≅', asymp: '≈', ne: '≠',
  equiv: '≡', le: '≤', ge: '≥', sub: '⊂', sup: '⊃', nsub: '⊄', sube: '⊆',
  supe: '⊇', oplus: '⊕', otimes: '⊗', perp: '⊥', sdot: '⋅',
  larr: '←', uarr: '↑', rarr: '→', darr: '↓', harr: '↔', crarr: '↵',
  lArr: '⇐', uArr: '⇑', rArr: '⇒', dArr: '⇓', hArr: '⇔',
  lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
  loz: '◊', spades: '♠', clubs: '♣', hearts: '♥', diams: '♦',
  star: '☆', check: '✓', cross: '✗',
};

/** Decodes numeric and named character references. Safe on strings with no
 *  `&` (fast path) and leaves unknown references untouched rather than
 *  mangling them. */
export function decodeEntities(str) {
  if (!str || str.indexOf('&') === -1) return str;
  return str.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);?/g, (whole, code) => {
    if (code[0] === '#') {
      const hex = code[1] === 'x' || code[1] === 'X';
      const cp = hex ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return whole;
      }
    }
    const hit = NAMED_ENTITIES[code];
    return hit === undefined ? whole : hit;
  });
}

/** Parses an attribute string into a lowercase-keyed object, decoding entity
 *  references in the values — an undecoded `&amp;` in an href is a URL that
 *  resolves to a different page than the one a visitor clicks. */
export function parseAttrs(attrString) {
  const attrs = {};
  if (!attrString) return attrs;
  const re = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(attrString))) {
    const name = m[1].toLowerCase();
    const raw = m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5] !== undefined ? m[5] : '';
    attrs[name] = decodeEntities(raw);
  }
  return attrs;
}

function findTagEnd(html, from) {
  let i = from;
  let quote = null;
  while (i < html.length) {
    const c = html[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '>') {
      return i;
    }
    i++;
  }
  return -1;
}

/**
 * Drives `walker` (openTag(name, attrs, selfClosing) / text(str) / closeTag(name))
 * over raw HTML. Comments, doctypes and raw-text element contents never reach
 * `walker.text`.
 */
export function tokenize(html, walker) {
  const len = html.length;
  let i = 0;
  const openStack = [];

  const emitText = (raw) => {
    if (raw.length === 0) return;
    walker.text(decodeEntities(raw));
  };

  while (i < len) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      emitText(html.slice(i));
      break;
    }
    if (lt > i) emitText(html.slice(i, lt));

    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    if (html.startsWith('<!', lt)) {
      const end = html.indexOf('>', lt + 2);
      i = end === -1 ? len : end + 1;
      continue;
    }
    if (html.startsWith('</', lt)) {
      const end = html.indexOf('>', lt + 2);
      if (end === -1) { i = len; continue; }
      const name = html.slice(lt + 2, end).trim().split(/[\s/]/)[0].toLowerCase();
      const idx = openStack.lastIndexOf(name);
      if (idx !== -1) {
        for (let k = openStack.length - 1; k >= idx; k--) walker.closeTag(openStack[k]);
        openStack.length = idx;
      }
      i = end + 1;
      continue;
    }

    const end = findTagEnd(html, lt + 1);
    if (end === -1) { i = len; continue; }
    const raw = html.slice(lt + 1, end);
    const nameMatch = raw.match(/^([a-zA-Z][-a-zA-Z0-9]*)/);
    if (!nameMatch) { i = end + 1; continue; }
    const name = nameMatch[1].toLowerCase();
    const rest = raw.slice(nameMatch[1].length);
    const selfClosing = /\/\s*$/.test(rest) || VOID_ELEMENTS.has(name);
    const attrs = parseAttrs(rest);

    walker.openTag(name, attrs, selfClosing);

    if (RAW_TEXT_ELEMENTS.has(name) && !selfClosing) {
      const closeRe = new RegExp(`</${name}\\s*>`, 'i');
      const m = closeRe.exec(html.slice(end + 1));
      const rawEnd = m ? end + 1 + m.index : len;
      // Raw-element content is never page text; we do not emit it at all.
      walker.closeTag(name);
      i = m ? rawEnd + m[0].length : len;
      continue;
    }

    if (!selfClosing) openStack.push(name);
    else walker.closeTag(name); // synthetic close keeps the accumulator's stack symmetric
    i = end + 1;
  }

  for (let k = openStack.length - 1; k >= 0; k--) walker.closeTag(openStack[k]);
}

/** One canonical whitespace rule, used for every text channel. Because page
 *  text, block text, heading text and link labels all pass through this and
 *  all receive the same separator events, every block's text is a substring of
 *  its page's text — which is exactly what the validator's character-exact
 *  quote check depends on. */
export function collapseWs(s) {
  return s.replace(/\s+/g, ' ').trim();
}
