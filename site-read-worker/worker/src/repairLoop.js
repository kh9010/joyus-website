// ---------------------------------------------------------------------------
// REPAIR LOOP — call, validate, ONE retry with the violations listed, then
// fail-safe.
//
// The fail-safe is the whole point: rather than ship prose that failed its own
// checks (a fabricated quote, a blown cap, an absence claim with no scan
// record), the read degrades to an honest decline in the same register v4 uses
// for its own declines. The visitor is never told "our AI broke", and never
// shown a read the pipeline could not stand behind.
//
// A parse failure counts as an attempt and carries its own violation code, so a
// model that returns something unparseable does not silently get two extra
// tries. The raw output and the violations from every attempt are kept on
// internalDiagnostics for the operator log; none of it is ever shown to the
// visitor.
// ---------------------------------------------------------------------------

import { validate, formatViolationsForRepair } from './validator.js';
import { assemblePrompt } from './promptAssembler.js';
import { ANALYSIS_PROMPT } from './analysisPrompt.js';
import { SCHEMA_VERSION } from './types.js';

export const MAX_ATTEMPTS = 2;

/** The honest decline shown when a read cannot be produced cleanly. Held to the
 *  same 40-70 word rule as any other decline, and asserted against the
 *  validator in test/test-validator.mjs. Its status is pipeline-only: the
 *  model's tool schema does not offer `decline_incomplete`, so this copy can
 *  only ever come from here. */
export function buildFailSafeOutput(factSheet) {
  return {
    schema_version: SCHEMA_VERSION,
    site_url: factSheet.site_url,
    status: 'decline_incomplete',
    shape_directive_used: null,
    decline: {
      observation:
        'Your pages came back and were read, but the write-up built from them did not clear the accuracy checks this tool runs on itself before anything goes out, twice over.',
      redirect:
        'Nothing on your end needs changing. Running it again in a few minutes usually clears it, or send the address of the single page you most want looked at.',
      exhibit: null,
    },
    self_check: { fail_safe: true },
  };
}

/**
 * @param {import('./types.js').FactSheet} factSheet
 * @param {(system:string,user:string)=>Promise<{output:object|null,raw:string,parseError:string|null,usage:object|null}>} callModel
 */
export async function runWithRepair(factSheet, callModel) {
  const diagnostics = [];
  const usages = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const repairNote =
      attempt === 1 ? undefined : formatViolationsForRepair(diagnostics[diagnostics.length - 1].violations);
    const { system, user } = assemblePrompt(factSheet, repairNote);

    let result;
    try {
      result = await callModel(system, user);
    } catch (err) {
      diagnostics.push({
        attempt,
        violations: [{ code: 'model_call_failed', message: String((err && err.message) || err) }],
        raw: null,
      });
      continue;
    }

    if (result.usage) usages.push(result.usage);

    if (!result.output) {
      diagnostics.push({
        attempt,
        violations: [{ code: 'model_output_unparseable', message: result.parseError || 'no parseable output' }],
        raw: result.raw,
      });
      continue;
    }

    const { ok, violations } = validate(result.output, factSheet, ANALYSIS_PROMPT);
    diagnostics.push({ attempt, violations, raw: result.raw });

    if (ok) {
      return {
        output: result.output,
        status: attempt === 1 ? 'ok' : 'ok_after_repair',
        attempts: attempt,
        finalViolations: [],
        internalDiagnostics: diagnostics,
        usages,
      };
    }
  }

  return {
    output: buildFailSafeOutput(factSheet),
    status: 'fail_safe',
    attempts: MAX_ATTEMPTS,
    finalViolations: diagnostics.length ? diagnostics[diagnostics.length - 1].violations : [],
    internalDiagnostics: diagnostics,
    usages,
  };
}
