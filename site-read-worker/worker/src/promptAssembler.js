// ---------------------------------------------------------------------------
// PROMPT ASSEMBLERS — one per stage.
//
// Stage A's system turn is the outline prompt, verbatim; its user turn is the
// fact sheet, serialized in exactly the shape the prompt's "INPUT — THE FACT
// SHEET" section documents.
//
// Stage B's system turn is the writer prompt; its user turn is the OUTLINE, the
// shape directive, and the word budget.
//
// **The writer's user turn must not contain the fact sheet.** That absence is
// the mechanism by which the writer cannot fabricate: it has no pages to
// misread and no numbers to combine. The containment check is only the backstop.
// Do not helpfully pass the pages through for context.
//
// The shape directive is deliberately absent from the OUTLINE turn. The shapes
// are assigned to the writer, and an outline that knew which one was coming
// would fill its first_screen and bridge_material blocks selectively instead of
// completely.
// ---------------------------------------------------------------------------

import { OUTLINE_PROMPT } from './outlinePrompt.js';
import { WRITER_PROMPT } from './writerPrompt.js';

export const READ_WORD_BUDGET = { min: 250, max: 400 };
export const DECLINE_WORD_BUDGET = { min: 25, max: 50 };

export function assembleOutlinePrompt(factSheet, repairNote) {
  // The directive is stripped, not merely unmentioned. It rides on the fact
  // sheet for the operator log, and the outline prompt states flatly that pass 1
  // is not given it — an outline that knew which opening was coming would fill
  // first_screen and bridge_material selectively instead of completely, which is
  // the one thing that makes all four shapes writable from one outline.
  const { shape_directive, ...forPassOne } = factSheet;
  const parts = [];
  if (repairNote) parts.push(repairNote, '');
  parts.push('Fact sheet:', '```json', JSON.stringify(forPassOne, null, 2), '```');
  return { system: OUTLINE_PROMPT, user: parts.join('\n') };
}

/**
 * The writer's world, and nothing beyond it.
 *
 * `truth_check` is pass-1's bookkeeping — the absence gate's scan records, the
 * count conflicts, the plan's own arithmetic. The writer cannot act on any of
 * it and should not read it: those records carry page-derived phrasing, and a
 * writer that has read them can reach a fact through the audit trail that the
 * outline proper does not license.
 *
 * The SAME trimmed object goes to the writer and to `checkContainment`. If the
 * check measured against a fatter object than the writer was handed, it would
 * be looser than reality — which is the one thing a containment check must
 * never be.
 */
export function writerView(outline) {
  const { truth_check, gate_signals, ...visible } = outline;
  return visible;
}

export function assembleWriterPrompt(outline, shapeDirective, framesInUse, repairNote) {
  const parts = [];
  if (repairNote) parts.push(repairNote, '');
  parts.push('Outline:', '```json', JSON.stringify(writerView(outline), null, 2), '```', '');
  parts.push(
    'Shape directive:',
    '```json',
    JSON.stringify({ opening_shape: shapeDirective.opening_shape, bridge_move: shapeDirective.bridge_move }, null, 2),
    '```',
    '',
  );
  parts.push(
    'Frames in use:',
    '```json',
    JSON.stringify(framesInUse || { opening_frames: [], bridge_frames: [] }, null, 2),
    '```',
    '',
  );
  parts.push(
    `Word budget: ${READ_WORD_BUDGET.min}-${READ_WORD_BUDGET.max} rendered words for a read, ` +
      `${DECLINE_WORD_BUDGET.min}-${DECLINE_WORD_BUDGET.max} for a decline.`,
  );
  return { system: WRITER_PROMPT, user: parts.join('\n') };
}
