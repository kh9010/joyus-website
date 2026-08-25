// The writer's half of the fixture: prose fields only, rendering the outline's
// render_plan entry by entry, in its order, with nothing added.
//
// `buildWriterProse` is what a passing pass-2 tool call looks like — exactly the
// fields the read schema annotates `x_source: "writer"`. `buildPassingRead`
// grafts it onto the outline the same way the pipeline does, so the validator
// tests run against the same object production assembles rather than a
// hand-written stand-in.
//
// Every proper noun below appears in the outline. Every number below appears in
// the outline. There is no sentence here without a plan entry, no bold line
// beside the designated one, and nothing after the bridge.

import { assembleRead } from '../src/assemble.js';
import { buildPassingOutline } from './_fixtureOutline.mjs';

export function buildWriterProse() {
  return {
    status: 'read',

    // seq 1 — opening
    opening: {
      text: "Your front door hands whoever lands there a claim about quality, and never names a thing you'd be hired to make.",
    },

    skim_read: {
      // seq 2 — skim.positioning_legibility
      positioning_legibility: {
        observation:
          'Sound that carries a room sits at the top, naming a quality of the work rather than something somebody could hire you to build.',
      },
      // seq 3 — skim.delivered_vs_handheld
      delivered_vs_handheld: {
        observation:
          'The Vaults Festival score and the Site Gallery commission are told to whoever lands here, and not one second of either one plays.',
      },
    },

    gap: {
      // seq 4 — gap.named_facts, recited, asserting nothing
      what_you_have:
        "You've run the studio since 2014 out of a converted mill in Leeds. You trained at the Royal Northern College of Music, and you've taught sound design at Leeds Arts University since 2019.",
      // seq 5 — gap.what_a_stranger_gets
      what_a_stranger_gets:
        'Someone who never gets you into a room comes away holding a handful of sentences and a menu, and that is the whole of what your pages hand over.',
    },

    lane_verdicts: [
      {
        finding_id: 'f1',
        // seq 6 — f1.claim
        evidence:
          'The teaching post sits on your About page, in copy that speaks about you in the third person. Your front page carries the studio and the two commissions, then stops. The strongest thing anyone could check sits one click behind a door.',
        // seq 7 — f1.consequence, the one entry the plan marks bold
        bold_line: 'Your credentials sit one page away from the person deciding.',
      },
      {
        finding_id: 'f2',
        // seq 8 — f2.claim
        evidence:
          'A decade in a converted mill is the strongest sentence you have written down anywhere, and it lands third on the page, underneath a line about sound.',
        bold_line: null,
      },
      {
        finding_id: 'f3',
        // seq 9 — f3.claim
        evidence:
          'Nothing you have written about the work renders on either page. The menu offers four doors and none of them opens onto writing, so how you think about a room stays in conversation with you.',
        bold_line: null,
      },
    ],

    // seq 10 — strongest_true_thing
    strongest_true_thing: {
      text:
        'One marked button under the text outranks every flat word in the menu, so somebody who has decided to hire you has somewhere to press.',
    },

    // seq 11 — bridge. Nothing follows it.
    bridge: {
      text:
        'What nobody can do here is hear you, and until a second of the Vaults Festival score plays on this page it stays a name rather than a thing anyone has heard.',
      concrete_anchor: 'the Vaults Festival',
    },

    self_check: {
      prompt_leak_scan_done: true,
      no_new_facts_introduced: true,
      findings_used_once: true,
      plan_rendered_exactly: true,
      nothing_after_bridge: true,
      bold_only_where_planned: true,
      ledger_claims_used_once: true,
      no_derived_numbers: true,
      dates_rendered_whole: true,
      no_inferred_destinations: true,
      labels_rendered_verbatim: true,
      site_quantifiers_preserved: true,
      sentence_gate: {
        sentence_count: 14,
        word_count: 300,
        average_words_per_sentence: 21.4,
        sentences_over_30: 1,
      },
      frames_declared: {
        opening_frame: 'your <surface> hands <person> <a claim> and never names <object>',
        bridge_frame: 'what <person> cannot do is <verb>, and until <event> it stays <noun>',
      },
      shape_conflict: null,
      ledger_override: null,
    },
  };
}

/** The assembled read: the writer's prose grafted onto the outline, exactly as
 *  the pipeline does it. */
export function buildPassingRead(fs) {
  const outline = buildPassingOutline(fs);
  return assembleRead(outline, buildWriterProse(), fs.shape_directive, fs.site_url);
}

export { buildPassingOutline };
