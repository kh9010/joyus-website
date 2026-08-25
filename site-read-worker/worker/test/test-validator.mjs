// Validator + two-pass loop tests. Every check gets a mutation that should trip
// it, plus a regression test for the two guards this validator exists to fix:
// the word-boundary banned sweep, and number grounding that never reads the
// model's own self_check.
//
// The object under test is the ASSEMBLED read — the writer's prose grafted onto
// the outline's evidence — because that is what ships.

import { describe, ok, eq, report } from './_harness.mjs';
import { buildFixtureFactSheet } from './_fixtureSite.mjs';
import { buildPassingRead, buildWriterProse, buildPassingOutline } from './_fixtureRead.mjs';
import { validate, assembleRenderedProse } from '../src/validator.js';
import { WRITER_PROMPT } from '../src/writerPrompt.js';
import { runTwoPass, buildFailSafeOutput, OUTLINE_ATTEMPTS, WRITER_ATTEMPTS } from '../src/repairLoop.js';
import { SCHEMA_VERSION } from '../src/types.js';

const fs = buildFixtureFactSheet();
const clone = (o) => structuredClone(o);
const run = (out) => validate(out, fs, WRITER_PROMPT);
const codes = (out) => run(out).violations.map((v) => v.code);

describe('a correct read passes every check');
const good = buildPassingRead(fs);
const goodResult = run(good);
ok(goodResult.ok, 'the hand-written read is clean', JSON.stringify(goodResult.violations.map((v) => `${v.code}: ${v.message}`), null, 1));
const words = assembleRenderedProse(good).split(/\s+/).filter(Boolean).length;
ok(words >= 250 && words <= 400, `rendered prose is ${words} words, inside 250-400`);
ok(!('one_cut' in good), 'the assembled read carries no one_cut — the synthesis slot is gone');
ok(assembleRenderedProse(good).trim().endsWith(good.bridge.text), 'the rendered read ends on the bridge');

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
  o.skim_read.delivered_vs_handheld.exhibit.page = 'About';
  o.skim_read.delivered_vs_handheld.exhibit.quote = 'Mara trained at the Royal Northern College of Music.';
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

describe('an ABSENT lane may carry no exhibit — the schema and the validator agree now');
ok(good.lane_verdicts[2].verdict === 'ABSENT' && good.lane_verdicts[2].exhibit === null, 'the fixture exercises the null-exhibit case');
ok(!codes(good).includes('missing_exhibit'), 'ABSENT with searched[] needs no exhibit');
mutate('ABSENT with a null exhibit AND no surfaces searched', 'missing_exhibit', (o) => {
  o.lane_verdicts[2].searched = [];
});
mutate('a TRANSMISSION lane with no exhibit', 'missing_exhibit', (o) => {
  o.lane_verdicts[0].exhibit = null;
});

describe('the first screen is computed, not chosen');
mutate('substituting a different headline', 'first_screen_headline_mismatch', (o) => {
  o.skim_read.first_screen_headline_used = 'Mara Feldt designs sound';
});
mutate('a positioning observation that drops the headline', 'positioning_missing_headline', (o) => {
  o.skim_read.positioning_legibility.observation =
    'The top of the page names a quality rather than a service, so somebody landing cold cannot tell what you would build.';
});

describe('the shape directive is assigned, not chosen');
mutate('not echoing the directive', 'shape_directive_not_echoed', (o) => {
  o.shape_directive_used.bridge_move =
    o.shape_directive_used.bridge_move === 'page_that_must_move' ? 'scale_of_change' : 'page_that_must_move';
});
mutate('an opening in a shape that was not assigned', 'opening_shape_mismatch', (o) => {
  o.opening.shape = o.opening.shape === 'stranger_result' ? 'named_fact' : 'stranger_result';
});
const conflictOut = clone(good);
conflictOut.opening.shape = conflictOut.opening.shape === 'stranger_result' ? 'first_screen_quote' : 'stranger_result';
conflictOut.self_check.shape_conflict = {
  slot: 'opening',
  assigned: good.opening.shape,
  why_it_could_not_be_made_true: 'The front door carries no quotable line.',
};
ok(!codes(conflictOut).includes('opening_shape_mismatch'), 'a declared shape_conflict excuses the departure');
ok(!codes(good).includes('cut_shape_mismatch'), 'there is no cut shape left to mismatch');

