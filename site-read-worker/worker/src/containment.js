// ---------------------------------------------------------------------------
// CONTAINMENT — the writer's prose measured against the outline it was given.
//
// The writer does not have the site, the fact sheet, or the pages. Its user turn
// is the outline and nothing else. THAT ABSENCE is the mechanism; everything
// here is the backstop that proves it held.
//
// Runs on the ASSEMBLED read, using the same `renderProse` the word budget uses,
// so it measures exactly the string the reader gets.
//
// Three of these checks exist because of specific sentences that shipped:
//   - an unplanned bold restatement beside the sentence it repeated
//   - a kicker after the bridge, which had nothing left to say and so said the
//     read again
//   - a quoted fragment the writer assembled rather than copied
// ---------------------------------------------------------------------------

import { renderProse, splitSentences, wordCount, NUMBER_WORDS } from './validator.js';

const PROPER_NOUN_STOPS = new Set([
  'You', 'Your', 'Yours', 'The', 'A', 'An', 'I', 'It', 'Its', 'That', 'This', 'These', 'Those',
  'They', 'Their', 'Them', 'Not', 'No', 'Nothing', 'Nowhere', 'Never', 'None', 'And', 'But', 'So',
  'If', 'When', 'What', 'Who', 'Whoever', 'Whose', 'Where', 'Here', 'There', 'One', 'Two', 'Three',
  'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'First', 'Second', 'Third', 'Every',
  'Someone', 'Somebody', 'Anyone', 'Nobody', 'Both', 'Neither', 'Either', 'Once', 'Still', 'Yet',
]);

function v(list, code, message, path) {
  list.push(path ? { code, message, path } : { code, message });
}

