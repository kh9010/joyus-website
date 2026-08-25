// ---------------------------------------------------------------------------
// VALIDATOR — deterministic, post-model. Nothing here is a judgment call.
// Every check is a count, a set comparison, or a literal substring test, and
// each maps to a specific line of ../analysis-prompt-writer.md.
//
// In v5 this validates the ASSEMBLED read — the writer's prose grafted onto the
// outline's evidence. Everything about the outline is checked in
// outlineValidator.js against the fact sheet, before the writer ever runs, and
// everything about the prose against the outline is checked in containment.js.
// This file owns the mechanical limits on the rendered prose.
//
// The prompt splits the labour explicitly: "Mechanical limits on your output — quote
// counts, sentence lengths, antithesis caps, banned strings, word count — are
// checked by a validator after you emit." This file is that validator, so the
// model can spend its whole final pass on whether the sentences are TRUE.
//
// Two deliberate departures from the pipelines this was merged from:
//
//   1. The banned-string sweep is word-boundary, not substring. A lowercased
//      `includes()` on "arc" flags research, search, architecture and March —
//      on a site about research that fails both attempts every time and forces
//      the fail-safe decline. Same class of bug for "lane" (Melanie), "just"
//      (adjust) and "pieces".
//   2. Number grounding never reads the model's own `self_check`. Folding the
//      model's self-reported counts into the whitelist means a model that
//      writes "nine doors" in prose and 9 in self_check passes its own
//      fabrication guard. Numbers are grounded against re-derived counts only.
// ---------------------------------------------------------------------------

import { LANES } from './types.js';

// --- banned vocabulary ------------------------------------------------------
// All from v4's VOICE section. Machinery and self-reference are the words that
// make a read sound like an audit; hedges and metaphors are the house style.

const BANNED_MACHINERY = [
  'fetch', 'fetched', 'crawl', 'crawled', 'extracted', 'evidence', 'exhibit',
  'lane', 'lanes', 'verdict', 'verdicts', 'scored', 'block', 'blocks', 'index',
  'leaf', 'folder', 'node', 'outbound', 'nav entry', 'equally weighted',
  'this read', 'the skim',
];
const BANNED_SELF_REFERENCE = [
  'finding', 'findings', 'tested', 'weighed', 'reckoning', 'folds into',
  'covered', 'on its own', 'separately', 'as noted',
];
const BANNED_HEDGES = ['just', 'really', 'actually', 'kind of', 'sort of', 'a bit', 'quite', 'perhaps', 'roughly'];
const BANNED_METAPHORS = [
  'pieces', 'container', 'ecosystem', 'infrastructure', 'arc', 'destination',
  'superpower', 'rhythm', 'compounds over time', 'move the needle',
  'at the heart of', "in today's world",
];
const BANNED_FRAMES = [
  'what makes you singular', "here's what we won't pretend", 'the honest truth',
  'let me be real', 'here is the one thing', 'if i had to say one thing', 'the truth is',
];
const BANNED_HOUSE_CADENCES = [
  /none of it reaches the front page/i,
  /you have to already know to click/i,
];
const BANNED_IN_BRIDGE = [
  'joyus', 'price', 'pricing', 'duration', 'deliverable', 'deliverables',
  'it is the difference between', "it's the difference between", 'you already have',
];

