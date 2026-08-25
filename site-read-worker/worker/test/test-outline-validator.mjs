// Outline validator — every check gets a mutation that should trip it.
//
// The two that earn their keep are the bijection (a plan entry with no ledger
// claim is the un-ledgered sentence the whole mechanism exists to remove) and
// the v5.3 cross-node entailment sweep, which runs over the FINAL plan and
// catches the pair the ledger could not, because when the ledger compared them
// neither had its final wording yet.

import { describe, ok, eq, report } from './_harness.mjs';
import { buildFixtureFactSheet } from './_fixtureSite.mjs';
import { buildPassingOutline } from './_fixtureOutline.mjs';
import { validateOutline } from '../src/outlineValidator.js';

const fs = buildFixtureFactSheet();
const clone = (o) => structuredClone(o);
const codes = (o) => validateOutline(o, fs).violations.map((v) => v.code);

describe('a correct outline passes every check');
const good = buildPassingOutline(fs);
const goodResult = validateOutline(good, fs);
ok(goodResult.ok, 'the hand-written outline is clean', JSON.stringify(goodResult.violations.map((v) => `${v.code}: ${v.message}`), null, 1));

function mutate(label, expectedCode, fn) {
  const o = clone(good);
  fn(o);
  const got = codes(o);
  ok(got.includes(expectedCode), `${label} -> ${expectedCode}`, `got: ${got.join(', ') || '(none)'}`);
}

describe('the render plan is the list of sentences that exist at all');
mutate('a plan entry carrying no ledger claim', 'plan_entry_without_ledger_claim', (o) => {
  o.render_plan[5].renders_claim = null;
});
mutate('a ledger claim no plan entry renders', 'ledger_claim_not_rendered', (o) => {
  o.claim_ledger.push({ claim: 'a claim nobody will ever say out loud', owner: 'bridge', also_claimed_by: [], action_taken: 'unique' });
});
mutate('a plan entry rendering a claim the ledger does not hold', 'plan_claim_not_in_ledger', (o) => {
  o.render_plan[5].renders_claim = 'something the ledger never heard about';
});
mutate('one claim on two entries', 'duplicate_claim_string', (o) => {
  o.render_plan[8].renders_claim = o.render_plan[5].renders_claim;
});
mutate('a seq with a gap in it', 'render_plan_seq_not_contiguous', (o) => {
  o.render_plan[3].seq = 99;
});
mutate('a unit used twice', 'render_plan_duplicate_unit', (o) => {
  o.render_plan[8].unit = 'f2.claim';
});
mutate('a resurrected cut', 'render_plan_banned_unit', (o) => {
  o.render_plan[10].unit = 'one_cut';
});
mutate('a kicker after the bridge', 'render_plan_does_not_end_on_bridge', (o) => {
  o.render_plan.splice(11, 0, { seq: 12, unit: 'kicker', renders_claim: null, claim_free: true, bold: false, source_node: 'bridge_material' });
  o.render_plan.forEach((e, i) => { e.seq = i + 1; });
});
mutate('the ledger licensing a unit the plan does not use', 'ledger_owner_desync', (o) => {
  o.claim_ledger[4].owner = 'f2.consequence';
});
mutate('chrome that carries a claim', 'claim_free_entry_carries_claim', (o) => {
  o.render_plan[3].renders_claim = 'the names, recited';
});
mutate('an entry_count that disagrees with the plan', 'render_plan_count_mismatch', (o) => {
  o.truth_check.render_plan_check.entry_count = 3;
});

