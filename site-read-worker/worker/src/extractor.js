// ---------------------------------------------------------------------------
// EXTRACTOR — HTML -> one page's facts: verbatim text, ordered blocks[], links.
//
// The block list is the load-bearing output. v4 tells the model that block
// order is the ONLY authority on what a visitor meets and in what order ("You
// never establish placement"), so a wrong block order is a wrong read that the
// owner will catch instantly.
//
// Every text channel (page text, block text, heading text, link label) is fed
// by the same _push/_sep pair and collapsed by the same rule, which gives one
// invariant the validator leans on: every block's text is a substring of its
// page's text. test/test-fixtures.mjs asserts it.
// ---------------------------------------------------------------------------

import { tokenize, collapseWs } from './html.js';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// Tags that end one visual block and begin another. Inline tags are absent on
// purpose: <b>, <em>, <span>, <a> must stay glued so "Inline <b>bo</b>ld"
// reads "Inline bold" and not "Inline bo ld".
const BLOCKISH = new Set([
  'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figcaption',
  'td', 'th', 'dd', 'dt', 'summary', 'caption', 'div', 'section', 'article',
  'header', 'footer', 'nav', 'main', 'aside', 'ul', 'ol', 'dl', 'table',
  'form', 'figure', 'button', 'address', 'pre',
]);

// <br> and <hr> separate lines WITHOUT ending the block. Treating <br> as a
// block boundary split "<h1>You run the business.<br>You do the work.</h1>"
// into a heading plus a stray text block, which then made the computed
// first-screen headline half of the real headline — the single most damaging
// thing to get wrong, because the owner knows their front page by heart.
const LINE_BREAK_TAGS = new Set(['br', 'hr']);

// Subtrees whose text is never rendered to a visitor.
const SUPPRESSED_SUBTREES = new Set(['template', 'svg', 'math', 'select', 'datalist']);

const EMBED_HOSTS = [
  { match: /instagram\.com/i, platform: 'instagram' },
  { match: /(youtube\.com|youtube-nocookie\.com|youtu\.be)/i, platform: 'youtube' },
  { match: /substack\.com/i, platform: 'substack' },
  { match: /(calendly\.com|cal\.com|acuityscheduling\.com|squareup\.com\/appointments)/i, platform: 'calendar' },
  { match: /(eventbrite\.com|meetup\.com)/i, platform: 'calendar' },
  { match: /(spotify\.com|soundcloud\.com)/i, platform: 'audio' },
  { match: /vimeo\.com/i, platform: 'vimeo' },
  { match: /(twitter\.com|x\.com)/i, platform: 'twitter' },
  { match: /(typeform\.com|airtable\.com|tally\.so|jotform\.com|google\.com\/forms)/i, platform: 'form' },
  { match: /(tiktok\.com)/i, platform: 'tiktok' },
];

const SOCIAL_HOSTS = [
  { match: /instagram\.com/i, platform: 'instagram' },
  { match: /(twitter\.com|x\.com)/i, platform: 'twitter' },
  { match: /linkedin\.com/i, platform: 'linkedin' },
  { match: /facebook\.com/i, platform: 'facebook' },
  { match: /(youtube\.com|youtu\.be)/i, platform: 'youtube' },
  { match: /tiktok\.com/i, platform: 'tiktok' },
  { match: /substack\.com/i, platform: 'substack' },
  { match: /vimeo\.com/i, platform: 'vimeo' },
  { match: /threads\.net/i, platform: 'threads' },
  { match: /pinterest\./i, platform: 'pinterest' },
  { match: /medium\.com/i, platform: 'medium' },
  { match: /spotify\.com/i, platform: 'spotify' },
];

