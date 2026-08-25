// A hand-written OUTLINE that is supposed to pass every deterministic check in
// outlineValidator.js against the fixture site.
//
// Writing one by hand is the real test of the validator: if a careful human
// cannot satisfy the rules, the model cannot either, and every request ends at
// the fail-safe. Every quote here is a character-exact substring of the fixture
// site's page text, and every source_span is the whole sentence around it.
//
// It deliberately exercises the ABSENT-with-null-exhibit case (f3), which is
// where the schema and the validator used to disagree.

export function buildPassingOutline(fs) {
  return {
    schema_version: '5.3-outline',
    site_url: fs.site_url,
    status: 'read',

    first_screen: {
      headline_verbatim: 'Sound that carries a room',
      headline_on_first_screen: true,
      page: 'homepage',
      block_index: fs.first_screen_headline ? fs.first_screen_headline.block_index : null,
      meets_in_order: ['heading', 'text naming the practice', 'text dating the studio'],
      front_door_function: 'states a quality of sound and lists four menu doors',
      stranger_result: 'the front door buys a quality claim and no named service',
    },

    skim_claims: [
      {
        dimension: 'positioning_legibility',
        claim: 'the heading Sound that carries a room names a quality rather than a service',
        exhibit: {
          page: 'homepage',
          quote: 'Sound that carries a room',
          source_span: 'Sound that carries a room',
          reference: null,
          speaker: 'owner',
          block_index: fs.first_screen_headline ? fs.first_screen_headline.block_index : null,
          location: 'first_screen',
        },
      },
      {
        dimension: 'delivered_vs_handheld',
        claim: 'the two commissions are told to a visitor and never played for them',
        exhibit: {
          page: 'homepage',
          quote: 'Recent work includes a score for the Vaults Festival and a commission from Site Gallery.',
          source_span: 'Recent work includes a score for the Vaults Festival and a commission from Site Gallery.',
          reference: null,
          speaker: 'owner',
          block_index: null,
          location: 'body',
        },
      },
    ],

    gap: {
      named_facts: [
        {
          fact: 'The studio has run since 2014',
          page: 'homepage',
          source_sentence: 'The studio has run since 2014 out of a converted mill in Leeds.',
        },
        {
          fact: 'trained at the Royal Northern College of Music',
          page: 'About',
          source_sentence: 'Mara trained at the Royal Northern College of Music.',
        },
        {
          fact: 'taught sound design at Leeds Arts University since 2019',
          page: 'About',
          source_sentence: 'She has taught sound design at Leeds Arts University since 2019.',
        },
      ],
      what_a_stranger_gets_claim: 'someone who never meets the owner leaves with sentences and a menu',
    },

    findings: [
      {
        id: 'f1',
        claim: 'the teaching post sits on a second page written about the owner in the third person',
        lane: 'credibility_surface',
        verdict: 'DOCUMENTATION',
        exhibit: {
          page: 'About',
          quote: 'She has taught sound design at Leeds Arts University since 2019.',
          source_span: 'She has taught sound design at Leeds Arts University since 2019.',
          reference: null,
          speaker: 'the page copy, written about the owner in the third person',
          block_index: null,
          location: 'body',
        },
        buried_on: 'the About page',
        searched: null,
        why_it_matters: 'whoever is deciding whether to trust a room to this practice has to open a second page first',
      },
      {
        id: 'f2',
        claim: 'a decade in a converted mill is stated third, under a line about sound',
        lane: 'spine_story',
        verdict: 'DOCUMENTATION',
        exhibit: {
          page: 'homepage',
          quote: 'The studio has run since 2014 out of a converted mill in Leeds.',
          source_span: 'The studio has run since 2014 out of a converted mill in Leeds.',
          reference: null,
          speaker: 'owner',
          block_index: null,
          location: 'body',
        },
        buried_on: 'the homepage',
        searched: null,
        why_it_matters: null,
      },
      {
        id: 'f3',
        claim: 'no writing about the practice renders on either retrieved page',
        lane: 'long_form_writing',
        verdict: 'ABSENT',
        exhibit: null,
        buried_on: null,
        searched: ['the menu', 'the footer', 'the homepage', 'the About page'],
        why_it_matters: null,
      },
    ],

    strongest_true_thing: {
      claim: 'one marked button outranks every flat menu word beside it',
      exhibit: {
        page: 'homepage',
        quote: null,
        source_span: null,
        reference: 'the marked button in the body of the page, labelled Start a conversation',
        speaker: 'not_applicable',
        block_index: null,
        location: 'body',
      },
    },

    lane_selection: {
      chosen: ['credibility_surface', 'spine_story', 'long_form_writing'],
      rejected: [
        {
          lane: 'website_sequencing',
          reason: 'Two pages, one menu and one marked button; too little built to judge order.',
          surfaces_searched: ['the menu', 'the homepage', 'the About page'],
        },
        {
          lane: 'short_form_social',
          reason: 'One Instagram link in the footer, with nothing rendering on either page.',
          surfaces_searched: ['the footer', 'the homepage'],
        },
        {
          lane: 'publishing_rhythm',
          reason: 'Two years appear, 2014 and 2019, and neither sits on a dated item.',
          surfaces_searched: ['the homepage', 'the About page'],
        },
      ],
    },

    bridge_material: {
      scale_of_change: 'moving the training and the teaching post onto the front door is a rebuild of one page',
      page_that_must_move: 'the About page has to move up to the front door',
      what_a_stranger_cannot_do: 'nobody can hear a second of the work without leaving',
      concrete_anchor_candidates: [
        'the Vaults Festival',
        'the About page',
        'Leeds Arts University',
      ],
    },

    coverage: {
      lanes_examined: 3,
      lanes_total: 6,
      not_examined: [
        { lane: 'website_sequencing', reason: 'Two pages only; nothing sequenced to read' },
        { lane: 'short_form_social', reason: 'One footer link, nothing rendering on the pages' },
        { lane: 'publishing_rhythm', reason: 'No dated items on either page' },
      ],
      unfetched_pages: ['Work'],
      extractor_gaps: [],
    },

    bold_designation: {
      claim_owner: 'f1.consequence',
      why_this_one: 'it names the cost at the moment somebody is deciding',
    },

    claim_ledger: [
      { claim: 'the front door buys a quality claim and no named service', owner: 'opening', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'the heading Sound that carries a room names a quality rather than a service', owner: 'skim.positioning_legibility', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'the two commissions are told to a visitor and never played for them', owner: 'skim.delivered_vs_handheld', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'someone who never meets the owner leaves with sentences and a menu', owner: 'gap.what_a_stranger_gets', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'the teaching post sits on a second page written about the owner in the third person', owner: 'f1.claim', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'whoever is deciding whether to trust a room to this practice has to open a second page first', owner: 'f1.consequence', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'a decade in a converted mill is stated third, under a line about sound', owner: 'f2.claim', also_claimed_by: ['bridge'], action_taken: 'stripped' },
      { claim: 'no writing about the practice renders on either retrieved page', owner: 'f3.claim', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'one marked button outranks every flat menu word beside it', owner: 'strongest_true_thing', also_claimed_by: [], action_taken: 'unique' },
      { claim: 'nobody can hear a second of the work without leaving', owner: 'bridge', also_claimed_by: [], action_taken: 'unique' },
    ],

    render_plan: [
      { seq: 1, unit: 'opening', renders_claim: 'the front door buys a quality claim and no named service', claim_free: false, bold: false, source_node: 'first_screen' },
      { seq: 2, unit: 'skim.positioning_legibility', renders_claim: 'the heading Sound that carries a room names a quality rather than a service', claim_free: false, bold: false, source_node: 'skim_claims[0]' },
      { seq: 3, unit: 'skim.delivered_vs_handheld', renders_claim: 'the two commissions are told to a visitor and never played for them', claim_free: false, bold: false, source_node: 'skim_claims[1]' },
      { seq: 4, unit: 'gap.named_facts', renders_claim: null, claim_free: true, bold: false, source_node: 'gap.named_facts' },
      { seq: 5, unit: 'gap.what_a_stranger_gets', renders_claim: 'someone who never meets the owner leaves with sentences and a menu', claim_free: false, bold: false, source_node: 'gap.what_a_stranger_gets_claim' },
      { seq: 6, unit: 'f1.claim', renders_claim: 'the teaching post sits on a second page written about the owner in the third person', claim_free: false, bold: false, source_node: 'findings[0].claim' },
      { seq: 7, unit: 'f1.consequence', renders_claim: 'whoever is deciding whether to trust a room to this practice has to open a second page first', claim_free: false, bold: true, source_node: 'findings[0].why_it_matters' },
      { seq: 8, unit: 'f2.claim', renders_claim: 'a decade in a converted mill is stated third, under a line about sound', claim_free: false, bold: false, source_node: 'findings[1].claim' },
      { seq: 9, unit: 'f3.claim', renders_claim: 'no writing about the practice renders on either retrieved page', claim_free: false, bold: false, source_node: 'findings[2].claim' },
      { seq: 10, unit: 'strongest_true_thing', renders_claim: 'one marked button outranks every flat menu word beside it', claim_free: false, bold: false, source_node: 'strongest_true_thing' },
      { seq: 11, unit: 'bridge', renders_claim: 'nobody can hear a second of the work without leaving', claim_free: false, bold: false, source_node: 'bridge_material' },
      { seq: 12, unit: 'coverage', renders_claim: null, claim_free: true, bold: false, source_node: 'coverage' },
    ],

    gate_signals: [],
    decline_material: null,

    truth_check: {
      quotes_speaker_checked: true,
      quotes_character_matched: true,
      exhibit_source_spans_recorded: true,
      proper_nouns_located: true,
      numbers_copied_from_fact_sheet: true,
      placement_claims_from_block_order: true,
      negative_claims: [
        {
          claim: 'no writing about the practice renders on either retrieved page',
          pages_scanned: ['homepage', 'About'],
          search_terms: ['writing', 'notes', 'journal', 'essay', 'blog'],
          surfaces_scanned: ['the menu', 'the footer', 'both pages', 'embedded_feeds', 'gallery and embed blocks'],
          counterexample_found: false,
        },
        {
          claim: 'nobody can hear a second of the work without leaving',
          pages_scanned: ['homepage', 'About'],
          search_terms: ['audio', 'listen', 'player', 'embed'],
          surfaces_scanned: ['both pages', 'embedded_feeds', 'gallery and embed blocks'],
          counterexample_found: false,
        },
        {
          claim: 'the front door buys a quality claim and no named service',
          pages_scanned: ['homepage'],
          search_terms: ['service', 'offer', 'work with', 'rates'],
          surfaces_scanned: ['the first screen', 'the menu', 'the body'],
          counterexample_found: false,
        },
        {
          claim: 'the heading Sound that carries a room names a quality rather than a service',
          pages_scanned: ['homepage'],
          search_terms: ['service', 'offer', 'commission'],
          surfaces_scanned: ['the first screen', 'the heading'],
          counterexample_found: false,
        },
        {
          claim: 'the two commissions are told to a visitor and never played for them',
          pages_scanned: ['homepage', 'About'],
          search_terms: ['audio', 'player', 'listen', 'sample'],
          surfaces_scanned: ['both pages', 'embedded_feeds', 'gallery and embed blocks'],
          counterexample_found: false,
        },
        {
          claim: 'someone who never meets the owner leaves with sentences and a menu',
          pages_scanned: ['homepage', 'About'],
          search_terms: ['portfolio', 'audio', 'video', 'sample'],
          surfaces_scanned: ['both pages', 'embedded_feeds', 'gallery and embed blocks'],
          counterexample_found: false,
        },
        {
          claim: 'one marked button outranks every flat menu word beside it',
          pages_scanned: ['homepage'],
          search_terms: ['button', 'cta', 'contact'],
          surfaces_scanned: ['the body', 'the menu'],
          counterexample_found: false,
        },
      ],
      distinctness_checked: true,
      unverified_items_removed: [],
      claim_ledger_run: true,
      counts_single_sourced: true,
      count_conflicts: [],
      dates_carry_years: true,
      empty_fields_not_read_as_zero: true,
      counts_attached_to_source_object: true,
      labels_verbatim: true,
      no_destination_inference: true,
      site_quantifiers_preserved: true,
      unfetched_pages_uncharacterized: true,
      first_screen_placement_computed: true,
      consequence_entailment_run: true,
      render_plan_check: {
        entry_count: 12,
        projected_words: 300,
        bijection_holds: true,
        no_banned_units: true,
        ends_on_bridge: true,
        bold_entries: 1,
        sequence_contiguous: true,
        cross_node_entailment_swept: true,
      },
    },
  };
}