describe('lane selection has to be shown');
mutate('running six lanes', 'lane_count_out_of_range', (o) => {
  o.lane_verdicts.push(
    { ...clone(o.lane_verdicts[0]), finding_id: 'f4', lane: 'short_form_social' },
    { ...clone(o.lane_verdicts[0]), finding_id: 'f5', lane: 'publishing_rhythm' },
    { ...clone(o.lane_verdicts[0]), finding_id: 'f6', lane: 'website_sequencing' },
  );
  o.lane_selection.chosen.push('short_form_social', 'publishing_rhythm', 'website_sequencing');
  o.lane_selection.rejected = [];
});
ok(
  !codes(
    (() => {
      const o = clone(good);
      o.lane_verdicts.push(
        { ...clone(o.lane_verdicts[0]), finding_id: 'f4', lane: 'short_form_social' },
        { ...clone(o.lane_verdicts[0]), finding_id: 'f5', lane: 'publishing_rhythm' },
      );
      o.lane_selection.chosen.push('short_form_social', 'publishing_rhythm');
      o.lane_selection.rejected = o.lane_selection.rejected.filter(
        (r) => !['short_form_social', 'publishing_rhythm'].includes(r.lane),
      );
      return o;
    })(),
  ).includes('lane_count_out_of_range'),
  'five lanes is inside the range now',
);
mutate("returning lanes in the prompt's own order", 'lane_order_defaulted', (o) => {
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
mutate('a second bold line the plan never designated', 'too_many_bold_lines', (o) => {
  o.lane_verdicts[1].bold_line = 'Your story lands third, under a line about sound.';
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
  o.strongest_true_thing.text = 'One marked button outranks all 47 of the words above it, so anyone deciding has somewhere to press.';
});
const launderer = clone(good);
launderer.strongest_true_thing.text = 'One marked button outranks all 47 of the words above it, so anyone deciding has somewhere to press.';
launderer.self_check.rooms_counted = 47;
ok(
  codes(launderer).includes('number_not_grounded'),
  'a number the model whitelists in its own self_check is still ungrounded',
);
mutate('a spelled-out count with nothing behind it', 'number_not_grounded', (o) => {
  o.gap.what_a_stranger_gets = 'Somebody who never gets you into a room comes away with seventeen sentences.';
});

describe('banned vocabulary, on word boundaries only');
mutate('a hedge', 'banned_hedge', (o) => {
  o.opening.text = "Your front page is just one line about sound and four menu words, and that's the whole of it.";
});
mutate('a machinery word', 'banned_machinery_word', (o) => {
  o.opening.text = "Your front page carries no evidence of the work, and that's the whole of it for you.";
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
});
mutate('the bridge naming a duration', 'bridge_names_offer_mechanics', (o) => {
  o.bridge.text = `${o.bridge.text} That is 6 weeks of work.`;
});

describe('mechanical caps');
mutate('a rhetorical question', 'rhetorical_question', (o) => {
  o.strongest_true_thing.text = 'What does a decade in a converted mill reach somebody as?';
});
mutate('a bridge anchor that is not in the bridge', 'bridge_anchor_not_in_text', (o) => {
  o.bridge.concrete_anchor = 'the converted mill';
});
mutate('a skim observation over thirty words', 'skim_observation_too_long', (o) => {
  o.skim_read.positioning_legibility.observation =
    'Sound that carries a room sits at the top of the page, and it names a quality of the work rather than something anyone could hire you to build for them, which leaves the question open.';
});
mutate('a fourth skim observation at this budget', 'too_many_skim_observations', (o) => {
  o.skim_read.tangibles = clone(o.skim_read.delivered_vs_handheld);
  o.skim_read.entry_point = clone(o.skim_read.delivered_vs_handheld);
});
mutate('a read that runs short', 'word_count_out_of_range', (o) => {
  o.lane_verdicts = o.lane_verdicts.map((lv) => ({ ...lv, evidence: 'Short.' }));
  o.gap.what_you_have = 'Short.';
  o.skim_read.delivered_vs_handheld = null;
});

describe('the self check is the writer\'s own, and nothing else');
mutate('a self check the writer failed', 'self_check_failed', (o) => {
  o.self_check.plan_rendered_exactly = false;
});
ok(!('negative_claims' in good.self_check), 'the read carries no negative_claims — the absence gate ran in pass 1');
const absenceOnly = clone(good);
absenceOnly.self_check = { ...absenceOnly.self_check };
delete absenceOnly.self_check.negative_claims;
ok(!codes(absenceOnly).includes('absence_claim_without_scan'), 'an absence claim in the prose is not re-gated against a field the read does not have');

describe('declines');
const declines = [
  {
    label: 'unfetchable',
    out: {
      schema_version: SCHEMA_VERSION,
      site_url: fs.site_url,
      status: 'decline_unfetchable',
      decline: {
        observation: 'Nothing came back from that address on this attempt, so there is no page here to read.',
        redirect: 'Try it once more in a few minutes, or paste the one page you most want looked at.',
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
        observation: 'What came back is one screen of links and images, with no sentences about the work.',
        redirect: 'Two paragraphs in your own words, published on the page rather than pointed to, would carry further.',
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
    observation: 'The server returned a 403 and the firewall in front of it refused every attempt made today.',
    redirect: 'Ask whoever configured your host to allow the request, then try it once more shortly.',
    exhibit: null,
  },
  self_check: {},
};
ok(codes(diagnosing).includes('unfetchable_decline_diagnoses'), 'an unfetchable decline may not diagnose');

// ---------------------------------------------------------------------------
// THE TWO-PASS LOOP
// ---------------------------------------------------------------------------

describe('the two-pass loop');
const outline = buildPassingOutline(fs);
const prose = buildWriterProse();
const directive = fs.shape_directive;

/** A stub caller that branches on the tool name, the way the real API does. */
function stub({ onOutline, onProse }) {
  const calls = { outline: 0, prose: 0, systems: [], users: [] };
  const fn = async (system, user, call) => {
    calls.systems.push(system);
    calls.users.push(user);
    if (call.toolName === 'emit_outline') {
      calls.outline++;
      return onOutline(calls.outline, user);
    }
    calls.prose++;
    return onProse(calls.prose, user);
  };
  return { fn, calls };
}
const wrap = (output) => ({ output, raw: JSON.stringify(output), parseError: null, usage: { input_tokens: 10, output_tokens: 10 } });

const happy = stub({ onOutline: () => wrap(clone(outline)), onProse: () => wrap(clone(prose)) });
const okRun = await runTwoPass(fs, directive, happy.fn);
eq(okRun.status, 'ok', 'a clean outline and clean prose return ok');
eq(happy.calls.outline, 1, 'one outline call');
eq(happy.calls.prose, 1, 'one writer call');
eq(okRun.output.status, 'read', 'the assembled read comes back');
ok(run(okRun.output).ok, 'and it passes the validator');
ok(!happy.calls.users[1].includes('"link_inventory"'), 'the writer turn does NOT carry the fact sheet');
ok(happy.calls.users[1].includes('"render_plan"'), 'the writer turn carries the outline');
ok(happy.calls.users[1].includes('250-400'), 'and the word budget');
ok(happy.calls.users[0].includes('"link_inventory"'), 'the outline turn carries the fact sheet');
ok(!happy.calls.users[0].includes('opening_shape'), 'and NOT the shape directive');

const badOutline = stub({
  onOutline: () => {
    const o = clone(outline);
    o.render_plan.push({ seq: 13, unit: 'strongest_true_thing', renders_claim: null, claim_free: false, bold: false, source_node: 'strongest_true_thing' });
    return wrap(o);
  },
  onProse: () => wrap(clone(prose)),
});
const outlineFail = await runTwoPass(fs, directive, badOutline.fn);
eq(outlineFail.status, 'fail_safe', 'an outline that fails twice falls back');
eq(outlineFail.failedStage, 'outline', 'and the stage is named');
eq(badOutline.calls.outline, OUTLINE_ATTEMPTS, 'the outline was retried exactly once');
eq(badOutline.calls.prose, 0, 'THE WRITER NEVER RAN — prose off a broken outline is confident falsehood');
ok(run(outlineFail.output).ok, 'the fail-safe output validates');

const badProse = stub({
  onOutline: () => wrap(clone(outline)),
  onProse: () => {
    const p = clone(prose);
    p.strongest_true_thing.text = 'One marked button outranks all 47 of the words above it, so anyone deciding has somewhere to press.';
    return wrap(p);
  },
});
const proseFail = await runTwoPass(fs, directive, badProse.fn);
eq(proseFail.status, 'fail_safe', 'prose that fails twice falls back');
eq(proseFail.failedStage, 'prose', 'and the stage is named');
eq(badProse.calls.outline, 1, 'PASS 1 WAS NOT RE-RUN — a prose repair may only change words');
eq(badProse.calls.prose, WRITER_ATTEMPTS, 'the writer was retried exactly once');

const repairing = stub({
  onOutline: () => wrap(clone(outline)),
  onProse: (n, user) => {
    if (n === 1) {
      const p = clone(prose);
      p.strongest_true_thing.text = 'One marked button outranks all 47 of the words above it, so anyone deciding has somewhere to press.';
      return wrap(p);
    }
    ok(/number_not_grounded/.test(user), 'the writer repair turn names the violation code it must fix');
    ok(/outline is unchanged/.test(user), 'and tells the writer the outline has not moved');
    return wrap(clone(prose));
  },
});
const repaired = await runTwoPass(fs, directive, repairing.fn);
eq(repaired.status, 'ok_after_repair', 'a repaired read is returned, not the fail-safe');
eq(repairing.calls.outline, 1, 'still one outline call');

const containmentFail = stub({
  onOutline: () => wrap(clone(outline)),
  onProse: () => {
    const p = clone(prose);
    p.lane_verdicts[1].bold_line = 'Your story lands third, under a line about sound.';
    return wrap(p);
  },
});
const contained = await runTwoPass(fs, directive, containmentFail.fn);
eq(contained.status, 'fail_safe', 'an unplanned bold line is caught and never ships');
ok(
  contained.finalViolations.some((x) => x.code === 'bold_line_not_planned'),
  'the violation names the unplanned bold line',
  contained.finalViolations.map((x) => x.code).join(', '),
);

const unparseable = stub({
  onOutline: () => ({ output: null, raw: 'Sure! Here is the outline:', parseError: 'Unexpected token S', usage: null }),
  onProse: () => wrap(clone(prose)),
});
const parseFail = await runTwoPass(fs, directive, unparseable.fn);
eq(parseFail.status, 'fail_safe', 'two unparseable outlines fall back');
eq(parseFail.internalDiagnostics.outline[0].violations[0].code, 'model_output_unparseable', 'the parse failure is recorded on the outline stage');
eq(parseFail.internalDiagnostics.prose.length, 0, 'and the prose stage recorded nothing, because it never ran');

const throwing = stub({
  onOutline: () => { throw new Error('Anthropic API 529: overloaded'); },
  onProse: () => wrap(clone(prose)),
});
const threw = await runTwoPass(fs, directive, throwing.fn);
eq(threw.status, 'fail_safe', 'an API error never escapes as an exception');
eq(threw.internalDiagnostics.outline[0].violations[0].code, 'model_call_failed', 'the API error is recorded');

process.exit(report() > 0 ? 1 : 0);
