// ---------------------------------------------------------------------------
// THE TWO-PASS LOOP — outline, then writer, with independent repair budgets.
//
//   factSheet
//     |
//     +-- STAGE A  outline call --> validateOutline(outline, factSheet)  [<=2]
//     |                                   |  fails twice
//     |                                   +--> FAIL-SAFE (the writer never runs)
//     |
//     +-- outline (FROZEN)
//             |
//             +-- STAGE B  writer call --> assembleRead(outline, prose, …)
//                                              +--> validate(assembled, fs, WRITER_PROMPT)
//                                              +--> checkContainment(assembled, outline)  [<=2]
//                                                       |  fails twice
//                                                       +--> FAIL-SAFE
//
// Worst case is four model calls, not two. The expensive input is still paid
// once: the writer's user turn carries the outline and never the fact sheet, and
// `writerView` strips pass-1's bookkeeping from even that. On a real site — tens
// of kilobytes of page text — the writer turn is a fraction of the outline turn.
// On a two-page fixture it is not, because a v5.2 outline carries a ledger and a
// plan whatever the site's size. Both calls sit behind one ephemeral cache
// breakpoint, and the outline prompt is byte-identical across every read.
//
// Three placement rules, and the reason for each:
//
//   1. An outline that fails twice NEVER reaches the writer. Rendering prose off
//      a broken outline produces confident, well-written falsehood — the worst
//      output this pipeline can emit — and it spends a writer call to do it.
//   2. A prose failure re-runs the WRITER, with the SAME outline. Never pass 1.
//      A blown word count, a banned word or a leaked five-gram is not evidence
//      the perception was wrong, and re-perceiving would silently change the
//      findings underneath a repair that was about a comma. The outline object
//      is frozen once stage A returns ok and the identical reference goes into
//      every writer attempt.
//   3. Repair notes are stage-local. A writer handed a violation list without
//      "the outline is unchanged and is still the only material you have" tries
//      to solve a containment failure by inventing a replacement fact.
//
// The fail-safe is the whole point of both loops: rather than ship prose that
// failed its own checks, the read degrades to an honest decline in the same
// register the prompts use for their own declines. The visitor is never told
// "our AI broke", and never shown a read the pipeline could not stand behind.
// ---------------------------------------------------------------------------

import { validate, formatViolationsForRepair } from './validator.js';
import { validateOutline } from './outlineValidator.js';
import { checkContainment } from './containment.js';
import { assembleRead } from './assemble.js';
import { assembleOutlinePrompt, assembleWriterPrompt, writerView } from './promptAssembler.js';
import { OUTLINE_TOOL_SCHEMA } from './outlinePrompt.js';
import { WRITER_PROMPT, WRITER_TOOL_SCHEMA } from './writerPrompt.js';
import { OUTLINE_CALL, WRITER_CALL } from './model.js';
import { SCHEMA_VERSION } from './types.js';

export const OUTLINE_ATTEMPTS = 2;
export const WRITER_ATTEMPTS = 2;
/** Kept for callers that still speak of one budget. */
export const MAX_ATTEMPTS = OUTLINE_ATTEMPTS;

const OUTLINE_REPAIR_PREFIX =
  'The previous OUTLINE failed these deterministic checks, run against the fact sheet you were given.';
const WRITER_REPAIR_PREFIX =
  'The previous PROSE failed these deterministic checks. The outline is unchanged and is still the only ' +
  'material you have — do not invent a replacement fact to satisfy one of these.';

/** The honest decline shown when a read cannot be produced cleanly. Held to the
 *  same 25-50 word rule as any other decline, and asserted against the validator
 *  in test/test-validator.mjs. Its status is pipeline-only: neither model's tool
 *  schema offers `decline_incomplete`, so this copy can only ever come from
 *  here. */
export function buildFailSafeOutput(factSheet) {
  return {
    schema_version: SCHEMA_VERSION,
    site_url: factSheet.site_url,
    status: 'decline_incomplete',
    shape_directive_used: null,
    decline: {
      observation:
        'Your pages came back and were read, but the write-up built from them did not clear the accuracy checks this tool runs on itself, twice over.',
      redirect:
        'Nothing on your end needs changing. Running it again in a few minutes usually clears it.',
      exhibit: null,
    },
    self_check: { fail_safe: true },
  };
}

function noteFor(prefix, violations) {
  return `${prefix}\n\n${formatViolationsForRepair(violations)}`;
}

// --- STAGE A ----------------------------------------------------------------

/**
 * @param {import('./types.js').FactSheet} factSheet
 * @param {Function} callModel
 * @returns {Promise<{outline:object|null, attempts:number, violations:Array, diagnostics:Array, usages:Array}>}
 */
