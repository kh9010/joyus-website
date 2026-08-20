// A hand-written read that is supposed to PASS every deterministic check.
//
// Writing one by hand is the real test of the validator: if a careful human
// cannot satisfy the rules, the model cannot either, and every request ends at
// the fail-safe. Every string quoted here is a character-exact substring of the
// fixture site's page text.

export function buildPassingRead(fs) {
  const d = fs.shape_directive;
  return {
    schema_version: '4.0',
    site_url: fs.site_url,
    status: 'read',
    shape_directive_used: {
      opening_shape: d.opening_shape,
      cut_shape: d.cut_shape,
      bridge_move: d.bridge_move,
    },
    decline: null,
    opening: {
      text: "Your front page gives a visitor one line about sound and four menu words of the same weight, and that's the whole of it.",
      shape: d.opening_shape,
    },
    skim_read: {
      first_screen_headline_used: 'Sound that carries a room',
      positioning_legibility: {
        observation:
          'Sound that carries a room sits at the top. It names a quality, not a service, so someone landing cold cannot tell what you would be hired to make.',
        exhibit: {
          page: 'homepage',
          quote: 'Sound that carries a room',
          reference: null,
          speaker: 'owner',
          block_index: fs.first_screen_headline ? fs.first_screen_headline.block_index : null,
          location: 'first_screen',
        },
      },
      tangibles: {
        observation:
          "Theatre, installation and score are concrete words, and they're the only concrete words here. What a client ends up holding is never named.",
        exhibit: {
          page: 'homepage',
          quote: 'Mara Feldt designs sound for theatre and installation work.',
          reference: null,
          speaker: 'owner',
          block_index: null,
          location: 'first_screen',
        },
      },
      entry_point: {
        observation:
          'One marked button sits under the text and it outranks the four flat menu words. Someone who wants to hire you has somewhere to press.',
        exhibit: {
          page: 'homepage',
          quote: 'Start a conversation',
          reference: null,
          speaker: 'owner',
          block_index: null,
          location: 'body',
        },
      },
      delivered_vs_handheld: {
        observation:
          'A visitor leaves knowing you make sound for rooms. They leave holding no recording, no clip and no sample of the work itself.',
        exhibit: {
          page: 'homepage',
          reference: null,
          quote: 'Recent work includes a score for the Vaults Festival and a commission from Site Gallery.',
          speaker: 'owner',
          block_index: null,
          location: 'body',
        },
      },
    },
    gap: {
      what_you_have:
        'A studio running since 2014 out of a converted mill, a score for the Vaults Festival, a commission from Site Gallery, and a teaching post at Leeds Arts University.',
      what_a_stranger_gets:
        'A visitor who never gets you in a room comes away with a handful of sentences and a menu.',
      named_facts: [
        {
          fact: 'The studio has run since 2014',
          page: 'homepage',
          source_sentence: 'The studio has run since 2014 out of a converted mill in Leeds.',
        },
        {
          fact: 'A score for the Vaults Festival and a commission from Site Gallery',
          page: 'homepage',
          source_sentence:
            'Recent work includes a score for the Vaults Festival and a commission from Site Gallery.',
        },
        {
          fact: 'Teaching at Leeds Arts University since 2019',
          page: 'About',
          source_sentence: 'She has taught sound design at Leeds Arts University since 2019.',
        },
      ],
    },
    lane_selection: {
      chosen: ['credibility_surface', 'spine_story', 'long_form_writing'],
      rejected: [
        {
          lane: 'website_sequencing',
          reason: 'Two pages, one menu and one button; too little built to judge sequence.',
          surfaces_searched: ['the menu', 'the homepage', 'the About page'],
        },
        {
          lane: 'short_form_social',
          reason: 'One Instagram link in the footer, with no posts rendering on either page.',
          surfaces_searched: ['the footer', 'the homepage'],
        },
        {
          lane: 'publishing_rhythm',
          reason: 'Two years appear, 2014 and 2019, and neither sits on a dated item.',
          surfaces_searched: ['the homepage', 'the About page'],
        },
      ],
    },
    lane_verdicts: [
      {
        lane: 'credibility_surface',
        verdict: 'DOCUMENTATION',
        exhibit: {
          page: 'About',
          quote: 'She has taught sound design at Leeds Arts University since 2019.',
          reference: null,
          speaker: 'the page copy, written about the owner in the third person',
          block_index: null,
          location: 'body',
        },
        buried_on: 'the About page',
        searched: null,
        evidence:
          'The teaching post and the training both sit on the About page, written about you rather than by you. Your front page carries the studio and two commissions and stops there. Someone deciding whether to trust you with a room has to open a second page to learn you teach.',
        bold_line: 'Your credentials are one page away from the person deciding.',
      },
      {
        lane: 'spine_story',
        verdict: 'DOCUMENTATION',
        exhibit: {
          page: 'homepage',
          quote: 'The studio has run since 2014 out of a converted mill in Leeds.',
          reference: null,
          speaker: 'owner',
          block_index: null,
          location: 'body',
        },
        buried_on: 'the homepage',
        searched: null,
        evidence:
          'A decade in a converted mill is the strongest sentence you have, and it sits third, under a line about sound. The About page adds the training and the range but never joins them into one story. The story exists in parts; it has not been told once, properly, anywhere.',
        bold_line: null,
      },
      {
        lane: 'long_form_writing',
        verdict: 'ABSENT',
        exhibit: {
          page: 'homepage',
          quote: null,
          reference: 'the four-word menu, which offers Home, Work, About and Contact and no writing',
          speaker: 'not_applicable',
          block_index: null,
          location: 'first_screen',
        },
        buried_on: null,
        searched: ['the menu', 'the footer', 'the homepage', 'the About page'],
        evidence:
          'Nothing you have written about the work appears anywhere on either page. The menu offers four doors and none of them opens onto writing. How you think about sound in a room lives entirely in conversation with you.',
        bold_line: null,
      },
    ],
    strongest_true_thing: {
      text: 'The mill sentence does real work: it puts a decade and a place into one line a visitor can hold.',
      exhibit: {
        page: 'homepage',
        quote: null,
        reference: 'the line naming the converted mill in Leeds',
        speaker: 'not_applicable',
        block_index: null,
        location: 'body',
      },
    },
    coverage: {
      lanes_examined: 3,
      lanes_total: 6,
      not_examined: [
        { lane: 'website_sequencing', reason: 'Two pages only; nothing sequenced to read' },
        { lane: 'short_form_social', reason: 'One footer link, no posts on the pages' },
        { lane: 'publishing_rhythm', reason: 'No dated items on either page' },
      ],
      unfetched_pages: ['Work'],
    },
    one_cut: {
      text: 'A decade of sound made in a converted mill reaches a visitor as one adjective and a menu.',
      shape: d.cut_shape,
      contradiction_scan_done: true,
      rests_on_quote: false,
    },
    bridge: {
      text: 'What a visitor cannot do here is hear you. Not one second of sound plays on the page that sells sound, and until it does the Vaults Festival score is a name rather than a thing anyone has heard.',
      move: d.bridge_move,
      concrete_anchor: 'the Vaults Festival score',
    },
    self_check: {
      quotes_speaker_checked: true,
      quotes_character_matched: true,
      negative_claims: [
        {
          claim: 'Nothing written about the work appears on either page',
          pages_scanned: ['homepage', 'About'],
          search_terms: ['writing', 'notes', 'journal', 'essay', 'blog'],
          surfaces_scanned: ['the menu', 'the footer', 'both pages'],
          counterexample_found: false,
        },
        {
          claim: 'No sound plays on the page',
          pages_scanned: ['homepage', 'About'],
          search_terms: ['audio', 'listen', 'player', 'embed'],
          surfaces_scanned: ['both pages', 'the embedded feeds'],
          counterexample_found: false,
        },
      ],
      placement_claims_from_block_order: true,
      numbers_copied_from_fact_sheet: true,
      prompt_leak_scan_done: true,
      shape_conflict: null,
      unverified_items_removed: [],
    },
  };
}