export const NUMBER_WORDS = {
  three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

const ABSENCE_MARKERS = /\b(the only|the first|the last|none|never|not one|nothing|nowhere|no one)\b/i;

// --- small helpers ----------------------------------------------------------

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeQuotes(s) {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function wordsOf(text) {
  return String(text || '').split(/\s+/).filter(Boolean);
}

function wordCount(text) {
  return wordsOf(text).length;
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"'“‘])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function count(text, re) {
  const m = String(text || '').match(re);
  return m ? m.length : 0;
}

function ngrams(text, n) {
  const words = String(text || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= words.length; i++) set.add(words.slice(i, i + n).join(' '));
  return set;
}

function v(list, code, message, path) {
  list.push(path ? { code, message, path } : { code, message });
}

function isRead(out) {
  return out && out.status === 'read';
}

// --- rendered prose ---------------------------------------------------------
// Exactly what the render plan lists: opening, skim observations, gap block,
// lane evidence, the one bold line, strongest_true_thing, bridge — in plan
// order, and NOTHING after the bridge. Coverage is chrome and is deliberately
// not included. There is no one_cut: the synthesis slot was removed in 5.2,
// because a sentence built to draw together what came before cannot do anything
// but repeat it.

export function assembleRenderedProse(out) {
  if (!out) return '';
  if (!isRead(out)) {
    return out.decline ? `${out.decline.observation || ''} ${out.decline.redirect || ''}`.trim() : '';
  }
  const parts = [];
  if (out.opening && out.opening.text) parts.push(out.opening.text);
  if (out.skim_read) {
    for (const key of ['positioning_legibility', 'tangibles', 'entry_point', 'delivered_vs_handheld']) {
      const item = out.skim_read[key];
      if (item && item.observation) parts.push(item.observation);
    }
  }
  if (out.gap) {
    if (out.gap.what_you_have) parts.push(out.gap.what_you_have);
    if (out.gap.what_a_stranger_gets) parts.push(out.gap.what_a_stranger_gets);
  }
  for (const lv of out.lane_verdicts || []) {
    if (lv.evidence) parts.push(lv.evidence);
    if (lv.bold_line) parts.push(lv.bold_line);
  }
  if (out.strongest_true_thing && out.strongest_true_thing.text) parts.push(out.strongest_true_thing.text);
  if (out.bridge && out.bridge.text) parts.push(out.bridge.text);
  return parts.join(' ');
}

// --- individual checks ------------------------------------------------------

function checkStatusAndPresence(out, violations) {
  // 'decline_incomplete' is pipeline-only: it is not in the model's tool schema,
  // so the model cannot emit it. It is the fail-safe's status, and it is
  // validated here so the fail-safe copy is held to the same 25-50 word rule.
  const valid = ['read', 'decline_product_company', 'decline_thin', 'decline_unfetchable', 'decline_incomplete'];
  if (!out || typeof out !== 'object') {
    v(violations, 'not_an_object', 'Model output is not a JSON object.');
    return;
  }
  if (!valid.includes(out.status)) {
    v(violations, 'unrecognized_status', `status must be one of ${valid.join(', ')}; got ${JSON.stringify(out.status)}.`, 'status');
    return;
  }
  if (typeof out.schema_version !== 'string' || !out.schema_version) {
    v(violations, 'missing_schema_version', 'schema_version is required.', 'schema_version');
  }
  if (typeof out.site_url !== 'string' || !out.site_url) {
    v(violations, 'missing_site_url', 'site_url is required.', 'site_url');
  }

  if (!isRead(out)) {
    if (!out.decline || !out.decline.observation || !out.decline.redirect) {
      v(violations, 'decline_missing_fields', 'A decline must carry both observation and redirect.', 'decline');
      return;
    }
    const wc = wordCount(`${out.decline.observation} ${out.decline.redirect}`);
    if (wc < 25 || wc > 50) {
      v(violations, 'decline_word_count_out_of_range', `Decline is ${wc} words; must be 25-50.`, 'decline');
    }
    if (out.status === 'decline_unfetchable') {
      const diag = /\b(status code|http|403|404|500|firewall|bot|blocker|server|dns|ssl|certificate|cloudflare|robots)\b/i;
      if (diag.test(`${out.decline.observation} ${out.decline.redirect}`)) {
        v(violations, 'unfetchable_decline_diagnoses', 'The unfetchable decline names server behaviour; v4 forbids diagnosing.', 'decline');
      }
    }
    return;
  }

  for (const field of ['opening', 'skim_read', 'gap', 'lane_selection', 'coverage', 'bridge', 'self_check']) {
    if (out[field] === null || out[field] === undefined) {
      v(violations, 'missing_required_block', `"${field}" is required when status is "read".`, field);
    }
  }
  if (!Array.isArray(out.lane_verdicts) || out.lane_verdicts.length === 0) {
    v(violations, 'missing_lane_verdicts', 'lane_verdicts is required when status is "read".', 'lane_verdicts');
  }
  if (out.decline) {
    v(violations, 'read_carries_decline', 'A read must not also carry a decline block.', 'decline');
  }
}

function checkShapeDirective(out, fs, violations) {
  if (!isRead(out)) return;
  const want = fs.shape_directive || {};
  const used = out.shape_directive_used;
  if (!used) {
    v(violations, 'missing_shape_directive_used', 'shape_directive_used must echo the assigned directive.', 'shape_directive_used');
  } else {
    for (const key of ['opening_shape', 'bridge_move']) {
      if (used[key] !== want[key]) {
        v(violations, 'shape_directive_not_echoed', `shape_directive_used.${key} is "${used[key]}"; assigned "${want[key]}".`, 'shape_directive_used');
      }
    }
  }
  const conflictSlot = out.self_check && out.self_check.shape_conflict ? out.self_check.shape_conflict.slot : null;
  if (out.opening && out.opening.shape !== want.opening_shape && conflictSlot !== 'opening') {
    v(violations, 'opening_shape_mismatch', `opening.shape is "${out.opening.shape}"; the assigned opening shape is "${want.opening_shape}".`, 'opening');
  }
  if (out.bridge && out.bridge.move !== want.bridge_move && conflictSlot !== 'bridge') {
    v(violations, 'bridge_move_mismatch', `bridge.move is "${out.bridge.move}"; the assigned bridge move is "${want.bridge_move}".`, 'bridge');
  }
}

function pageMaps(fs) {
  const text = new Map();
  const blockIdx = new Map();
  for (const p of fs.pages || []) {
    text.set(p.page, p.text || '');
    blockIdx.set(p.page, new Set((p.blocks || []).map((b) => b.index)));
  }
  const fetched = new Set((fs.fetch_record || []).filter((r) => r.fetched).map((r) => r.page));
  return { text, blockIdx, fetched };
}

function checkExhibit(ex, path, maps, violations, opts = {}) {
  if (ex === null || ex === undefined) {
    if (opts.required) v(violations, 'missing_exhibit', `${path} requires an exhibit.`, path);
    return;
  }
  const hasQuote = typeof ex.quote === 'string' && ex.quote.length > 0;
  const hasRef = typeof ex.reference === 'string' && ex.reference.length > 0;
  if (hasQuote === hasRef) {
    v(violations, 'exhibit_quote_or_reference', 'An exhibit carries exactly one of quote or reference.', path);
  }
  if (!ex.page) {
    v(violations, 'exhibit_missing_page', 'An exhibit must name the page it came from.', path);
    return;
  }
  if (!maps.fetched.has(ex.page)) {
    v(violations, 'exhibit_page_not_fetched', `Exhibit cites page "${ex.page}", which was not retrieved.`, path);
    return;
  }
  if (opts.homepageOnly && ex.page !== 'homepage') {
    v(violations, 'skim_exhibit_off_homepage', `Skim exhibits are scored against the homepage alone; this one cites "${ex.page}".`, path);
  }
  if (hasQuote) {
    const text = maps.text.get(ex.page) || '';
    if (!text.includes(ex.quote)) {
      v(violations, 'quote_not_exact', `Quote is not a character-exact substring of "${ex.page}": ${JSON.stringify(ex.quote.slice(0, 90))}`, path);
    }
    if (!ex.speaker) {
      v(violations, 'exhibit_missing_speaker', 'A quoted exhibit must name who is speaking.', path);
    }
  }
  if (ex.block_index !== null && ex.block_index !== undefined) {
    const known = maps.blockIdx.get(ex.page);
    if (known && !known.has(ex.block_index)) {
      v(violations, 'exhibit_block_index_unknown', `block_index ${ex.block_index} does not exist on page "${ex.page}".`, path);
    }
  }
}

function checkEvidence(out, fs, violations) {
  const maps = pageMaps(fs);
  if (!isRead(out)) {
    if (out.decline && out.decline.exhibit) checkExhibit(out.decline.exhibit, 'decline.exhibit', maps, violations);
    return;
  }

  if (out.skim_read) {
    // Three thirty-word observations plus four forty-five-word finding units
    // plus the fixed blocks does not fit inside 400 words at four.
    const populated = ['positioning_legibility', 'tangibles', 'entry_point', 'delivered_vs_handheld']
      .filter((k) => out.skim_read[k]);
    if (populated.length > 3) {
      v(violations, 'too_many_skim_observations', `${populated.length} skim observations; at most three at this budget.`, 'skim_read');
    }
    for (const key of ['positioning_legibility', 'tangibles', 'entry_point', 'delivered_vs_handheld']) {
      const item = out.skim_read[key];
      if (!item) continue;
      checkExhibit(item.exhibit, `skim_read.${key}.exhibit`, maps, violations, {
        required: key === 'positioning_legibility',
        homepageOnly: true,
      });
      if (item.observation && wordCount(item.observation) > 30) {
        v(violations, 'skim_observation_too_long', `skim_read.${key} is ${wordCount(item.observation)} words; each skim observation stays under 30.`, `skim_read.${key}`);
      }
    }

    // STEP 1: the first-screen headline is computed for the model. It may not
    // substitute a better one, and its positioning observation must contain it.
    const fsHead = fs.first_screen_headline ? fs.first_screen_headline.text : null;
    const used = out.skim_read.first_screen_headline_used;
    if (fsHead === null && used) {
      v(violations, 'first_screen_headline_invented', 'The fact sheet carries no first-screen headline, but one was reported.', 'skim_read.first_screen_headline_used');
    } else if (fsHead && used !== fsHead) {
      v(violations, 'first_screen_headline_mismatch', `first_screen_headline_used must be the computed string ${JSON.stringify(fsHead)}.`, 'skim_read.first_screen_headline_used');
    }
    const pl = out.skim_read.positioning_legibility;
    // Carve-out: a headline too long to sit inside a sub-40-word observation
    // cannot be required to appear verbatim in one.
    if (fsHead && wordCount(fsHead) <= 20 && pl && pl.observation && !pl.observation.includes(fsHead)) {
      v(violations, 'positioning_missing_headline', 'positioning_legibility must contain the verbatim first-screen headline.', 'skim_read.positioning_legibility');
    }
  }

  if (out.gap) {
    const facts = out.gap.named_facts;
    if (!Array.isArray(facts) || facts.length < 1) {
      v(violations, 'gap_missing_named_facts', 'gap.named_facts needs at least one entry.', 'gap.named_facts');
    } else {
      facts.forEach((nf, i) => {
        const path = `gap.named_facts[${i}]`;
        if (!nf.page || !maps.fetched.has(nf.page)) {
          v(violations, 'named_fact_page_not_fetched', `named_facts[${i}] cites page "${nf.page}", which was not retrieved.`, path);
          return;
        }
        const text = maps.text.get(nf.page) || '';
        if (!nf.source_sentence || !text.includes(nf.source_sentence)) {
          v(violations, 'named_fact_sentence_not_exact', `named_facts[${i}].source_sentence is not an exact substring of "${nf.page}".`, path);
        }
      });
    }
  }

  for (const [i, lv] of (out.lane_verdicts || []).entries()) {
    // The schema allows a null exhibit on an ABSENT lane and the validator used
    // to demand one on every lane — the two disagreed, and the schema is right.
    // An ABSENT verdict that names the surfaces it searched has said everything
    // it can: there is no sentence to quote, because that is the finding.
    const absentWithSurfaces =
      lv.verdict === 'ABSENT' && Array.isArray(lv.searched) && lv.searched.length > 0;
    checkExhibit(lv.exhibit, `lane_verdicts[${i}].exhibit`, maps, violations, { required: !absentWithSurfaces });
  }
  if (out.strongest_true_thing) {
    checkExhibit(out.strongest_true_thing.exhibit, 'strongest_true_thing.exhibit', maps, violations, { required: true });
  }
}

function checkLanes(out, violations) {
  if (!isRead(out)) return;
  const verdicts = out.lane_verdicts || [];
  const sel = out.lane_selection || {};
  const chosen = Array.isArray(sel.chosen) ? sel.chosen : [];

  if (verdicts.length < 3 || verdicts.length > 5) {
    v(violations, 'lane_count_out_of_range', `${verdicts.length} lanes returned; three to five.`, 'lane_verdicts');
  }
  const seen = new Set();
  for (const lv of verdicts) {
    if (!LANES.includes(lv.lane)) v(violations, 'unknown_lane', `"${lv.lane}" is not one of the six lanes.`, 'lane_verdicts');
    if (seen.has(lv.lane)) v(violations, 'duplicate_lane', `Lane "${lv.lane}" appears twice.`, 'lane_verdicts');
    seen.add(lv.lane);
  }
  const chosenSet = new Set(chosen);
  if (chosen.length !== verdicts.length || [...seen].some((l) => !chosenSet.has(l))) {
    v(violations, 'lane_selection_mismatch', 'lane_selection.chosen and lane_verdicts must name the same lanes.', 'lane_selection.chosen');
  }

  // "If your chosen lanes appear in the order they are listed above, you defaulted."
  if (chosen.length >= 3) {
    const idx = chosen.map((l) => LANES.indexOf(l));
    if (idx.every((n, i) => i === 0 || n > idx[i - 1])) {
      v(violations, 'lane_order_defaulted', 'chosen[] is in the prompt\'s own lane order; order by strength of evidence instead.', 'lane_selection.chosen');
    }
  }

  const rejected = Array.isArray(sel.rejected) ? sel.rejected : [];
  const rejectedNames = new Set(rejected.map((r) => r.lane));
  for (const lane of LANES) {
    if (!chosenSet.has(lane) && !rejectedNames.has(lane)) {
      v(violations, 'lane_not_accounted_for', `Lane "${lane}" is neither chosen nor rejected.`, 'lane_selection.rejected');
    }
  }
  for (const r of rejected) {
    if (!r.reason || /not enough material|no material|insufficient/i.test(r.reason)) {
      v(violations, 'rejection_reason_generic', `Rejection of "${r.lane}" must name what you looked at and what was on it.`, 'lane_selection.rejected');
    }
    if (!Array.isArray(r.surfaces_searched) || r.surfaces_searched.length === 0) {
      v(violations, 'rejection_missing_surfaces', `Rejection of "${r.lane}" names no surfaces searched.`, 'lane_selection.rejected');
    }
  }

  for (const [i, lv] of verdicts.entries()) {
    const path = `lane_verdicts[${i}]`;
    if (lv.verdict === 'DOCUMENTATION' && !lv.buried_on) {
      v(violations, 'documentation_missing_page', `Lane "${lv.lane}" is DOCUMENTATION but does not name the page it sits on.`, path);
    }
    if (lv.verdict === 'ABSENT' && (!Array.isArray(lv.searched) || lv.searched.length === 0)) {
      v(violations, 'absent_missing_searched', `Lane "${lv.lane}" is ABSENT but names no surfaces searched.`, path);
    }
    if (lv.evidence && splitSentences(lv.evidence).length > 3) {
      v(violations, 'lane_evidence_too_long', `Lane "${lv.lane}" runs ${splitSentences(lv.evidence).length} sentences; two to three, no more.`, path);
    }
  }

  const bold = verdicts.filter((lv) => lv.bold_line).map((lv) => lv.bold_line);
  if (bold.length < 1) v(violations, 'missing_bold_line', 'A read with zero bold lines is incomplete.', 'lane_verdicts');
  if (bold.length > 1) {
    v(violations, 'too_many_bold_lines', `${bold.length} bold lines; the plan marks exactly one entry bold and that entry's own sentence is it.`, 'lane_verdicts');
  }
  if (bold.length && !bold.some((b) => wordCount(b) < 15)) {
    v(violations, 'no_short_bold_line', 'At least one bold line must be a standalone sentence under fifteen words.', 'lane_verdicts');
  }

  const anyTransmission = verdicts.some((lv) => lv.verdict === 'TRANSMISSION');
  if (!anyTransmission && (!out.strongest_true_thing || !out.strongest_true_thing.text)) {
    v(violations, 'missing_strongest_true_thing', 'No lane came back TRANSMISSION, so strongest_true_thing is required.', 'strongest_true_thing');
  }
}

function checkCoverage(out, fs, violations) {
  if (!isRead(out)) return;
  const cov = out.coverage;
  if (!cov) return;
  const chosen = (out.lane_selection && out.lane_selection.chosen) || [];
  if (cov.lanes_total !== 6) {
    v(violations, 'coverage_lanes_total', `coverage.lanes_total is ${cov.lanes_total}; there are six lanes.`, 'coverage');
  }
  if (cov.lanes_examined !== chosen.length) {
    v(violations, 'coverage_count_mismatch', `coverage.lanes_examined is ${cov.lanes_examined}; ${chosen.length} lanes were chosen.`, 'coverage');
  }
  const notExamined = Array.isArray(cov.not_examined) ? cov.not_examined : [];
  const expected = LANES.filter((l) => !chosen.includes(l));
  const got = new Set(notExamined.map((n) => n.lane));
  for (const lane of expected) {
    if (!got.has(lane)) v(violations, 'coverage_missing_lane', `coverage.not_examined omits "${lane}".`, 'coverage.not_examined');
  }
  for (const n of notExamined) {
    if (n.reason && wordCount(n.reason) > 12) {
      v(violations, 'coverage_reason_too_long', `coverage reason for "${n.lane}" is ${wordCount(n.reason)} words; twelve at most.`, 'coverage.not_examined');
    }
  }

  // The fetch contract: on a site with fewer than eight doors, an offer-surface
  // page that exists and was not retrieved must be declared.
  const inv = fs.link_inventory || {};
  if ((inv.nav_door_count || 0) < 8) {
    const fetchedPages = new Set((fs.fetch_record || []).filter((r) => r.fetched).map((r) => r.page.toLowerCase()));
    const offerWords = /\b(service|offer|work|project|portfolio|program)/i;
    const missed = (inv.nav_door_labels || []).filter(
      (label) => offerWords.test(label) && !fetchedPages.has(label.toLowerCase()),
    );
    const declared = (cov.unfetched_pages || []).map((s) => String(s).toLowerCase());
    for (const label of missed) {
      if (!declared.some((d) => d.includes(label.toLowerCase()))) {
        v(violations, 'undeclared_unfetched_offer_page', `The offer-surface door "${label}" was not retrieved and is not declared in coverage.unfetched_pages.`, 'coverage.unfetched_pages');
      }
    }
  }
}

/** The set of numbers a claim may carry: the explicit counts the prompt tells
 *  the model to copy, plus years literally present in page text. Never the
 *  model's own self_check — folding self-reported counts into the whitelist
 *  means a model that writes "nine doors" in prose and 9 in self_check passes
 *  its own fabrication guard. Shared with outlineValidator.js. */
export function groundedNumbers(fs) {
  const inv = fs.link_inventory || {};
  const grounded = new Set();
  const add = (n) => { if (Number.isFinite(n)) grounded.add(Number(n)); };

  add(inv.nav_door_count);
  add(inv.dropdown_parent_count);
  add(inv.footer_door_count);
  add(inv.distinct_destinations);
  add((inv.body_ctas || []).length);
  add((inv.social_links || []).length);
  add((fs.pages || []).length);
  for (const d of Object.values(inv.click_distance || {})) add(d);
  for (const f of fs.embedded_feeds || []) add(f.item_count);
  for (const p of fs.pages || []) {
    add((p.blocks || []).filter((b) => b.type === 'image').length);
    add((p.blocks || []).filter((b) => b.type === 'heading').length);
    for (const b of p.blocks || []) if (b.item_count !== undefined) add(b.item_count);
    for (const y of (p.text || '').match(/\b(19|20)\d{2}\b/g) || []) add(Number(y));
  }
  return grounded;
}

/** Every number in rendered prose must be re-derivable from the fact sheet. */
function checkNumbers(out, fs, prose, violations) {
  const grounded = groundedNumbers(fs);

  const digits = (prose.match(/\b\d+\b/g) || []).map(Number);
  for (const n of digits) {
    if (!grounded.has(n)) {
      v(violations, 'number_not_grounded', `"${n}" in the rendered prose matches no count in the fact sheet.`, 'rendered_prose');
    }
  }
  // Spelled-out counts from three up. "one" and "two" are excluded as too
  // idiomatic to treat as claims ("one page", "no one").
  const lower = prose.toLowerCase();
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`(?<![A-Za-z])${word}(?![A-Za-z])`).test(lower) && !grounded.has(value)) {
      v(violations, 'number_not_grounded', `"${word}" in the rendered prose matches no count in the fact sheet.`, 'rendered_prose');
    }
  }
}

