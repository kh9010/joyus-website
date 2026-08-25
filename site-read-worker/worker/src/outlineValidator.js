// ---------------------------------------------------------------------------
// OUTLINE VALIDATOR — deterministic checks of the pass-1 object against the
// fact sheet it was computed from.
//
// This is where "validate the outline in code where possible" lives, and a
// surprising amount is possible: the quote check the model was told to run is
// re-run here against the same page text, the render plan's bijection with the
// claim ledger is a set comparison, and the plan's shape (ends on bridge,
// exactly one bold entry, contiguous seq) is arithmetic.
//
// What is deliberately NOT here: whether a lane that is genuinely empty came
// back ABSENT, whether a verdict is right, whether the ordering is by strength.
// Those are the judgments pass 1 exists to make, and a false one that leaves
// this pass ships — which is why the prompt spends its length on them.
//
// An outline that fails twice never reaches the writer. Rendering prose off a
// broken outline produces confident, well-written falsehood, which is the worst
// output this pipeline can emit, and it spends a writer call to do it.
// ---------------------------------------------------------------------------

import { LANES } from './types.js';
import { groundedNumbers, NUMBER_WORDS } from './validator.js';

const SKIM_DIMENSIONS = ['positioning_legibility', 'tangibles', 'entry_point', 'delivered_vs_handheld'];
const ABSENCE_MARKERS = /\b(the only|the first|the last|none|never|not one|nothing|nowhere|no one|no \w+)\b/i;
const FEED_WORDS = /\b(feed|feeds|grid|gallery|galleries|post|posts|embed|embeds|video|videos|reel|reels)\b/i;
const CADENCE_WORDS = /\b(weekly|monthly|quarterly|regular|regularly|cadence|series|recurring|every \w+)\b/i;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'that', 'this', 'these', 'those',
  'as', 'from', 'into', 'than', 'then', 'so', 'no', 'not', 'any', 'one', 'has', 'have', 'had',
  'does', 'do', 'did', 'page', 'site', 'their',
]);

function v(list, code, message, path) {
  list.push(path ? { code, message, path } : { code, message });
}

