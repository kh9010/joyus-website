// Validator + repair-loop tests. Every check gets a mutation that should trip
// it, plus a regression test for the two guards this merge exists to fix: the
// word-boundary banned sweep, and number grounding that never reads the model's
// own self_check.

import { describe, ok, eq, report } from './_harness.mjs';
import { buildFixtureFactSheet } from './_fixtureSite.mjs';
import { buildPassingRead } from './_fixtureRead.mjs';
import { validate, assembleRenderedProse } from '../src/validator.js';
import { ANALYSIS_PROMPT } from '../src/analysisPrompt.js';
import { runWithRepair, buildFailSafeOutput } from '../src/repairLoop.js';
import { SCHEMA_VERSION } from '../src/types.js';

const fs = buildFixtureFactSheet();
const clone = (o) => structuredClone(o);
const run = (out) => validate(out, fs, ANALYSIS_PROMPT);
const codes = (out) => run(out).violations.map((v) => v.code);

describe('a correct read passes every check');
const good = buildPassingRead(fs);
const goodResult = run(good);
ok(goodResult.ok, 'the hand-written read is clean', JSON.stringify(goodResult.violations.map((v) => `${v.code}: ${v.message}`), null, 1));
const words = assembleRenderedProse(good).split(/\s+/).filter(Boolean).length;
ok(words >= 350 && words <= 600, `rendered prose is ${words} words, inside 350-600`);

function mutate(label, expectedCode, fn) {
  const out = clone(good);
  fn(out);
  const got = codes(out);
  ok(got.includes(expectedCode), `${label} -> ${expectedCode}`, `got: ${got.join(', ') || '(none)'}`);
}

describe('quotes and named facts must be character-exact');
mutate('a quote that is one word off', 'quote_not_exact', (o) => {
  o.lane_verdicts[1].exhibit.quote = 'The studio has run since 2015 out of a converted mill in Leeds.';
});
mutate('a source sentence stitched from two sentences', 'named_fact_sentence_not_exact', (o) => {
  o.gap.named_facts[0].source_sentence = 'The studio has run since 2014 and she trained at the Royal Northern College of Music.';
});
mutate('an exhibit citing a page that was never retrieved', 'exhibit_page_not_fetched', (o) => {
  o.lane_verdicts[0].exhibit.page = 'Work';
});
mutate('a skim exhibit taken from another page', 'skim_exhibit_off_homepage', (o) => {
  o.skim_read.tangibles.exhibit.page = 'About';
  o.skim_read.tangibles.exhibit.quote = 'Mara trained at the Royal Northern College of Music.';
});
mutate('a quoted exhibit with no speaker', 'exhibit_missing_speaker', (o) => {
  o.lane_verdicts[0].exhibit.speaker = '';
});
mutate('an exhibit with both a quote and a reference', 'exhibit_quote_or_reference', (o) => {
  o.lane_verdicts[0].exhibit.reference = 'the About page';
});
mutate('an exhibit pointing at a block that does not exist', 'exhibit_block_index_unknown', (o) => {
  o.skim_read.positioning_legibility.exhibit.block_index = 999;
});

describe('the first screen is computed, not chosen');
mutate('substituting a different headline', 'first_screen_headline_mismatch', (o) => {
  o.skim_read.first_screen_headline_used = 'Mara Feldt designs sound';
});
mutate('a positioning observation that drops the headline', 'positioning_missing_headline', (o) => {
  o.skim_read.positioning_legibility.observation =
    'The top of the page names a quality rather than a service, so someone landing cold cannot tell what you would be hired to make.';
});

describe('the shape directive is assigned, not chosen');
mutate('emitting a different cut shape', 'cut_shape_mismatch', (o) => {
  o.one_cut.shape = o.one_cut.shape === 'x_not_y' ? 'parallel_clauses' : 'x_not_y';
});
mutate('not echoing the directive', 'shape_directive_not_echoed', (o) => {
  o.shape_directive_used.bridge_move = 'page_that_must_move';
});
const conflictOut = clone(good);
conflictOut.one_cut.shape = conflictOut.one_cut.shape === 'x_not_y' ? 'parallel_clauses' : 'x_not_y';
conflictOut.self_check.shape_conflict = {
  slot: 'one_cut',
  assigned: good.one_cut.shape,
  why_it_could_not_be_made_true: 'The site carries no second clause to pair.',
};
ok(!codes(conflictOut).includes('cut_shape_mismatch'), 'a declared shape_conflict excuses the departure');