describe('exactly one bold entry, on a consequence with something to say');
mutate('two bold entries', 'bold_entry_count', (o) => {
  o.render_plan[7].bold = true;
});
mutate('no bold entry', 'bold_entry_count', (o) => {
  o.render_plan[6].bold = false;
});
mutate('a bold entry that is not a consequence', 'bold_entry_not_a_consequence', (o) => {
  o.render_plan[6].bold = false;
  o.render_plan[7].bold = true;
  o.bold_designation.claim_owner = 'f2.claim';
});
mutate('bold_designation naming a different unit', 'bold_designation_desync', (o) => {
  o.bold_designation.claim_owner = 'f3.consequence';
});
mutate('bolding a consequence that was set null', 'bold_on_null_consequence', (o) => {
  o.findings[0].why_it_matters = null;
});

describe('the cross-node entailment sweep, over the FINAL plan');
mutate('a skim claim that is a finding four entries later at a different altitude', 'plan_entries_entail_each_other', (o) => {
  const restated = 'no writing about the practice renders on either page retrieved';
  o.skim_claims[1].claim = restated;
  o.claim_ledger[2].claim = restated;
  o.render_plan[2].renders_claim = restated;
});
mutate('a bridge that is the gap claim in other words', 'plan_entries_entail_each_other', (o) => {
  const restated = 'someone who never meets the owner leaves with sentences and a menu of doors';
  o.bridge_material.what_a_stranger_cannot_do = restated;
  o.claim_ledger[9].claim = restated;
  o.render_plan[10].renders_claim = restated;
});
mutate('a consequence that is its own claim generalized', 'why_it_matters_restates_claim', (o) => {
  o.findings[0].why_it_matters = 'the teaching post sits on a second page';
});

describe('every quoted exhibit carries the sentence it came out of');
mutate('a quote with no source span', 'exhibit_quote_without_source_span', (o) => {
  o.findings[0].exhibit.source_span = null;
});
mutate('a source span that is not on the page', 'source_span_not_in_page_text', (o) => {
  o.findings[0].exhibit.source_span = 'She has taught sound design at Leeds Arts University since 2018.';
});
mutate('a span that does not contain its own quote', 'quote_not_inside_source_span', (o) => {
  o.findings[0].exhibit.source_span = 'Mara trained at the Royal Northern College of Music.';
});
mutate('a quote that is one word off the page', 'quote_not_in_page_text', (o) => {
  o.findings[1].exhibit.quote = 'The studio has run since 2015 out of a converted mill in Leeds.';
  o.findings[1].exhibit.source_span = 'The studio has run since 2015 out of a converted mill in Leeds.';
});
mutate('an exhibit on a page that was never retrieved', 'exhibit_page_not_fetched', (o) => {
  o.findings[0].exhibit.page = 'Work';
});
mutate('a skim exhibit off the homepage', 'skim_exhibit_off_homepage', (o) => {
  o.skim_claims[0].exhibit.page = 'About';
});
mutate('two nodes spending the same exhibit', 'duplicate_exhibit', (o) => {
  o.skim_claims[1].exhibit = clone(o.findings[1].exhibit);
});

describe('the ABSENT lane, and the null exhibit the schema always allowed');
ok(good.findings[2].verdict === 'ABSENT' && good.findings[2].exhibit === null, 'the fixture exercises it');
ok(!codes(good).includes('missing_exhibit'), 'ABSENT with searched[] needs no exhibit');
mutate('ABSENT naming no surfaces', 'absent_without_surfaces', (o) => {
  o.findings[2].searched = [];
});
mutate('DOCUMENTATION not naming its page', 'verdict_field_missing', (o) => {
  o.findings[0].buried_on = null;
});

describe('claims are working notes, not sentences');
mutate('a claim in the second person', 'claim_not_one_clause', (o) => {
  o.findings[1].claim = 'your decade in a converted mill is stated third';
  o.claim_ledger[6].claim = o.findings[1].claim;
  o.render_plan[7].renders_claim = o.findings[1].claim;
});
mutate('a claim carrying two clauses', 'claim_not_one_clause', (o) => {
  o.findings[1].claim = 'a decade sits third; the line above it is about sound';
  o.claim_ledger[6].claim = o.findings[1].claim;
  o.render_plan[7].renders_claim = o.findings[1].claim;
});
mutate('a cadence claimed off one date', 'cadence_without_two_dates', (o) => {
  o.findings[1].claim = 'the studio posts monthly about the work it makes';
  o.claim_ledger[6].claim = o.findings[1].claim;
  o.render_plan[7].renders_claim = o.findings[1].claim;
});

