// ---------------------------------------------------------------------------
// TYPES + SHARED ENUMS
//
// The fact-sheet contract below is not ours to invent: it is transcribed from
// the "INPUT — THE FACT SHEET" section of v4-analysis-prompt.md, which is the
// authority. Field names here must match that document exactly — the model is
// told to copy numbers out of `link_inventory` verbatim, so a renamed field is
// a silently wrong read, not a compile error.
//
// Plain JS with JSDoc typedefs rather than TypeScript: this keeps the worker a
// zero-dependency, zero-build-step ES module that `wrangler deploy` ships as-is
// and `node test/*.mjs` imports directly. `npm run typecheck` still type-checks
// these annotations via `tsc --checkJs` when TypeScript is available locally.
// ---------------------------------------------------------------------------

/** The six lanes, in the order v4 lists them (order matters: a read that
 *  returns them in this order has defaulted, which the validator checks). */
export const LANES = [
  'spine_story',
  'website_sequencing',
  'credibility_surface',
  'short_form_social',
  'long_form_writing',
  'publishing_rhythm',
];

export const OPENING_SHAPES = ['stranger_result', 'first_screen_quote', 'front_door_function'];
export const CUT_SHAPES = ['named_thing_consequence', 'parallel_clauses', 'x_not_y'];
export const BRIDGE_MOVES = ['scale_of_change', 'page_that_must_move', 'what_a_stranger_cannot_do'];

/** Block types v4 enumerates for `pages[].blocks[].type`. */
export const BLOCK_TYPES = ['heading', 'text', 'image', 'gallery', 'embed', 'button', 'form', 'nav', 'footer'];

export const SCHEMA_VERSION = '4.0';

/**
 * @typedef {Object} Block
 * @property {number} index            1 = topmost block on the page.
 * @property {'heading'|'text'|'image'|'gallery'|'embed'|'button'|'form'|'nav'|'footer'} type
 * @property {string} [text]           Visible text, where the block has any.
 * @property {string} [alt]            Image alt text (never merged into `text`).
 * @property {number} [level]          Heading level 1-6.
 * @property {number} [item_count]     Galleries, feeds, navs, forms.
 * @property {string[]} [sample_captions] Galleries and feeds.
 * @property {string} [platform]       Embed platform.
 * @property {string} [src]            Image / embed source URL.
 * @property {string} [href]           Button destination.
 */

/**
 * @typedef {Object} PageFacts
 * @property {string} page             Human label ("homepage", "About").
 * @property {string} url
 * @property {string} text             Verbatim visible text in reading order.
 * @property {Block[]} blocks
 */

/**
 * @typedef {Object} FetchRecordEntry
 * @property {string} page
 * @property {string} url
 * @property {boolean} fetched
 * @property {number} word_count
 * @property {string|null} failure_reason
 */

/**
 * @typedef {Object} LinkInventory
 * @property {number} nav_door_count
 * @property {string[]} nav_door_labels
 * @property {number} dropdown_parent_count
 * @property {string[]} dropdown_parent_labels
 * @property {number} footer_door_count
 * @property {number} distinct_destinations
 * @property {{label:string,href:string,page:string,block_index:number|null}[]} body_ctas
 * @property {{platform:string,href:string,location:string}[]} social_links
 * @property {Record<string, number>} click_distance  Page label -> clicks from the homepage.
 */

/**
 * @typedef {Object} FactSheet
 * @property {string} site_url
 * @property {{opening_shape:string,cut_shape:string,bridge_move:string,seed:number}} shape_directive
 * @property {FetchRecordEntry[]} fetch_record
 * @property {PageFacts[]} pages
 * @property {{page:string,type:string,item_count:number,captions:string[]}[]} embedded_feeds
 * @property {{text:string,page:string,block_index:number}|null} first_screen_headline
 * @property {LinkInventory} link_inventory
 */

/**
 * @typedef {Object} Violation
 * @property {string} code
 * @property {string} message
 * @property {string} [path]
 */