describe('lane selection has to be shown');
mutate('running five lanes', 'lane_count_out_of_range', (o) => {
  o.lane_verdicts.push(
    { ...clone(o.lane_verdicts[0]), lane: 'short_form_social' },
    { ...clone(o.lane_verdicts[0]), lane: 'publishing_rhythm' },
  );
  o.lane_selection.chosen.push('short_form_social', 'publishing_rhythm');
  o.lane_selection.rejected = o.lane_selection.rejected.filter(
    (r) => !['short_form_social', 'publishing_rhythm'].includes(r.lane),
  );
});
mutate('returning lanes in the prompt\'s own order', 'lane_order_defaulted', (o) => {
  o.lane_selection.chosen = ['spine_story', 'credibility_surface', 'long_form_writing'];
});
mutate('DOCUMENTATION without naming the page', 'documentation_missing_page', (o) => {
  o.lane_verdicts[0].buried_on = null;
});
mutate('ABSENT without naming what was searched', 'absent_missing_searched', (o) => {
  o.lane_verdicts[2].searched = [];
});
mutate('a generic rejection reason', 'rejection_reason_generic', (o) => {
  o.lane_selection.rejected[0].reason = 'Not enough material to judge.';
});
mutate('no bold line at all', 'missing_bold_line', (o) => {
  o.lane_verdicts[0].bold_line = null;
});
mutate('every bold line over fifteen words', 'no_short_bold_line', (o) => {
  o.lane_verdicts[0].bold_line =
    'Your credentials sit one whole page away from the person who is currently deciding whether to trust you with a room and a budget.';
});
mutate('no TRANSMISSION and no strongest true thing', 'missing_strongest_true_thing', (o) => {
  o.strongest_true_thing = null;
});

describe('coverage is chrome, and it has to be complete');
mutate('a coverage count that disagrees with the lanes run', 'coverage_count_mismatch', (o) => {
  o.coverage.lanes_examined = 5;
});
mutate('dropping a lane from coverage', 'coverage_missing_lane', (o) => {
  o.coverage.not_examined.pop();
});
mutate('an undeclared unfetched offer page', 'undeclared_unfetched_offer_page', (o) => {
  o.coverage.unfetched_pages = [];
});
mutate('a coverage reason running long', 'coverage_reason_too_long', (o) => {
  o.coverage.not_examined[0].reason =
    'There are only two pages here and nothing at all has been sequenced in a way worth reading closely';
});

describe('numbers are copied, never counted');
mutate('a number that is nowhere in the fact sheet', 'number_not_grounded', (o) => {
  o.one_cut.text = 'A decade of sound made across 47 rooms reaches a visitor as one adjective.';
});
const launderer = clone(good);
launderer.one_cut.text = 'A decade of sound made across 47 rooms reaches a visitor as one adjective.';
launderer.self_check.rooms_counted = 47;
ok(
  codes(launderer).includes('number_not_grounded'),
  'a number the model whitelists in its own self_check is still ungrounded',
);
mutate('a spelled-out count with nothing behind it', 'number_not_grounded', (o) => {
  o.gap.what_a_stranger_gets = 'A visitor who never gets you in a room comes away with seventeen sentences.';
});

describe('banned vocabulary, on word boundaries only');
mutate('a hedge', 'banned_hedge', (o) => {
  o.opening.text = "Your front page is just one line about sound and four menu words, and that's the whole of it.";
});
mutate('a machinery word', 'banned_machinery_word', (o) => {
  o.opening.text = "Your front page carries no evidence of the work, and that's the whole of it for a visitor.";
});
const arcTest = clone(good);
arcTest.strongest_true_thing.text = 'Your research architecture is clear in March, and the mill sentence carries a decade in one line.';
const arcCodes = codes(arcTest);
ok(!arcCodes.includes('banned_metaphor'), '"research", "architecture" and "March" do not trip the ban on "arc"', arcCodes.join(', '));
const laneWordTest = clone(good);
laneWordTest.strongest_true_thing.text = 'Melanie is named on the page, and the mill sentence carries a decade in one line.';
ok(!codes(laneWordTest).includes('banned_machinery_word'), '"Melanie" does not trip the ban on "lane"');
mutate('a bare "arc"', 'banned_metaphor', (o) => {
  o.strongest_true_thing.text = 'The arc of the mill sentence puts a decade and a place into one line.';
});
mutate('the bridge naming an engagement', 'banned_bridge_term', (o) => {
  o.bridge.text = `${o.bridge.text} Joyus would start there.`;
  o.bridge.concrete_anchor = 'the Vaults Festival score';
});
mutate('the bridge naming a duration', 'bridge_names_offer_mechanics', (o) => {
  o.bridge.text = `${o.bridge.text} That is 6 weeks of work.`;
});

describe('mechanical caps');
mutate('a rhetorical question', 'rhetorical_question', (o) => {
  o.one_cut.text = 'What does a decade in a converted mill reach a visitor as?';
});
mutate('a two-sentence one cut', 'one_cut_not_one_sentence', (o) => {
  o.one_cut.text = 'A decade of sound reaches a visitor as one adjective. That is the whole of it.';
});
mutate('a bridge anchor that is not in the bridge', 'bridge_anchor_not_in_text', (o) => {
  o.bridge.concrete_anchor = 'the converted mill';
});
mutate('a skim observation over forty words', 'skim_observation_too_long', (o) => {
  o.skim_read.entry_point.observation =
    'One marked button sits under the text and it outranks the four flat menu words that sit at the top of the page, which means that anyone who arrives wanting to hire you already has somewhere obvious to press before they read anything else at all.';
});
mutate('a read that runs short', 'word_count_out_of_range', (o) => {
  o.lane_verdicts = o.lane_verdicts.slice(0, 3).map((lv) => ({ ...lv, evidence: 'Short.' }));
  o.gap.what_you_have = 'Short.';
  o.skim_read.tangibles = null;
  o.skim_read.entry_point = null;
  o.skim_read.delivered_vs_handheld = null;
});