const CTA_LABEL = /\b(book|booking|enquire|inquire|inquiry|contact|get in touch|work with|start|apply|schedule|subscribe|join|sign up|register|buy|order|download|watch|listen|read more|learn more|see the|view the|let's talk|say hello|hire)\b/i;
const BUTTONISH_CLASS = /(^|[\s_-])(btn|button|cta|sqs-block-button-element)([\s_-]|$)/i;
const SKIP_LINK = /^skip\b/i;

function isHiddenAttrs(attrs) {
  if (!attrs) return false;
  if ('hidden' in attrs) return true;
  if ((attrs['aria-hidden'] || '').toLowerCase() === 'true') return true;
  const cls = (attrs.class || '').toLowerCase();
  if (/(^|\s)(sr-only|visually-hidden|visuallyhidden|screen-reader-text|screen-reader-only|u-hidden-visually|hidden)(\s|$)/.test(cls)) return true;
  const style = (attrs.style || '').toLowerCase().replace(/\s+/g, '');
  if (/display:none/.test(style) || /visibility:hidden/.test(style)) return true;
  return false;
}

export function resolveUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/** Dedupe key. Keeps the fragment: on a one-page site the whole menu is
 *  fragments, and stripping them collapsed "Home / The Work / Research /
 *  About" into a single door named wrongly. */
export function destinationKey(href) {
  if (!href) return '';
  try {
    const u = new URL(href);
    let path = u.pathname;
    if (path.length > 1) path = path.replace(/\/$/, '');
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}${u.hash}`;
  } catch {
    return href.replace(/\/$/, '');
  }
}

function matchHost(list, url) {
  if (!url) return null;
  for (const h of list) if (h.match.test(url)) return h;
  return null;
}

function isThirdParty(src, pageUrl) {
  try {
    const u = new URL(src, pageUrl);
    const base = new URL(pageUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return u.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

class PageAccumulator {
  constructor(pageLabel, pageUrl) {
    this.page = pageLabel;
    this.url = pageUrl;
    this.stack = [];
    this.textParts = [];
    this.blocks = [];
    this.links = [];

    this._pending = null;   // {kind:'text'|'heading'|'button', level?, parts:[]}
    this._anchor = null;    // {href, attrs, parts, altParts, location, isButton, depth}
    this._region = null;    // {type:'nav'|'footer'|'form', depth, parts:[], items}
    this._figure = null;    // {depth, captionParts:[], members:[]}
    this._embed = null;     // {depth, platform, src, captions:[]}
    this._lastAnchorEndAt = -1; // textParts length when the last </a> closed
  }

  _ancestor(pred) {
    for (let k = this.stack.length - 1; k >= 0; k--) if (pred(this.stack[k])) return true;
    return false;
  }

  _hiddenNow() {
    return this._ancestor((e) => e.hidden);
  }

  _suppressed() {
    return this._ancestor((e) => SUPPRESSED_SUBTREES.has(e.name));
  }

  _inFigcaption() {
    return this._ancestor((e) => e.name === 'figcaption');
  }

  _location() {
    if (this._ancestor((e) => e.name === 'footer' || (e.attrs && (e.attrs.role || '').toLowerCase() === 'contentinfo')) ) return 'footer';
    if (this._ancestor((e) => e.name === 'nav' || e.name === 'header' || (e.attrs && (e.attrs.role || '').toLowerCase() === 'navigation'))) return 'nav';
    return 'body';
  }

  _push(str) {
    this.textParts.push(str);
    if (this._pending) this._pending.parts.push(str);
    if (this._anchor) this._anchor.parts.push(str);
    if (this._embed) this._embed.captions.push(str);
    if (this._figure && this._inFigcaption()) this._figure.captionParts.push(str);
  }

  /** A block boundary. Without this, "You run the business.</h1><h2>You do the
   *  work." came out glued as one sentence — a quote of the headline as
   *  displayed then failed the character-exact check, and a quote of the glued
   *  form rendered a typo to the visitor. */
  _sep() {
    if (this._hiddenNow() || this._suppressed()) return;
    const last = this.textParts[this.textParts.length - 1];
    if (last !== ' ') this._push(' ');
  }

  _flushPending() {
    const p = this._pending;
    if (!p) return;
    // A button anchor owns its own text until the anchor closes; flushing it
    // early would render the button's label twice (once as a text block, once
    // as the button block).
    if (p.kind === 'button_anchor' && this._anchor) return;
    this._pending = null;
    const text = collapseWs(p.parts.join(''));
    if (!text) return;
    if (this._region) {
      this._region.parts.push(text);
      return;
    }
    if (p.kind === 'heading') this.blocks.push({ type: 'heading', level: p.level, text });
    else if (p.kind === 'button' || p.kind === 'button_anchor') this.blocks.push({ type: 'button', text });
    else this.blocks.push({ type: 'text', text });
  }

  _emitBlock(block) {
    if (this._region) {
      this._region.items += 1;
      return null;
    }
    this.blocks.push(block);
    return block;
  }

  openTag(name, attrs, selfClosing) {
    const hidden = this._hiddenNow() || isHiddenAttrs(attrs);
    const entry = { name, attrs, hidden };
    if (!selfClosing) this.stack.push(entry);
    if (hidden || this._suppressed() || SUPPRESSED_SUBTREES.has(name)) return;

    if (LINE_BREAK_TAGS.has(name)) {
      this._sep();
      return;
    }
    if (BLOCKISH.has(name)) {
      this._flushPending();
      this._sep();
    }

    const role = (attrs.role || '').toLowerCase();

    // Regions: the menu strip, the footer strip and a form are each ONE thing a
    // visitor meets, not twenty text blocks. Their inner text does not emit
    // separate blocks; it rolls up into the region block.
    if (!this._region) {
      if (name === 'nav' || role === 'navigation') this._region = { type: 'nav', depth: this.stack.length, parts: [], items: 0 };
      else if (name === 'footer' || role === 'contentinfo') this._region = { type: 'footer', depth: this.stack.length, parts: [], items: 0 };
      else if (name === 'form') this._region = { type: 'form', depth: this.stack.length, parts: [], items: 0 };
    }

    if (name === 'figure' && !this._figure) {
      this._figure = { depth: this.stack.length, captionParts: [], members: [] };
    }

    if (HEADING_TAGS.has(name)) {
      this._pending = { kind: 'heading', level: Number(name[1]), parts: [] };
      return;
    }

    if (name === 'button') {
      this._flushPending();
      this._pending = { kind: 'button', parts: [] };
      return;
    }

    if (name === 'input' || name === 'select' || name === 'textarea') {
      if (this._region && this._region.type === 'form') this._region.items += 1;
      const t = (attrs.type || '').toLowerCase();
      if (name === 'input' && (t === 'submit' || t === 'button')) {
        this._flushPending();
        this._emitBlock({ type: 'button', text: collapseWs(attrs.value || 'Submit') });
      }
      return;
    }

    if (name === 'img') {
      const alt = collapseWs(attrs.alt || '');
      const src = attrs.src || attrs['data-src'] || '';
      if (this._anchor && alt) this._anchor.altParts.push(alt);
      // An image inside a link to a social platform is the platform's icon.
      // Emitting it as an image block turns a row of social badges into a
      // "gallery of three" — and a gallery is content a lane may not be called
      // empty without checking, so a fake one is a fabricated counterexample.
      if (this._anchor && matchHost(SOCIAL_HOSTS, resolveUrl(this.url, this._anchor.href) || this._anchor.href)) return;
      this._flushPending();
      const b = this._emitBlock({ type: 'image', alt, src });
      if (b && this._figure) this._figure.members.push(b);
      return;
    }

    if (name === 'iframe') {
      const src = attrs.src || attrs['data-src'] || '';
      const host = matchHost(EMBED_HOSTS, src);
      if (src && (host || isThirdParty(src, this.url))) {
        this._flushPending();
        this._embed = {
          depth: this.stack.length,
          platform: host ? host.platform : 'other',
          src,
          captions: attrs.title ? [collapseWs(attrs.title)] : [],
          selfClosing,
        };
        if (selfClosing) this._closeEmbed();
      }
      return;
    }

    if (name === 'blockquote') {
      const cls = (attrs.class || '').toLowerCase();
      if (/instagram-media|tiktok-embed|twitter-tweet/.test(cls)) {
        this._flushPending();
        const platform = /instagram/.test(cls) ? 'instagram' : /tiktok/.test(cls) ? 'tiktok' : 'twitter';
        this._embed = {
          depth: this.stack.length,
          platform,
          src: attrs['data-instgrm-permalink'] || attrs.cite || '',
          captions: [],
        };
      }
      return;
    }

    if (name === 'a' && attrs.href !== undefined) {
      const cls = (attrs.class || '').toLowerCase();
      // Two anchors with nothing between them are two doors, not one word.
      // A browser renders "<a>Privacy</a><a>Contact</a>" glued, but a footer
      // row is laid out as separate targets, and "PrivacyContact" is a string
      // the model could quote back to a visitor as if it were on the page.
      // Scoped to anchor-follows-anchor so an inline link inside a sentence
      // ("the <a>Village</a>.") still keeps its punctuation attached.
      if (this._lastAnchorEndAt === this.textParts.length) this._sep();
      const isButton = BUTTONISH_CLASS.test(cls) || role === 'button';
      if (isButton) {
        this._flushPending();
        this._pending = { kind: 'button_anchor', parts: [] };
      }
      this._anchor = {
        href: attrs.href,
        attrs,
        parts: [],
        altParts: [],
        location: this._location(),
        isButton,
        depth: this.stack.length,
      };
    }
  }

  text(str) {
    if (!str) return;
    if (this._hiddenNow() || this._suppressed()) return;
    if (!this._pending) this._pending = { kind: 'text', parts: [] };
    this._push(str);
  }

  _closeEmbed() {
    const e = this._embed;
    this._embed = null;
    if (!e) return;
    const captions = e.captions
      .map((c) => collapseWs(c))
      .filter(Boolean)
      .slice(0, 6);
    const b = this._emitBlock({
      type: 'embed',
      platform: e.platform,
      src: e.src,
      item_count: 1,
      sample_captions: captions,
    });
    if (b && this._figure) this._figure.members.push(b);
  }

  closeTag(name) {
    const wasSuppressed = this._suppressed();
    if (this.stack.length && this.stack[this.stack.length - 1].name === name) this.stack.pop();
    if (wasSuppressed && this._suppressed()) return;

    if (HEADING_TAGS.has(name) && this._pending && this._pending.kind === 'heading') this._flushPending();
    if (name === 'button' && this._pending && this._pending.kind === 'button') this._flushPending();

    if (name === 'a' && this._anchor) this._finishAnchor();

    if (this._embed && this.stack.length < this._embed.depth) this._closeEmbed();

    if (this._figure && this.stack.length < this._figure.depth) {
      const caps = collapseWs(this._figure.captionParts.join(''));
      if (caps) {
        for (const m of this._figure.members) {
          if (m.type === 'embed') m.sample_captions = [...(m.sample_captions || []), caps].slice(0, 6);
        }
      }
      this._figure = null;
    }

    if (this._region && this.stack.length < this._region.depth) {
      const r = this._region;
      this._region = null;
      this._flushPending();
      const text = collapseWs(r.parts.join(' '));
      const itemCount = r.type === 'form'
        ? r.items
        : this.links.filter((l) => l.location === (r.type === 'form' ? 'body' : r.type)).length;
      if (text || itemCount) {
        this.blocks.push({ type: r.type, text, item_count: itemCount });
      }
    }

    if (BLOCKISH.has(name)) {
      this._flushPending();
      this._sep();
    }
  }

  _finishAnchor() {
    const a = this._anchor;
    this._anchor = null;
    this._lastAnchorEndAt = this.textParts.length;
    const raw = (a.href || '').trim();
    const label =
      collapseWs(a.parts.join('')) ||
      collapseWs(a.altParts.join(' ')) ||
      collapseWs(a.attrs['aria-label'] || '') ||
      collapseWs(a.attrs.title || '');

    // An anchor with no visible label is not a door a visitor can read. Keeping
    // them inflated one site's inventory from 9 real doors to 23 "links", and
    // that count then fed the number-grounding check as a fabricated fact.
    if (!label) return;

    const resolved = raw ? resolveUrl(this.url, raw) : null;
    const isDropdownParent =
      raw === '' || raw === '#' || /^javascript:/i.test(raw) ||
      ['true', 'menu', 'listbox'].includes((a.attrs['aria-haspopup'] || '').toLowerCase());
    const isSkip = SKIP_LINK.test(label) || /#(main|content|page|skip)/i.test(raw);
    const social = matchHost(SOCIAL_HOSTS, resolved || raw);

    const link = {
      label,
      href: resolved || raw,
      location: a.location,
      kind: isSkip ? 'skip' : isDropdownParent ? 'dropdown_parent' : 'door',
      is_social: !!social,
      social_platform: social ? social.platform : null,
      is_cta: a.isButton || (a.location === 'body' && CTA_LABEL.test(label)),
      page: this.page,
      _block: null,
    };

    if (a.isButton) {
      this._pending = null; // its text belongs to the button block, not a text block
      if (!isDropdownParent) {
        link._block = this._emitBlock({ type: 'button', text: label, href: resolved || raw });
      }
    }
    this.links.push(link);
  }

  finish() {
    this._flushPending();

    // Collapse runs of adjacent image blocks into one gallery block. A wall of
    // thumbnails is one thing a visitor meets, and v4 asks for item_count +
    // sample_captions on it — telling someone their feed is nowhere on their
    // site while the front page is a wall of it is the single most damaging
    // error this read can make.
    const collapsed = [];
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (b.type !== 'image') { collapsed.push(b); continue; }
      let j = i;
      while (j + 1 < this.blocks.length && this.blocks[j + 1].type === 'image') j++;
      const run = this.blocks.slice(i, j + 1);
      if (run.length >= 3) {
        collapsed.push({
          type: 'gallery',
          item_count: run.length,
          sample_captions: run.map((r) => r.alt).filter(Boolean).slice(0, 6),
        });
        i = j;
      } else {
        collapsed.push(...run);
        i = j;
      }
    }

    collapsed.forEach((b, i) => { b.index = i + 1; });

    const ordered = collapsed.map((b) => {
      const out = { index: b.index, type: b.type };
      if (b.level !== undefined) out.level = b.level;
      if (b.text !== undefined && b.text !== '') out.text = b.text;
      if (b.alt !== undefined) out.alt = b.alt;
      if (b.src) out.src = b.src;
      if (b.href) out.href = b.href;
      if (b.platform) out.platform = b.platform;
      if (b.item_count !== undefined) out.item_count = b.item_count;
      if (b.sample_captions !== undefined) out.sample_captions = b.sample_captions;
      return out;
    });

    // Dedupe links per location, keying on the destination INCLUDING its
    // fragment so a one-page site's anchor menu stays four doors, not one.
    const seen = new Set();
    const links = [];
    for (const l of this.links) {
      const key = `${l.location}|${l.kind}|${destinationKey(l.href)}|${l.kind === 'dropdown_parent' ? l.label : ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        label: l.label,
        href: l.href,
        location: l.location,
        kind: l.kind,
        is_social: l.is_social,
        social_platform: l.social_platform,
        is_cta: l.is_cta,
        page: l.page,
        block_index: l._block ? l._block.index : null,
      });
    }

    const text = collapseWs(this.textParts.join(''));
    const firstHeading = ordered.find((b) => b.type === 'heading' && b.text);

    return {
      page: this.page,
      url: this.url,
      text,
      blocks: ordered,
      // Not part of the fact sheet handed to the model — used by the fact-sheet
      // assembler to build link_inventory and embedded_feeds.
      _links: links,
      _first_heading: firstHeading ? { text: firstHeading.text, block_index: firstHeading.index } : null,
      _word_count: text ? text.split(/\s+/).filter(Boolean).length : 0,
    };
  }
}

/** Parses one page of HTML into its facts. Synchronous and pure. */
export function extractPage(html, pageLabel, pageUrl) {
  const acc = new PageAccumulator(pageLabel, pageUrl);
  tokenize(html, acc);
  return acc.finish();
}

export { PageAccumulator, isHiddenAttrs, SOCIAL_HOSTS };