function properNouns(text) {
  const found = new Set();
  for (const sentence of splitSentences(text)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    // Drop the first token: a sentence-initial capital is grammar, not evidence.
    for (let i = 1; i < words.length; i++) {
      const bare = words[i].replace(/^[^A-Za-z]+/, '').replace(/[^A-Za-z'’-]+$/, '');
      if (!/^[A-Z][A-Za-z'’-]*$/.test(bare)) continue;
      if (PROPER_NOUN_STOPS.has(bare)) continue;
      found.add(bare);
    }
  }
  return found;
}

/** Every unit the plan lists, in plan order, with the finding ids resolved. */
function planUnits(outline) {
  return (outline.render_plan || []).map((e) => e.unit);
}

/**
 * @param {object} assembled  the grafted read
 * @param {object} outline    the frozen pass-1 object
 * @returns {import('./types.js').Violation[]}
 */
export function checkContainment(assembled, outline) {
  const violations = [];
  if (!assembled || assembled.status !== 'read') return violations;

  const prose = renderProse(assembled);
  const hay = JSON.stringify(outline);
  const hayLower = hay.toLowerCase();

  // --- 1. proper nouns ------------------------------------------------------
  for (const noun of properNouns(prose)) {
    if (!hay.includes(noun)) {
      v(
        violations,
        'prose_introduces_proper_noun',
        `"${noun}" appears in the rendered read and nowhere in the outline. You had no way of knowing it was true: delete it, or replace it with the generic fact the outline supports.`,
        'rendered_prose',
      );
    }
  }

  // --- 2. numbers -----------------------------------------------------------
  // Grounded against the OUTLINE here, and against the fact sheet in
  // validateOutline. Strictly tighter than one check against the fact sheet,
  // and it closes the case where prose invents a number the fact sheet happens
  // to contain somewhere unrelated.
  for (const n of prose.match(/\b\d+\b/g) || []) {
    const word = Object.keys(NUMBER_WORDS).find((w) => NUMBER_WORDS[w] === Number(n));
    if (hay.includes(n) || (word && hayLower.includes(word))) continue;
    v(violations, 'prose_introduces_number', `The number "${n}" is in the read and not in the outline. Numbers are copied, never inferred, summed, spanned or rounded.`, 'rendered_prose');
  }
  const proseLower = prose.toLowerCase();
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (!new RegExp(`(?<![A-Za-z])${word}(?![A-Za-z])`).test(proseLower)) continue;
    if (hayLower.includes(word) || hay.includes(String(value))) continue;
    v(violations, 'prose_introduces_number', `The count "${word}" is in the read and not in the outline.`, 'rendered_prose');
  }

  // --- 3. quotes ------------------------------------------------------------
  // Only an exhibit.quote may sit inside quotation marks. `source_span` is
  // context the writer was handed so pass 1 could check its own fragment; it is
  // explicitly not quotable, so it is not in this set.
  const quotable = [];
  const collectQuotes = (node) => {
    if (Array.isArray(node)) node.forEach(collectQuotes);
    else if (node && typeof node === 'object') {
      if (typeof node.quote === 'string' && node.quote) quotable.push(node.quote);
      Object.values(node).forEach(collectQuotes);
    }
  };
  collectQuotes(outline);
  const spans = (prose.match(/"[^"]+"/g) || []).concat(prose.match(/[“][^”]+[”]/g) || []);
  for (const raw of spans) {
    const inner = raw.slice(1, -1).trim().replace(/[.,;:]$/, '');
    if (!quotable.some((q) => q.includes(inner))) {
      v(violations, 'prose_quote_not_in_outline', `The quoted string ${JSON.stringify(inner.slice(0, 60))} is not an exhibit quote from the outline. Quote only what the outline quotes, character for character; a source_span is not a quote.`, 'rendered_prose');
    }
  }

  // --- 4. one use, in plan order -------------------------------------------
  const outlineIds = (outline.findings || []).map((f) => f.id);
  const rendered = (assembled.lane_verdicts || []).map((lv) => lv.finding_id);
  for (const id of rendered) {
    if (!outlineIds.includes(id)) {
      v(violations, 'unknown_finding_id', `The read renders finding "${id}", which is not in the outline.`, 'lane_verdicts');
    }
  }
  for (const id of outlineIds) {
    const n = rendered.filter((r) => r === id).length;
    if (n === 0) v(violations, 'finding_not_rendered', `Finding "${id}" is in the outline and in the plan, and does not appear in the read. Every entry gets rendered.`, 'lane_verdicts');
    if (n > 1) v(violations, 'finding_rendered_twice', `Finding "${id}" is rendered ${n} times; each is spent exactly once.`, 'lane_verdicts');
  }
  if (rendered.length === outlineIds.length && rendered.some((id, i) => id !== outlineIds[i])) {
    v(violations, 'finding_order_changed', `The read renders findings in the order ${rendered.join(', ')}; the plan orders them ${outlineIds.join(', ')}.`, 'lane_verdicts');
  }

  // --- 5. the plan, unit by unit -------------------------------------------
  const units = new Set(planUnits(outline));
  const boldEntry = (outline.render_plan || []).find((e) => e.bold === true);
  const boldFinding = boldEntry ? boldEntry.unit.split('.')[0] : null;

  for (const lv of assembled.lane_verdicts || []) {
    const claimUnit = `${lv.finding_id}.claim`;
    const consUnit = `${lv.finding_id}.consequence`;
    if (!units.has(claimUnit)) {
      v(violations, 'sentence_without_plan_entry', `The read renders ${claimUnit}, which the plan does not list.`, 'lane_verdicts');
    }
    const hasBold = typeof lv.bold_line === 'string' && lv.bold_line.trim().length > 0;
    if (hasBold && lv.finding_id !== boldFinding) {
      v(
        violations,
        'bold_line_not_planned',
        `${lv.finding_id} carries a bold line and the plan designates ${boldFinding || '(none)'}. ` +
          'A free slot beside a finding fills itself with that finding restated in heavier type, which is louder than the duplicate it repeats and therefore worse.',
        'lane_verdicts',
      );
    }
    if (hasBold && !units.has(consUnit)) {
      v(violations, 'bold_line_without_consequence_entry', `${lv.finding_id} carries a bold line but the plan has no ${consUnit} entry to render.`, 'lane_verdicts');
    }
  }
  if (boldFinding) {
    const carrier = (assembled.lane_verdicts || []).find((lv) => lv.finding_id === boldFinding);
    if (!carrier || !carrier.bold_line) {
      v(violations, 'planned_bold_line_missing', `The plan designates ${boldEntry.unit} as the bold line and the read does not carry one there.`, 'lane_verdicts');
    }
  }
  const boldCount = (assembled.lane_verdicts || []).filter((lv) => lv.bold_line).length;
  if (boldCount > 1) {
    v(violations, 'too_many_bold_lines', `${boldCount} bold lines in the read; the plan marks exactly one entry bold and that entry's own sentence is it.`, 'lane_verdicts');
  }

  // Bold formatting may not appear anywhere else in the prose either. The
  // markdown-style emphasis the writer reaches for when it wants a second
  // bolded line is caught here rather than rendered as literal asterisks.
  for (const [label, text] of proseFields(assembled)) {
    if (/\*\*[^*]+\*\*|<(b|strong)\b/i.test(String(text || ''))) {
      v(violations, 'inline_bold_markup', `${label} carries inline bold formatting. Bold appears in exactly one place in the read: the bold_line the plan designated.`, label);
    }
  }

  // --- 6. nothing after the bridge -----------------------------------------
  // The bridge names a change and the read is over. A line after it is a
  // sentence with nothing left to say, which is why it says the read again.
  if (assembled.bridge && assembled.bridge.text) {
    const bridgeText = assembled.bridge.text.trim();
    const trimmed = prose.trim();
    if (!trimmed.endsWith(bridgeText)) {
      v(
        violations,
        'content_after_bridge',
        'The rendered read does not end on the bridge. Nothing follows it: no summary, no reprise, no closing line, no line returning to the opening.',
        'bridge',
      );
    }
    // A kicker does not need its own field to exist. The plan lists `bridge` as
    // ONE unit, the writer prompt calls it the last sentence of the read, and a
    // second sentence inside the field is exactly where the closing line went
    // when the slot was taken away from it.
    const sentences = splitSentences(bridgeText);
    if (sentences.length > 1) {
      v(
        violations,
        'content_after_bridge',
        `The bridge runs ${sentences.length} sentences: ${JSON.stringify(sentences[1].slice(0, 60))} follows the one that names the change. ` +
          'The bridge is one unit and one sentence, and nothing follows it — no summary, no reprise, no closing line.',
        'bridge',
      );
    }
  }

  // --- 7. the anchor came from the candidate list --------------------------
  const candidates = (outline.bridge_material && outline.bridge_material.concrete_anchor_candidates) || [];
  const anchor = assembled.bridge && assembled.bridge.concrete_anchor;
  if (anchor && candidates.length && !candidates.includes(anchor)) {
    v(violations, 'anchor_not_a_candidate', `bridge.concrete_anchor is ${JSON.stringify(anchor)}; it must be one of the outline's candidates: ${candidates.map((c) => JSON.stringify(c)).join(', ')}.`, 'bridge');
  }

  // --- 8. the cut and the bridge are not restatements ----------------------
  if (assembled.bridge && assembled.bridge.text) {
    for (const lv of assembled.lane_verdicts || []) {
      if (!lv.evidence) continue;
      if (heavilyOverlaps(assembled.bridge.text, lv.evidence)) {
        v(violations, 'bridge_restates_finding', `The bridge restates ${lv.finding_id}. A bridge field names a CHANGE, not a state — rewrite it as what would have to move.`, 'bridge');
        break;
      }
    }
  }

  // --- 9. the read is short enough to be one sitting -----------------------
  if (wordCount(prose) === 0) {
    v(violations, 'no_rendered_prose', 'The read renders no prose at all.', 'rendered_prose');
  }

  return violations;
}

function proseFields(read) {
  const out = [];
  if (read.opening) out.push(['opening.text', read.opening.text]);
  for (const key of ['positioning_legibility', 'tangibles', 'entry_point', 'delivered_vs_handheld']) {
    const item = read.skim_read && read.skim_read[key];
    if (item) out.push([`skim_read.${key}.observation`, item.observation]);
  }
  if (read.gap) {
    out.push(['gap.what_you_have', read.gap.what_you_have]);
    out.push(['gap.what_a_stranger_gets', read.gap.what_a_stranger_gets]);
  }
  for (const lv of read.lane_verdicts || []) {
    out.push([`lane_verdicts.${lv.finding_id}.evidence`, lv.evidence]);
  }
  if (read.strongest_true_thing) out.push(['strongest_true_thing.text', read.strongest_true_thing.text]);
  if (read.bridge) out.push(['bridge.text', read.bridge.text]);
  return out;
}

const OVERLAP_STOPS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'is', 'are',
  'was', 'be', 'it', 'its', 'that', 'this', 'you', 'your', 'they', 'them', 'their', 'from', 'as',
  'not', 'no', 'has', 'have', 'had', 'what', 'who', 'someone', 'page', 'site',
]);

function heavilyOverlaps(a, b) {
  const setOf = (s) =>
    new Set(
      String(s || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 3 && !OVERLAP_STOPS.has(t)),
    );
  const sa = setOf(a);
  const sb = setOf(b);
  if (sa.size < 4 || sb.size < 4) return false;
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared++;
  return shared / Math.min(sa.size, sb.size) >= 0.7;
}

export { properNouns, heavilyOverlaps };