function checkBanned(out, prose, violations) {
  const hay = normalizeQuotes(prose).toLowerCase();
  const groups = [
    ['banned_machinery_word', BANNED_MACHINERY],
    ['banned_self_reference', BANNED_SELF_REFERENCE],
    ['banned_hedge', BANNED_HEDGES],
    ['banned_metaphor', BANNED_METAPHORS],
    ['banned_frame', BANNED_FRAMES],
  ];
  for (const [code, terms] of groups) {
    for (const term of terms) {
      const re = new RegExp(`(?<![A-Za-z0-9])${esc(normalizeQuotes(term.toLowerCase()))}(?![A-Za-z0-9])`);
      if (re.test(hay)) v(violations, code, `Banned term "${term}" appears in the rendered prose.`);
    }
  }
  for (const re of BANNED_HOUSE_CADENCES) {
    if (re.test(prose)) v(violations, 'banned_house_cadence', `The rendered prose uses a banned house cadence: ${re.source}`);
  }
  if (isRead(out) && out.bridge && out.bridge.text) {
    const bridge = normalizeQuotes(out.bridge.text).toLowerCase();
    for (const term of BANNED_IN_BRIDGE) {
      const re = new RegExp(`(?<![A-Za-z0-9])${esc(term)}(?![A-Za-z0-9])`);
      if (re.test(bridge)) v(violations, 'banned_bridge_term', `The bridge names "${term}"; v4 forbids offer mechanics in the bridge.`, 'bridge');
    }
    if (/\$\s?\d|\b\d+\s*(week|month|day|hour|session)s?\b/i.test(out.bridge.text)) {
      v(violations, 'bridge_names_offer_mechanics', 'The bridge names a price or a duration.', 'bridge');
    }
  }
}