function tokens(claim) {
  return new Set(
    String(claim || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

function isSubset(a, b) {
  if (!a.size || a.size > b.size) return false;
  for (const t of a) if (!b.has(t)) return false;
  return true;
}

/** Two claims are "the same claim" when they overlap heavily, or when one's
 *  vocabulary is entirely contained in the other's — that subset case is the
 *  generalization the prompt bans. 0.7 is the tunable; read the first fifty
 *  reads before moving it. */
const SIMILARITY_THRESHOLD = 0.7;

function sameClaim(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  return jaccard(ta, tb) >= SIMILARITY_THRESHOLD || isSubset(ta, tb) || isSubset(tb, ta);
}

function pageMaps(fs) {
  const text = new Map();
  for (const p of fs.pages || []) text.set(p.page, p.text || '');
  const fetched = new Set((fs.fetch_record || []).filter((r) => r.fetched).map((r) => r.page));
  return { text, fetched };
}

// --- exhibits ---------------------------------------------------------------

function checkExhibit(ex, path, maps, violations, opts = {}) {
  if (ex === null || ex === undefined) {
    if (opts.required) v(violations, 'missing_exhibit', `${path} requires an exhibit.`, path);
    return;
  }
  const hasQuote = typeof ex.quote === 'string' && ex.quote.length > 0;
  const hasRef = typeof ex.reference === 'string' && ex.reference.length > 0;
  if (hasQuote === hasRef) {
    v(violations, 'exhibit_quote_or_reference', `${path} carries exactly one of quote or reference.`, path);
  }
  if (!ex.page) {
    v(violations, 'exhibit_missing_page', `${path} must name the page it came from.`, path);
    return;
  }
  if (!maps.fetched.has(ex.page)) {
    v(violations, 'exhibit_page_not_fetched', `${path} cites page "${ex.page}", which was not retrieved.`, path);
    return;
  }
  if (opts.homepageOnly && ex.page !== 'homepage') {
    v(violations, 'skim_exhibit_off_homepage', `Skim exhibits are scored against the homepage alone; ${path} cites "${ex.page}".`, path);
  }
  if (!hasQuote) return;

  const text = maps.text.get(ex.page) || '';
  if (!text.includes(ex.quote)) {
    v(violations, 'quote_not_in_page_text', `${path} quote is not a character-exact substring of "${ex.page}": ${JSON.stringify(ex.quote.slice(0, 90))}`, path);
  }
  if (!ex.speaker) {
    v(violations, 'exhibit_missing_speaker', `${path} is a quote and must name who is speaking.`, path);
  }

  // v5.3: the span is what makes a quoted fragment checkable.
  const span = ex.source_span;
  if (typeof span !== 'string' || !span.length) {
    v(violations, 'exhibit_quote_without_source_span', `${path} quotes without a source_span. Every quoted exhibit carries the full sentence it came out of, verbatim.`, path);
    return;
  }
  if (!text.includes(span)) {
    v(violations, 'source_span_not_in_page_text', `${path} source_span is not a character-exact substring of "${ex.page}": ${JSON.stringify(span.slice(0, 90))}`, path);
  }
  if (!span.includes(ex.quote)) {
    v(violations, 'quote_not_inside_source_span', `${path} quote does not appear inside its own source_span; the span must be the sentence the quote was lifted from.`, path);
  }
}

// --- the render plan --------------------------------------------------------

function checkRenderPlan(outline, violations) {
  const plan = Array.isArray(outline.render_plan) ? outline.render_plan : null;
  const ledger = Array.isArray(outline.claim_ledger) ? outline.claim_ledger : null;
  if (!plan || plan.length === 0) {
    v(violations, 'render_plan_missing', 'render_plan[] is required when status is "read"; it is the list of sentences the writer is allowed to produce.', 'render_plan');
    return;
  }
  if (!ledger || ledger.length === 0) {
    v(violations, 'claim_ledger_missing', 'claim_ledger[] is required when status is "read".', 'claim_ledger');
    return;
  }

  // seq runs 1..N, contiguous, in emitted order.
  plan.forEach((e, i) => {
    if (e.seq !== i + 1) {
      v(violations, 'render_plan_seq_not_contiguous', `render_plan[${i}].seq is ${e.seq}; seq runs 1..N in emitted order with no gaps or repeats.`, 'render_plan');
    }
  });

  // Each unit at most once.
  const unitSeen = new Set();
  for (const e of plan) {
    if (unitSeen.has(e.unit)) {
      v(violations, 'render_plan_duplicate_unit', `Unit "${e.unit}" appears twice in the render plan; each unit appears at most once.`, 'render_plan');
    }
    unitSeen.add(e.unit);
  }

  // No banned units. The cut, the synthesis and the kicker are gone.
  for (const e of plan) {
    if (/^(one_cut|synthesis|kicker|closing)/.test(String(e.unit))) {
      v(violations, 'render_plan_banned_unit', `"${e.unit}" is not a unit; there is no cut, no synthesis, no kicker and no closing line.`, 'render_plan');
    }
  }

  // The plan ends on the bridge. `coverage` is chrome and may follow it.
  const prose = plan.filter((e) => e.unit !== 'coverage');
  const last = prose[prose.length - 1];
  if (!last || last.unit !== 'bridge') {
    v(violations, 'render_plan_does_not_end_on_bridge', `The last prose unit is "${last ? last.unit : '(none)'}"; the plan ends on "bridge" and nothing follows it.`, 'render_plan');
  }
  const coverageIdx = plan.findIndex((e) => e.unit === 'coverage');
  if (coverageIdx !== -1 && coverageIdx !== plan.length - 1) {
    v(violations, 'coverage_not_last', 'The "coverage" entry is chrome and is last in the plan.', 'render_plan');
  }

  // Exactly one bold entry, on a consequence unit whose finding has a
  // non-null why_it_matters, matching bold_designation.
  const bold = plan.filter((e) => e.bold === true);
  if (bold.length !== 1) {
    v(violations, 'bold_entry_count', `${bold.length} render_plan entries carry bold:true; exactly one does.`, 'render_plan');
  } else {
    const owner = bold[0].unit;
    if (!/^f[1-5]\.consequence$/.test(owner)) {
      v(violations, 'bold_entry_not_a_consequence', `The bold entry is "${owner}"; the bold line is a finding's consequence unit.`, 'render_plan');
    }
    const designated = outline.bold_designation && outline.bold_designation.claim_owner;
    if (designated && designated !== owner) {
      v(violations, 'bold_designation_desync', `bold_designation.claim_owner is "${designated}" but the bold plan entry is "${owner}".`, 'bold_designation');
    }
    const fid = owner.split('.')[0];
    const finding = (outline.findings || []).find((f) => f.id === fid);
    if (finding && (finding.why_it_matters === null || finding.why_it_matters === undefined)) {
      v(violations, 'bold_on_null_consequence', `The bold entry names ${owner}, but ${fid}.why_it_matters is null — there is no consequence sentence to bold.`, 'bold_designation');
    }
  }

  // --- the bijection, in both directions ------------------------------------
  const planClaims = [];
  for (const e of plan) {
    if (e.claim_free === true) {
      if (e.renders_claim) {
        v(violations, 'claim_free_entry_carries_claim', `"${e.unit}" is marked claim_free but names a claim.`, 'render_plan');
      }
      if (e.unit !== 'gap.named_facts' && e.unit !== 'coverage') {
        v(violations, 'claim_free_unit_not_chrome', `"${e.unit}" is marked claim_free; only gap.named_facts and coverage are claim-free chrome.`, 'render_plan');
      }
      continue;
    }
    if (!e.renders_claim) {
      v(violations, 'plan_entry_without_ledger_claim', `"${e.unit}" carries no renders_claim and is not claim-free. An un-ledgered sentence is the failure the plan exists to remove: delete the entry, or ledger its proposition.`, 'render_plan');
      continue;
    }
    planClaims.push({ unit: e.unit, claim: e.renders_claim });
  }

  const seenClaim = new Map();
  for (const { unit, claim } of planClaims) {
    if (seenClaim.has(claim)) {
      v(violations, 'duplicate_claim_string', `The claim ${JSON.stringify(claim.slice(0, 70))} is rendered by both "${seenClaim.get(claim)}" and "${unit}"; no claim appears on two entries.`, 'render_plan');
    }
    seenClaim.set(claim, unit);
  }

  const ledgerClaims = new Set(ledger.map((l) => l.claim));
  for (const { unit, claim } of planClaims) {
    if (!ledgerClaims.has(claim)) {
      v(violations, 'plan_claim_not_in_ledger', `"${unit}" renders a claim string that is not in claim_ledger[]: ${JSON.stringify(claim.slice(0, 70))}`, 'render_plan');
    }
  }
  const rendered = new Set(planClaims.map((p) => p.claim));
  for (const l of ledger) {
    if (!rendered.has(l.claim)) {
      v(violations, 'ledger_claim_not_rendered', `claim_ledger carries a claim no plan entry renders — it is never going to be said, so delete it: ${JSON.stringify(String(l.claim).slice(0, 70))}`, 'claim_ledger');
    }
  }

  // Ownership: the ledger's owner must be the unit that renders it.
  const ownerByClaim = new Map(ledger.map((l) => [l.claim, l.owner]));
  for (const { unit, claim } of planClaims) {
    const owner = ownerByClaim.get(claim);
    if (owner && owner !== unit) {
      v(violations, 'ledger_owner_desync', `claim_ledger licenses "${owner}" to state a claim that "${unit}" renders.`, 'claim_ledger');
    }
  }
  const ownerSeen = new Set();
  for (const l of ledger) {
    if (ownerSeen.has(l.claim)) {
      v(violations, 'ledger_duplicate_claim', `claim_ledger lists ${JSON.stringify(String(l.claim).slice(0, 70))} twice; one proposition, one entry.`, 'claim_ledger');
    }
    ownerSeen.add(l.claim);
  }

  // --- the v5.3 cross-node entailment sweep ---------------------------------
  // The ledger runs while the claims are still moving. This runs over the final
  // list of sentences, every ordered pair, which is the only view that matches
  // what the reader gets.
  for (let i = 0; i < planClaims.length; i++) {
    for (let j = i + 1; j < planClaims.length; j++) {
      if (sameClaim(planClaims[i].claim, planClaims[j].claim)) {
        v(
          violations,
          'plan_entries_entail_each_other',
          `"${planClaims[i].unit}" and "${planClaims[j].unit}" carry one proposition between them: ` +
            `${JSON.stringify(planClaims[i].claim.slice(0, 60))} / ${JSON.stringify(planClaims[j].claim.slice(0, 60))}. ` +
            'Strip the loser to what it alone carries, or delete its entry and its ledger claim.',
          'render_plan',
        );
      }
    }
  }

  // Sizing is recorded, not enforced — the word floor is checked on the prose.
  const check = (outline.truth_check && outline.truth_check.render_plan_check) || {};
  if (check.entry_count !== undefined && check.entry_count !== plan.length) {
    v(violations, 'render_plan_count_mismatch', `truth_check.render_plan_check.entry_count is ${check.entry_count}; the plan has ${plan.length} entries.`, 'truth_check.render_plan_check');
  }
  if (check.bold_entries !== undefined && check.bold_entries !== bold.length) {
    v(violations, 'render_plan_bold_count_mismatch', `truth_check.render_plan_check.bold_entries is ${check.bold_entries}; ${bold.length} entries carry bold:true.`, 'truth_check.render_plan_check');
  }
}

// --- findings, lanes, coverage ----------------------------------------------

function checkFindings(outline, maps, violations) {
  const findings = Array.isArray(outline.findings) ? outline.findings : [];
  if (findings.length < 2 || findings.length > 5) {
    v(violations, 'finding_count_out_of_range', `${findings.length} findings; two to five, and two only when the ledger dropped one.`, 'findings');
  }

  const laneSeen = new Set();
  const exhibitKeys = new Map();
  findings.forEach((f, i) => {
    const path = `findings[${i}]`;
    if (!LANES.includes(f.lane)) {
      v(violations, 'unknown_lane', `"${f.lane}" is not one of the six lanes.`, path);
    }
    if (laneSeen.has(f.lane)) {
      v(violations, 'duplicate_finding_lane', `Lane "${f.lane}" carries two findings; no two findings may share a lane.`, path);
    }
    laneSeen.add(f.lane);

    if (f.verdict === 'ABSENT') {
      if (!Array.isArray(f.searched) || f.searched.length === 0) {
        v(violations, 'absent_without_surfaces', `${f.id} is ABSENT but names no surfaces searched.`, path);
      }
    } else {
      checkExhibit(f.exhibit, `${path}.exhibit`, maps, violations, { required: true });
    }
    if (f.verdict === 'DOCUMENTATION' && !f.buried_on) {
      v(violations, 'verdict_field_missing', `${f.id} is DOCUMENTATION but does not name the page it sits on.`, path);
    }
    if (f.exhibit) checkExhibit(f.exhibit, `${path}.exhibit`, maps, violations);

    if (typeof f.claim === 'string') {
      if (f.claim.includes(';')) {
        v(violations, 'claim_not_one_clause', `${f.id}.claim carries a semicolon; a claim is one clause, and two clauses are two claims.`, path);
      }
      if (/\byou\b|\byour\b/i.test(f.claim)) {
        v(violations, 'claim_not_one_clause', `${f.id}.claim uses the second person; claims are working notes, and second person in one means pass 1 started writing prose.`, path);
      }
      if (CADENCE_WORDS.test(f.claim) && (!Array.isArray(f.dates_cited) || f.dates_cited.length < 2)) {
        v(violations, 'cadence_without_two_dates', `${f.id} claims a cadence or series but cites fewer than two dates. A publishing claim needs two separately dated items.`, path);
      }
    }

    if (f.why_it_matters && f.claim && sameClaim(f.claim, f.why_it_matters)) {
      v(violations, 'why_it_matters_restates_claim', `${f.id}.why_it_matters restates its own claim. A reader who accepted one has already accepted the other: set why_it_matters null and drop the consequence unit.`, path);
    }

    if (f.exhibit && f.exhibit.page) {
      const key = `${f.exhibit.page}|${f.exhibit.quote || f.exhibit.reference || ''}`;
      if (exhibitKeys.has(key)) {
        v(violations, 'duplicate_exhibit', `${f.id} reuses the exhibit already spent by ${exhibitKeys.get(key)}.`, path);
      }
      exhibitKeys.set(key, f.id);
    }
  });

  // strongest_true_thing: required exactly when no finding is TRANSMISSION.
  const anyTransmission = findings.some((f) => f.verdict === 'TRANSMISSION');
  if (!anyTransmission && !outline.strongest_true_thing) {
    v(violations, 'strongest_true_thing_required', 'No finding came back TRANSMISSION, so strongest_true_thing is required.', 'strongest_true_thing');
  }
  if (outline.strongest_true_thing) {
    checkExhibit(outline.strongest_true_thing.exhibit, 'strongest_true_thing.exhibit', maps, violations, { required: true });
    const ex = outline.strongest_true_thing.exhibit;
    if (ex && ex.page) {
      const key = `${ex.page}|${ex.quote || ex.reference || ''}`;
      if (exhibitKeys.has(key)) {
        v(violations, 'duplicate_exhibit', `strongest_true_thing reuses the exhibit already spent by ${exhibitKeys.get(key)}.`, 'strongest_true_thing');
      }
      exhibitKeys.set(key, 'strongest_true_thing');
    }
  }

  // Skim claims.
  const skim = Array.isArray(outline.skim_claims) ? outline.skim_claims : [];
  if (skim.length < 2 || skim.length > 3) {
    v(violations, 'skim_count_out_of_range', `${skim.length} skim claims; two or three at this budget.`, 'skim_claims');
  }
  if (!skim.some((s) => s.dimension === 'positioning_legibility')) {
    v(violations, 'skim_missing_positioning', 'positioning_legibility is always present among the skim claims.', 'skim_claims');
  }
  const dims = new Set();
  skim.forEach((s, i) => {
    if (!SKIM_DIMENSIONS.includes(s.dimension)) {
      v(violations, 'unknown_skim_dimension', `"${s.dimension}" is not a skim dimension.`, `skim_claims[${i}]`);
    }
    if (dims.has(s.dimension)) {
      v(violations, 'duplicate_skim_dimension', `Skim dimension "${s.dimension}" is used twice.`, `skim_claims[${i}]`);
    }
    dims.add(s.dimension);
    checkExhibit(s.exhibit, `skim_claims[${i}].exhibit`, maps, violations, { required: true, homepageOnly: true });
    const key = s.exhibit && s.exhibit.page ? `${s.exhibit.page}|${s.exhibit.quote || s.exhibit.reference || ''}` : null;
    if (key && exhibitKeys.has(key)) {
      v(violations, 'duplicate_exhibit', `skim_claims[${i}] reuses the exhibit already spent by ${exhibitKeys.get(key)}.`, `skim_claims[${i}]`);
    }
    if (key) exhibitKeys.set(key, `skim_claims[${i}]`);
  });
}

function checkLaneAccounting(outline, violations) {
  const findings = Array.isArray(outline.findings) ? outline.findings : [];
  const sel = outline.lane_selection || {};
  const chosen = Array.isArray(sel.chosen) ? sel.chosen : [];
  const laneOrder = findings.map((f) => f.lane);

  if (chosen.length !== laneOrder.length || chosen.some((l, i) => l !== laneOrder[i])) {
    v(violations, 'lane_selection_desync', 'lane_selection.chosen must be the findings\' lanes, in finding order. It is derived, not decided twice.', 'lane_selection.chosen');
  }
  if (chosen.length >= 3) {
    const idx = chosen.map((l) => LANES.indexOf(l));
    if (idx.every((n, i) => i === 0 || n > idx[i - 1])) {
      v(violations, 'lane_order_defaulted', 'chosen[] is in the prompt\'s own lane order; order by strength of evidence instead.', 'lane_selection.chosen');
    }
  }
  const rejected = Array.isArray(sel.rejected) ? sel.rejected : [];
  const rejectedNames = new Set(rejected.map((r) => r.lane));
  const chosenSet = new Set(chosen);
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

  const cov = outline.coverage;
  if (cov && cov.lanes_examined !== chosen.length) {
    v(violations, 'coverage_count_mismatch', `coverage.lanes_examined is ${cov.lanes_examined}; ${chosen.length} lanes were chosen.`, 'coverage');
  }
}

// --- the absence gate -------------------------------------------------------

function checkAbsenceGate(outline, violations) {
  const tc = outline.truth_check || {};
  const negatives = Array.isArray(tc.negative_claims) ? tc.negative_claims : [];

  // Run over the CLAIMS, not over prose. The gate belongs where the claim is
  // made; re-gating it downstream against a field the read does not carry is
  // how a check quietly becomes a no-op that still looks like a check.
  const claims = [];
  for (const f of outline.findings || []) {
    if (f.claim) claims.push([`${f.id}.claim`, f.claim]);
    if (f.why_it_matters) claims.push([`${f.id}.why_it_matters`, f.why_it_matters]);
  }
  for (const [i, s] of (outline.skim_claims || []).entries()) {
    if (s.claim) claims.push([`skim_claims[${i}]`, s.claim]);
  }
  if (outline.gap && outline.gap.what_a_stranger_gets_claim) {
    claims.push(['gap.what_a_stranger_gets_claim', outline.gap.what_a_stranger_gets_claim]);
  }
  for (const key of ['scale_of_change', 'page_that_must_move', 'what_a_stranger_cannot_do']) {
    const val = outline.bridge_material && outline.bridge_material[key];
    if (val) claims.push([`bridge_material.${key}`, val]);
  }

  for (const [path, claim] of claims) {
    if (!ABSENCE_MARKERS.test(claim)) continue;
    const record = negatives.find((n) => n.claim && sameClaim(n.claim, claim));
    if (!record) {
      v(violations, 'absence_claim_without_scan', `${path} claims an absence with no scan record in truth_check.negative_claims. An absence claim with no scan record is deleted, not softened: ${JSON.stringify(claim.slice(0, 70))}`, path);
      continue;
    }
    if (FEED_WORDS.test(claim)) {
      const surfaces = (record.surfaces_scanned || []).join(' ').toLowerCase();
      if (!surfaces.includes('embedded_feed') || !(surfaces.includes('gallery') || surfaces.includes('embed'))) {
        v(violations, 'feed_claim_missed_feeds', `${path} claims something about feeds, grids or posts without recording embedded_feeds and gallery/embed blocks among the surfaces scanned. Telling someone their feed is nowhere on their site while their front page is a wall of it is the single most damaging error this read makes.`, path);
      }
    }
  }

  negatives.forEach((n, i) => {
    const path = `truth_check.negative_claims[${i}]`;
    if (!Array.isArray(n.pages_scanned) || n.pages_scanned.length === 0) {
      v(violations, 'negative_claim_missing_pages', `${path} names no pages scanned.`, path);
    }
    if (!Array.isArray(n.search_terms) || n.search_terms.length === 0) {
      v(violations, 'negative_claim_missing_terms', `${path} names no search terms.`, path);
    }
    if (n.counterexample_found === true) {
      v(violations, 'negative_claim_contradicted', `${path} found a counterexample; the claim is rewritten as a bounded observation or deleted.`, path);
    }
  });
}

// --- gap facts, first screen, numbers ---------------------------------------

function checkGapAndFirstScreen(outline, fs, maps, violations) {
  const gap = outline.gap;
  if (gap && Array.isArray(gap.named_facts)) {
    gap.named_facts.forEach((nf, i) => {
      const path = `gap.named_facts[${i}]`;
      if (!nf.page || !maps.fetched.has(nf.page)) {
        v(violations, 'named_fact_page_not_fetched', `${path} cites page "${nf.page}", which was not retrieved.`, path);
        return;
      }
      const text = maps.text.get(nf.page) || '';
      if (!nf.source_sentence || !text.includes(nf.source_sentence)) {
        v(violations, 'named_fact_sentence_not_in_page', `${path}.source_sentence is not an exact substring of "${nf.page}".`, path);
        return;
      }
      // One credential, one sentence: every capitalised token of the fact has
      // to sit inside the sentence that states it. This is what catches the
      // degree-from-one-sentence, institution-from-another weld.
      const caps = String(nf.fact || '').match(/\b[A-Z][A-Za-z'’-]+/g) || [];
      for (const token of caps) {
        if (!nf.source_sentence.includes(token)) {
          v(violations, 'named_fact_welded', `${path} names "${token}", which is not in its own source_sentence. A credential welded out of two sentences is a fact that exists on neither.`, path);
          break;
        }
      }
    });
  }

  const fsHead = fs.first_screen_headline ? fs.first_screen_headline.text : null;
  const used = outline.first_screen ? outline.first_screen.headline_verbatim : undefined;
  if (outline.first_screen) {
    if (fsHead === null && used) {
      v(violations, 'first_screen_headline_altered', 'The fact sheet carries no first-screen headline, but one was reported.', 'first_screen.headline_verbatim');
    } else if (fsHead && used !== fsHead) {
      v(violations, 'first_screen_headline_altered', `first_screen.headline_verbatim must be the computed string ${JSON.stringify(fsHead)}; it is copied, not chosen.`, 'first_screen.headline_verbatim');
    }
  }
}

function checkOutlineNumbers(outline, fs, violations) {
  const grounded = groundedNumbers(fs);
  const strings = [];
  const collect = (node) => {
    if (typeof node === 'string') strings.push(node);
    else if (Array.isArray(node)) node.forEach(collect);
    else if (node && typeof node === 'object') Object.values(node).forEach(collect);
  };
  // Only the claim-bearing prose material — never the page text carried in
  // source_span or source_sentence, which is the site's own words and grounds
  // itself.
  collect(outline.findings ? outline.findings.map((f) => [f.claim, f.why_it_matters]) : []);
  collect((outline.skim_claims || []).map((s) => s.claim));
  collect(outline.bridge_material);
  collect(outline.first_screen ? [outline.first_screen.front_door_function, outline.first_screen.stranger_result] : []);
  collect(outline.gap ? outline.gap.what_a_stranger_gets_claim : null);
  collect(outline.strongest_true_thing ? outline.strongest_true_thing.claim : null);

  const hay = strings.join(' ');
  for (const n of (hay.match(/\b\d+\b/g) || []).map(Number)) {
    if (!grounded.has(n)) {
      v(violations, 'outline_number_not_grounded', `"${n}" in the outline's claims matches no count in the fact sheet. Nothing is counted by the model, and nothing is combined from two facts.`, 'findings');
    }
  }
  const lower = hay.toLowerCase();
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`(?<![A-Za-z])${word}(?![A-Za-z])`).test(lower) && !grounded.has(value)) {
      v(violations, 'outline_number_not_grounded', `"${word}" in the outline's claims matches no count in the fact sheet.`, 'findings');
    }
  }
}

function checkBridgeMaterial(outline, violations) {
  const bm = outline.bridge_material;
  if (!bm) {
    v(violations, 'bridge_material_missing', 'bridge_material is required when status is "read"; all three moves are filled because this pass does not know which one the writer is assigned.', 'bridge_material');
    return;
  }
  for (const key of ['scale_of_change', 'page_that_must_move', 'what_a_stranger_cannot_do']) {
    if (!bm[key]) {
      v(violations, 'bridge_material_incomplete', `bridge_material.${key} is empty. The writer is assigned one of the three and this outline does not know which.`, 'bridge_material');
    }
  }
  const candidates = Array.isArray(bm.concrete_anchor_candidates) ? bm.concrete_anchor_candidates : [];
  if (candidates.length < 2) {
    v(violations, 'anchor_candidates_too_few', `${candidates.length} concrete_anchor_candidates; at least two, so the writer has a real choice.`, 'bridge_material');
  }
  // Each candidate has to be findable somewhere the writer can point at.
  const hay = JSON.stringify([outline.findings, outline.gap, outline.first_screen, outline.skim_claims, outline.strongest_true_thing]);
  for (const c of candidates) {
    if (!hay.includes(c)) {
      v(violations, 'anchor_candidate_not_findable', `The anchor candidate ${JSON.stringify(c)} does not appear in the findings, the gap facts or the first-screen block. The writer plants it literally, so it has to survive being dropped into prose whole.`, 'bridge_material');
    }
  }
}

// --- entry point ------------------------------------------------------------

/**
 * @param {object} outline
 * @param {import('./types.js').FactSheet} fs
 * @returns {{ok:boolean, violations:import('./types.js').Violation[]}}
 */
export function validateOutline(outline, fs) {
  const violations = [];
  try {
    if (!outline || typeof outline !== 'object') {
      v(violations, 'not_an_object', 'Outline is not a JSON object.');
      return { ok: false, violations };
    }
    const valid = ['read', 'decline_product_company', 'decline_thin', 'decline_unfetchable'];
    if (!valid.includes(outline.status)) {
      v(violations, 'unrecognized_status', `status must be one of ${valid.join(', ')}; got ${JSON.stringify(outline.status)}.`, 'status');
      return { ok: false, violations };
    }

    const maps = pageMaps(fs);

    if (outline.status !== 'read') {
      const dm = outline.decline_material;
      if (!dm || !dm.reason) {
        v(violations, 'decline_material_missing', 'A decline still carries decline_material naming what was found.', 'decline_material');
      }
      if (dm && dm.exhibit) checkExhibit(dm.exhibit, 'decline_material.exhibit', maps, violations);
      return { ok: violations.length === 0, violations };
    }

    for (const field of ['first_screen', 'skim_claims', 'gap', 'findings', 'lane_selection', 'coverage', 'bridge_material', 'claim_ledger', 'render_plan', 'bold_designation']) {
      if (outline[field] === null || outline[field] === undefined) {
        v(violations, 'missing_required_block', `"${field}" is required when status is "read".`, field);
      }
    }

    checkRenderPlan(outline, violations);
    checkFindings(outline, maps, violations);
    checkLaneAccounting(outline, violations);
    checkAbsenceGate(outline, violations);
    checkGapAndFirstScreen(outline, fs, maps, violations);
    checkOutlineNumbers(outline, fs, violations);
    checkBridgeMaterial(outline, violations);
  } catch (err) {
    v(violations, 'outline_validator_crash', String((err && err.message) || err));
  }
  return { ok: violations.length === 0, violations };
}

export { sameClaim, SIMILARITY_THRESHOLD };