describe('the absence gate runs on the claim, not on the prose');
mutate('an absence claim with no scan record', 'absence_claim_without_scan', (o) => {
  o.truth_check.negative_claims = o.truth_check.negative_claims.filter((n) => !/no writing/.test(n.claim));
});
mutate('a scan that found a counterexample', 'negative_claim_contradicted', (o) => {
  o.truth_check.negative_claims[0].counterexample_found = true;
});
mutate('a no-feed claim that never looked at the feeds', 'feed_claim_missed_feeds', (o) => {
  // Telling someone no grid renders on their site while their front page is a
  // wall of it is the single most damaging error this read makes.
  const claim = 'no posts and no gallery grid render on either retrieved page';
  o.findings[2].claim = claim;
  o.claim_ledger[7].claim = claim;
  o.render_plan[8].renders_claim = claim;
  o.truth_check.negative_claims[0].claim = claim;
  o.truth_check.negative_claims[0].surfaces_scanned = ['the menu', 'the footer'];
});

describe('names, numbers and the first screen');
mutate('a credential welded out of two sentences', 'named_fact_welded', (o) => {
  o.gap.named_facts[2].fact = 'taught sound design at the Royal Northern College of Music since 2019';
  o.gap.named_facts[2].source_sentence = 'She has taught sound design at Leeds Arts University since 2019.';
});
mutate('a source sentence that is not on the page', 'named_fact_sentence_not_in_page', (o) => {
  o.gap.named_facts[0].source_sentence = 'The studio has run since 2014 and she trained at the Royal Northern College of Music.';
});
mutate('a number nobody counted from the fact sheet', 'outline_number_not_grounded', (o) => {
  o.findings[1].claim = 'a decade across 47 rooms is stated third, under a line about sound';
  o.claim_ledger[6].claim = o.findings[1].claim;
  o.render_plan[7].renders_claim = o.findings[1].claim;
});
mutate('a substituted headline', 'first_screen_headline_altered', (o) => {
  o.first_screen.headline_verbatim = 'Mara Feldt designs sound';
});

describe('lanes and bridge material');
mutate('chosen out of step with the findings', 'lane_selection_desync', (o) => {
  o.lane_selection.chosen = ['spine_story', 'credibility_surface', 'long_form_writing'];
});
mutate('a lane neither chosen nor rejected', 'lane_not_accounted_for', (o) => {
  o.lane_selection.rejected.pop();
});
mutate('two findings in one lane', 'duplicate_finding_lane', (o) => {
  o.findings[1].lane = 'credibility_surface';
});
mutate('bridge material with a move left empty', 'bridge_material_incomplete', (o) => {
  o.bridge_material.page_that_must_move = '';
});
mutate('an anchor candidate nothing can point at', 'anchor_candidate_not_findable', (o) => {
  o.bridge_material.concrete_anchor_candidates[0] = 'the Ridgeway Sessions';
});

describe('a decline outline still carries its material');
const decline = {
  schema_version: '5.3-outline',
  site_url: fs.site_url,
  status: 'decline_thin',
  decline_material: { reason: 'One screen of links and images, with no sentences about the work.', exhibit: null },
};
ok(validateOutline(decline, fs).ok, 'a decline outline passes', JSON.stringify(validateOutline(decline, fs).violations));
eq(
  validateOutline({ ...decline, decline_material: null }, fs).violations.map((v) => v.code),
  ['decline_material_missing'],
  'a decline with nothing behind it is caught',
);

process.exit(report() > 0 ? 1 : 0);