function checkPromptOverlap(prose, promptText, violations) {
  if (!promptText) return;
  const promptGrams = ngrams(promptText, 5);
  for (const g of ngrams(prose, 5)) {
    // A run of five function words ("at the end of a") is English, not a
    // memorized exemplar. Requiring one substantial word keeps the check
    // pointed at what it exists to catch — a sentence lifted from an example —
    // without spending a repair round on grammar.
    if (!g.split(' ').some((t) => t.length >= 5)) continue;
    if (promptGrams.has(g)) {
      v(violations, 'prompt_five_gram_overlap', `The rendered prose reproduces a five-word run from the instructions: "${g}".`);
    }
  }
}

function checkCaps(out, prose, violations) {
  if (!prose) return;
  const read = isRead(out);
  const sentences = splitSentences(prose);

  const quotePairs = count(prose, /"[^"]*"/g) + count(prose, /“[^”]*”/g);
  if (read && quotePairs > 2) v(violations, 'too_many_quotes', `${quotePairs} quoted strings in the rendered prose; at most two.`);

  const xNotY = count(prose, /\bis not\b[^.!?]*[—-]\s*it('s|s|’s| is)\b/gi);
  const antithesis =
    count(prose, /\b\w+,\s*not\s+\w+/gi) +
    count(prose, /\b\w+\s+rather than\s+\w+/gi) +
    count(prose, /\b\w+\s+instead of\s+\w+/gi) +
    xNotY;
  if (read && antithesis > 3) v(violations, 'too_much_antithesis', `${antithesis} antithesis constructions; at most three in the whole read.`);
  if (read && xNotY > 1) v(violations, 'x_not_y_overused', `The "X is not Y — it's Z" pivot appears ${xNotY} times; at most once.`);

  const stranger = count(prose, /\ba stranger\b/gi);
  if (read && stranger > 3) v(violations, 'too_many_strangers', `"a stranger" appears ${stranger} times; at most three.`);

  const firstPerson = sentences.filter((s) => /\b(I|me|my|we|our|us)\b/.test(s)).length;
  if (read && firstPerson > 1) v(violations, 'too_much_first_person', `${firstPerson} sentences use first person; at most one in the whole read.`);

  const thirdPerson = sentences.filter((s) => /\b(this founder|this practitioner|the studio's owner|her own site|his own site)\b/i.test(s)).length;
  if (read && thirdPerson > 0) v(violations, 'third_person_about_owner', 'The owner is referred to in the third person; the read addresses them as "you" throughout.');

  const long = sentences.filter((s) => wordCount(s) > 30).length;
  if (read && long > 1) v(violations, 'too_many_long_sentences', `${long} sentences exceed thirty words; at most one.`);

  const questions = count(prose, /\?/g);
  if (questions > 0) v(violations, 'rhetorical_question', `${questions} question mark(s) in the rendered prose; zero are allowed.`);

  const emDashes = count(prose, /—/g);
  const words = wordCount(prose);
  if (read && words > 0 && emDashes > Math.ceil(words / 30)) {
    v(violations, 'em_dash_pileup', `${emDashes} em dashes across ${words} words; roughly one per thirty at most.`);
  }

  if (read) {
    const contractions = count(prose, /\b\w+['’](s|t|re|ve|ll|d|m)\b/gi);
    if (contractions < 2) v(violations, 'too_few_contractions', `${contractions} contractions; at least two must appear in the warm descriptive sentences.`);

    if (out.opening && out.opening.text) {
      const firstSentence = splitSentences(out.opening.text)[0] || out.opening.text;
      if (!/\byou\b|\byour\b/i.test(firstSentence)) {
        v(violations, 'opening_not_second_person', 'The opening sentence must address the owner as "you" or "your".', 'opening');
      }
    }
    if (out.bridge && out.bridge.text) {
      if (!out.bridge.concrete_anchor) {
        v(violations, 'bridge_missing_anchor', 'bridge.concrete_anchor is required.', 'bridge');
      } else if (!out.bridge.text.includes(out.bridge.concrete_anchor)) {
        v(violations, 'bridge_anchor_not_in_text', 'bridge.concrete_anchor must appear literally inside bridge.text.', 'bridge');
      }
    }
    if (words < 250 || words > 400) {
      v(violations, 'word_count_out_of_range', `The rendered read is ${words} words; it must land between 250 and 400.`);
    }
  }
}

function checkSelfCheck(out, violations) {
  if (!isRead(out)) return;
  const sc = out.self_check || {};
  // The v4 keys about perception (quotes, speakers, placement, numbers) are
  // gone from the read: the writer never saw the site and cannot attest to
  // them. They live in the outline's truth_check and are checked there, against
  // the fact sheet. What is left is what the writer alone can attest to.
  //
  // `negative_claims` is deliberately DELETED rather than ported. The absence
  // gate ran in pass 1, against the CLAIM. Re-gating it here against a field
  // the read does not carry is how a check quietly becomes a no-op that still
  // looks like a check.
  for (const key of [
    'prompt_leak_scan_done',
    'no_new_facts_introduced',
    'findings_used_once',
    'plan_rendered_exactly',
    'nothing_after_bridge',
    'bold_only_where_planned',
  ]) {
    if (sc[key] === false) {
      v(violations, 'self_check_failed', `self_check.${key} is false; every one of these must be run before emitting.`, 'self_check');
    }
  }
}

// --- entry point ------------------------------------------------------------

/**
 * @param {object} out       Parsed model output.
 * @param {import('./types.js').FactSheet} fs
 * @param {string} promptText  The WRITER prompt, for the exemplar-leak sweep.
 *                             Passing the outline prompt too would flag five-grams
 *                             the writer never saw.
 * @returns {{ok:boolean, violations:import('./types.js').Violation[]}}
 */
export function validate(out, fs, promptText) {
  const violations = [];
  try {
    checkStatusAndPresence(out, violations);
    if (violations.some((x) => x.code === 'not_an_object' || x.code === 'unrecognized_status')) {
      return { ok: false, violations };
    }
    const prose = assembleRenderedProse(out);
    checkShapeDirective(out, fs, violations);
    checkEvidence(out, fs, violations);
    checkLanes(out, violations);
    checkCoverage(out, fs, violations);
    checkNumbers(out, fs, prose, violations);
    checkBanned(out, prose, violations);
    checkPromptOverlap(prose, promptText, violations);
    checkCaps(out, prose, violations);
    checkSelfCheck(out, violations);
  } catch (err) {
    v(violations, 'validator_crash', String((err && err.message) || err));
  }
  return { ok: violations.length === 0, violations };
}

export function formatViolationsForRepair(violations) {
  return (
    'The previous response failed these deterministic checks. Fix every one and re-emit the complete JSON object. ' +
    'Do not patch only the failing field — the surrounding sentences must still read as written prose once the fix lands. ' +
    'Do not explain the fix.\n\n' +
    violations
      .map((x, i) => `${i + 1}. [${x.code}]${x.path ? ` (${x.path})` : ''} ${x.message}`)
      .join('\n')
  );
}

export { wordCount, splitSentences, assembleRenderedProse as renderProse };