export async function runOutline(factSheet, callModel) {
  const diagnostics = [];
  const usages = [];

  for (let attempt = 1; attempt <= OUTLINE_ATTEMPTS; attempt++) {
    const repairNote =
      attempt === 1 ? undefined : noteFor(OUTLINE_REPAIR_PREFIX, diagnostics[diagnostics.length - 1].violations);
    const { system, user } = assembleOutlinePrompt(factSheet, repairNote);

    let result;
    try {
      result = await callModel(system, user, { ...OUTLINE_CALL, schema: OUTLINE_TOOL_SCHEMA });
    } catch (err) {
      diagnostics.push({ stage: 'outline', attempt, violations: [{ code: 'model_call_failed', message: String((err && err.message) || err) }], raw: null });
      continue;
    }
    if (result.usage) usages.push(result.usage);

    if (!result.output) {
      diagnostics.push({ stage: 'outline', attempt, violations: [{ code: 'model_output_unparseable', message: result.parseError || 'no parseable output' }], raw: result.raw });
      continue;
    }

    const { ok, violations } = validateOutline(result.output, factSheet);
    diagnostics.push({ stage: 'outline', attempt, violations, raw: result.raw });
    if (ok) {
      return { outline: result.output, attempts: attempt, violations: [], diagnostics, usages };
    }
  }

  return {
    outline: null,
    attempts: OUTLINE_ATTEMPTS,
    violations: diagnostics.length ? diagnostics[diagnostics.length - 1].violations : [],
    diagnostics,
    usages,
  };
}

// --- STAGE B ----------------------------------------------------------------

/**
 * @param {object} outline    frozen; the identical reference goes into every attempt
 * @param {import('./types.js').FactSheet} factSheet  for the validator's evidence checks
 * @param {{opening_shape:string,bridge_move:string}} shapeDirective
 * @param {Function} callModel
 */
export async function runWriter(outline, factSheet, shapeDirective, callModel, options = {}) {
  const diagnostics = [];
  const usages = [];
  const framesInUse = options.framesInUse;
  // Exactly what the writer is handed, and exactly what containment measures
  // against. One object, so the check can never be looser than the world.
  const visible = writerView(outline);

  for (let attempt = 1; attempt <= WRITER_ATTEMPTS; attempt++) {
    const repairNote =
      attempt === 1 ? undefined : noteFor(WRITER_REPAIR_PREFIX, diagnostics[diagnostics.length - 1].violations);
    const { system, user } = assembleWriterPrompt(outline, shapeDirective, framesInUse, repairNote);

    let result;
    try {
      result = await callModel(system, user, { ...WRITER_CALL, schema: WRITER_TOOL_SCHEMA });
    } catch (err) {
      diagnostics.push({ stage: 'prose', attempt, violations: [{ code: 'model_call_failed', message: String((err && err.message) || err) }], raw: null });
      continue;
    }
    if (result.usage) usages.push(result.usage);

    if (!result.output) {
      diagnostics.push({ stage: 'prose', attempt, violations: [{ code: 'model_output_unparseable', message: result.parseError || 'no parseable output' }], raw: result.raw });
      continue;
    }

    let assembled;
    try {
      assembled = assembleRead(outline, result.output, shapeDirective, factSheet.site_url);
    } catch (err) {
      // assembleRead throws on an unknown finding_id or an unplanned skim
      // dimension. That is a violation the writer can fix, not an exception.
      diagnostics.push({ stage: 'prose', attempt, violations: [{ code: 'graft_failed', message: String((err && err.message) || err) }], raw: result.raw });
      continue;
    }

    const { violations } = validate(assembled, factSheet, WRITER_PROMPT);
    const contained = checkContainment(assembled, visible);
    const all = [...violations, ...contained];
    diagnostics.push({ stage: 'prose', attempt, violations: all, raw: result.raw });

    if (all.length === 0) {
      return { output: assembled, attempts: attempt, violations: [], diagnostics, usages };
    }
  }

  return {
    output: null,
    attempts: WRITER_ATTEMPTS,
    violations: diagnostics.length ? diagnostics[diagnostics.length - 1].violations : [],
    diagnostics,
    usages,
  };
}

// --- the orchestration ------------------------------------------------------

/**
 * @param {import('./types.js').FactSheet} factSheet
 * @param {{opening_shape:string,bridge_move:string}} shapeDirective
 * @param {Function} callModel
 */
export async function runTwoPass(factSheet, shapeDirective, callModel, options = {}) {
  const a = await runOutline(factSheet, callModel);
  const usages = [...a.usages];

  if (!a.outline) {
    return {
      output: buildFailSafeOutput(factSheet),
      status: 'fail_safe',
      failedStage: 'outline',
      attempts: a.attempts,
      outlineAttempts: a.attempts,
      writerAttempts: 0,
      finalViolations: a.violations,
      internalDiagnostics: { outline: a.diagnostics, prose: [] },
      outline: null,
      usages,
    };
  }

  // Frozen. Rule 2: a prose repair may only change words.
  const outline = Object.freeze(a.outline);
  const b = await runWriter(outline, factSheet, shapeDirective, callModel, options);
  usages.push(...b.usages);

  if (!b.output) {
    return {
      output: buildFailSafeOutput(factSheet),
      status: 'fail_safe',
      failedStage: 'prose',
      attempts: a.attempts + b.attempts,
      outlineAttempts: a.attempts,
      writerAttempts: b.attempts,
      finalViolations: b.violations,
      internalDiagnostics: { outline: a.diagnostics, prose: b.diagnostics },
      outline,
      usages,
    };
  }

  const clean = a.attempts === 1 && b.attempts === 1;
  return {
    output: b.output,
    status: clean ? 'ok' : 'ok_after_repair',
    failedStage: null,
    attempts: a.attempts + b.attempts,
    outlineAttempts: a.attempts,
    writerAttempts: b.attempts,
    finalViolations: [],
    internalDiagnostics: { outline: a.diagnostics, prose: b.diagnostics },
    outline,
    usages,
  };
}