describe('absence claims need a scan record');
mutate('an absence claim with no scan', 'absence_claim_without_scan', (o) => {
  o.self_check.negative_claims = [];
});
mutate('a scan that found a counterexample', 'negative_claim_contradicted', (o) => {
  o.self_check.negative_claims[0].counterexample_found = true;
});

describe('declines');
const declines = [
  {
    label: 'unfetchable',
    out: {
      schema_version: SCHEMA_VERSION,
      site_url: fs.site_url,
      status: 'decline_unfetchable',
      decline: {
        observation: 'Nothing came back from that address on this attempt, so there is no page here to read yet.',
        redirect:
          'Try it once more in a few minutes, or paste the full address of the one page you most want looked at, and it will run against that page instead.',
        exhibit: null,
      },
      self_check: { gated_before_model: true },
    },
  },
  {
    label: 'thin',
    out: {
      schema_version: SCHEMA_VERSION,
      site_url: fs.site_url,
      status: 'decline_thin',
      decline: {
        observation:
          'What came back is a single screen of links and images, with no sentences anyone wrote about the work itself.',
        redirect:
          'Two paragraphs in your own words, published on the page rather than pointed to from it, would carry a first-time visitor further than the buttons do.',
        exhibit: null,
      },
      self_check: { gated_before_model: true },
    },
  },
  { label: 'fail-safe', out: buildFailSafeOutput(fs) },
];
for (const d of declines) {
  const r = run(d.out);
  ok(r.ok, `the ${d.label} decline passes its own gate`, JSON.stringify(r.violations));
}
mutate('a decline that runs long', 'decline_word_count_out_of_range', (o) => {
  o.status = 'decline_thin';
  o.decline = { observation: 'A'.repeat(3), redirect: 'B', exhibit: null };
});
const diagnosing = {
  schema_version: SCHEMA_VERSION,
  site_url: fs.site_url,
  status: 'decline_unfetchable',
  decline: {
    observation: 'The server returned a 403 and the firewall in front of it refused every attempt this tool made today.',
    redirect: 'Ask whoever configured your host to allow the request, then try it once more in a few minutes please.',
    exhibit: null,
  },
  self_check: {},
};
ok(codes(diagnosing).includes('unfetchable_decline_diagnoses'), 'an unfetchable decline may not diagnose');

describe('repair loop');
const factSheet = fs;
let calls = 0;
const alwaysBad = async () => {
  calls++;
  const out = clone(good);
  out.one_cut.text = 'A decade of sound made across 47 rooms reaches a visitor as one adjective.';
  return { output: out, raw: '{}', parseError: null, usage: { input_tokens: 10, output_tokens: 10 } };
};
const failSafe = await runWithRepair(factSheet, alwaysBad);
eq(calls, 2, 'a failing read is retried exactly once');
eq(failSafe.status, 'fail_safe', 'two failures fall back to the honest decline');
eq(failSafe.output.status, 'decline_incomplete', 'the fail-safe carries the pipeline-only status');
ok(run(failSafe.output).ok, 'the fail-safe output validates');

let secondTry = 0;
const repairs = async (system, user) => {
  secondTry++;
  if (secondTry === 1) {
    const out = clone(good);
    out.one_cut.text = 'A decade of sound made across 47 rooms reaches a visitor as one adjective.';
    return { output: out, raw: '{}', parseError: null, usage: null };
  }
  ok(/number_not_grounded/.test(user), 'the repair turn names the violation code it must fix');
  return { output: clone(good), raw: '{}', parseError: null, usage: null };
};
const repaired = await runWithRepair(factSheet, repairs);
eq(repaired.status, 'ok_after_repair', 'a repaired read is returned, not the fail-safe');
eq(repaired.attempts, 2, 'it took two attempts');

let parseCalls = 0;
const unparseable = async () => {
  parseCalls++;
  return { output: null, raw: 'Sure! Here is the read:', parseError: 'Unexpected token S', usage: null };
};
const parseFail = await runWithRepair(factSheet, unparseable);
eq(parseCalls, 2, 'an unparseable response counts as an attempt');
eq(parseFail.status, 'fail_safe', 'two unparseable responses fall back');
eq(parseFail.internalDiagnostics[0].violations[0].code, 'model_output_unparseable', 'the parse failure is recorded as its own violation');

const throwing = async () => { throw new Error('Anthropic API 529: overloaded'); };
const threw = await runWithRepair(factSheet, throwing);
eq(threw.status, 'fail_safe', 'an API error never escapes as an exception');
eq(threw.internalDiagnostics[0].violations[0].code, 'model_call_failed', 'the API error is recorded');

process.exit(report() > 0 ? 1 : 0);
