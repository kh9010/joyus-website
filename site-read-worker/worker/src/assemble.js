// ---------------------------------------------------------------------------
// THE GRAFT — build the finished read from the outline plus the writer's prose.
//
// The writer emits prose fields ONLY (everything the read schema annotates
// `x_source: "writer"`). Every other field is copied here, straight out of the
// outline, by the pipeline. Two properties of that arrangement matter more than
// its mechanics:
//
//   1. A whole class of failure disappears. v4 spent repair rounds on
//      `shape_directive_used` mismatches and on exhibits the model retyped
//      slightly wrong. Neither can happen when the pipeline copies the value.
//   2. The evidence cards are byte-identical to what perception verified. The
//      character-exact quote check ran in pass 1 against the page text; the
//      graft is what carries that guarantee through to the rendered card.
//
// `exhibit.source_span` is deliberately DROPPED on the way through. It exists so
// pass 1 could check a quoted fragment against the sentence around it; the read
// schema does not carry it and the page never shows it.
// ---------------------------------------------------------------------------

import { SCHEMA_VERSION } from './types.js';

const SKIM_KEYS = ['positioning_legibility', 'tangibles', 'entry_point', 'delivered_vs_handheld'];

/** Copy an outline exhibit into read shape. Null passes through — an ABSENT
 *  lane may legitimately carry no exhibit. */
function graftExhibit(ex) {
  if (!ex) return null;
  return {
    page: ex.page,
    quote: ex.quote === undefined ? null : ex.quote,
    reference: ex.reference === undefined ? null : ex.reference,
    speaker: ex.speaker,
    block_index: ex.block_index === undefined ? null : ex.block_index,
    location: ex.location === undefined ? null : ex.location,
  };
}

/**
 * @param {object} outline   The frozen pass-1 object.
 * @param {object} prose     The writer's tool output.
 * @param {{opening_shape:string,bridge_move:string}} shapeDirective
 * @param {string} siteUrl
 * @returns {object} the v5.3 read
 */
export function assembleRead(outline, prose, shapeDirective, siteUrl) {
  const status = prose && prose.status ? prose.status : outline.status;

  const read = {
    schema_version: SCHEMA_VERSION,
    site_url: siteUrl || outline.site_url,
    status,
    shape_directive_used: {
      opening_shape: shapeDirective.opening_shape,
      bridge_move: shapeDirective.bridge_move,
    },
    decline: null,
    opening: null,
    skim_read: null,
    gap: null,
    lane_selection: null,
    lane_verdicts: [],
    strongest_true_thing: null,
    coverage: null,
    bridge: null,
    self_check: (prose && prose.self_check) || {},
  };

  if (status !== 'read') {
    read.shape_directive_used = null;
    read.decline = {
      observation: (prose.decline && prose.decline.observation) || '',
      redirect: (prose.decline && prose.decline.redirect) || '',
      exhibit: graftExhibit(outline.decline_material && outline.decline_material.exhibit),
    };
    read.lane_verdicts = [];
    return read;
  }

  // --- opening --------------------------------------------------------------
  read.opening = {
    text: (prose.opening && prose.opening.text) || '',
    shape: shapeDirective.opening_shape,
  };

  // --- skim -----------------------------------------------------------------
  const skimByDimension = new Map();
  for (const c of outline.skim_claims || []) skimByDimension.set(c.dimension, c);
  read.skim_read = {
    first_screen_headline_used: (outline.first_screen && outline.first_screen.headline_verbatim) || null,
    positioning_legibility: null,
    tangibles: null,
    entry_point: null,
    delivered_vs_handheld: null,
  };
  for (const key of SKIM_KEYS) {
    const claim = skimByDimension.get(key);
    const written = prose.skim_read && prose.skim_read[key];
    if (!claim && !written) continue;
    if (!claim) {
      throw new Error(`writer rendered skim dimension "${key}", which the outline does not carry`);
    }
    read.skim_read[key] = {
      observation: (written && written.observation) || '',
      exhibit: graftExhibit(claim.exhibit),
    };
  }

  // --- gap ------------------------------------------------------------------
  read.gap = {
    what_you_have: (prose.gap && prose.gap.what_you_have) || '',
    what_a_stranger_gets: (prose.gap && prose.gap.what_a_stranger_gets) || '',
    named_facts: ((outline.gap && outline.gap.named_facts) || []).map((nf) => ({
      fact: nf.fact,
      page: nf.page,
      source_sentence: nf.source_sentence,
    })),
  };

  // --- lanes ----------------------------------------------------------------
  const findingById = new Map();
  for (const f of outline.findings || []) findingById.set(f.id, f);

  read.lane_verdicts = (prose.lane_verdicts || []).map((lv) => {
    const f = findingById.get(lv.finding_id);
    if (!f) throw new Error(`writer named finding_id "${lv.finding_id}", which is not in the outline`);
    return {
      finding_id: f.id,
      lane: f.lane,
      verdict: f.verdict,
      exhibit: graftExhibit(f.exhibit),
      buried_on: f.buried_on === undefined ? null : f.buried_on,
      searched: f.searched === undefined ? null : f.searched,
      evidence: lv.evidence || '',
      bold_line: lv.bold_line === undefined ? null : lv.bold_line,
    };
  });

  // --- strongest true thing -------------------------------------------------
  if (outline.strongest_true_thing) {
    read.strongest_true_thing = {
      text: (prose.strongest_true_thing && prose.strongest_true_thing.text) || '',
      exhibit: graftExhibit(outline.strongest_true_thing.exhibit),
    };
  }

  // --- chrome ---------------------------------------------------------------
  read.lane_selection = outline.lane_selection
    ? {
        chosen: [...(outline.lane_selection.chosen || [])],
        rejected: (outline.lane_selection.rejected || []).map((r) => ({
          lane: r.lane,
          reason: r.reason,
          surfaces_searched: [...(r.surfaces_searched || [])],
        })),
      }
    : null;

  read.coverage = outline.coverage
    ? {
        lanes_examined: outline.coverage.lanes_examined,
        lanes_total: outline.coverage.lanes_total,
        not_examined: (outline.coverage.not_examined || []).map((n) => ({ lane: n.lane, reason: n.reason })),
        unfetched_pages: outline.coverage.unfetched_pages ? [...outline.coverage.unfetched_pages] : null,
      }
    : null;

  // --- bridge ---------------------------------------------------------------
  read.bridge = {
    text: (prose.bridge && prose.bridge.text) || '',
    move: shapeDirective.bridge_move,
    concrete_anchor: (prose.bridge && prose.bridge.concrete_anchor) || '',
  };

  return read;
}
