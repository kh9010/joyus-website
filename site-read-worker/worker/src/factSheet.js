// ---------------------------------------------------------------------------
// FACT SHEET — fetch the homepage, follow the fetch contract to at most five
// more pages, and assemble the exact object v4-analysis-prompt.md's
// "INPUT — THE FACT SHEET" section describes. Field names are that document's,
// verbatim: the model is instructed to copy counts out of `link_inventory`
// without recounting, so a renamed or missing field silently becomes a wrong
// number in a read someone will check against their own menu.
//
// Also runs the two deterministic pre-model gates (unfetchable, thin) so we
// never pay for a model call we already know the answer to.
// `decline_product_company` stays with the model per STEP 0 — it needs
// judgment over the fetched text — but our own heuristic is surfaced in
// gateSignals for debugging.
// ---------------------------------------------------------------------------

import { CONFIG, fetchOne, sameSite } from './fetcher.js';
import { extractPage, destinationKey } from './extractor.js';
import { computeShapeDirective } from './shapeRotation.js';

// The fetch contract's four surfaces, in priority order.
export const PAGE_BUCKETS = [
  { key: 'offer', words: ['service', 'offer', 'work', 'project', 'portfolio', 'studio', 'practice', 'program'] },
  { key: 'story', words: ['about', 'story', 'bio', 'who we', 'who i'] },
  { key: 'thinking', words: ['writing', 'note', 'journal', 'blog', 'press', 'essay', 'thought', 'article'] },
  { key: 'door', words: ['contact', 'book', 'booking', 'calendar', 'schedule', 'inquire', 'inquiry', 'enquire'] },
];

const PRODUCT_SIGNALS = [
  /\bpricing\b/i, /\bstart free\b/i, /\bfree trial\b/i, /\bsign up free\b/i,
  /\bintegrations?\b/i, /\bper (month|seat|user)\b/i, /\bapp store\b/i,
  /\bgoogle play\b/i, /\bapi docs\b/i, /\bchangelog\b/i, /\bfeature comparison\b/i,
];

function toRecordEntry(label, url, result, wordCount) {
  return {
    page: label,
    url: (result && result.finalUrl) || url,
    fetched: !!(result && result.ok),
    word_count: wordCount || 0,
    failure_reason: result && result.ok ? null : (result && result.reason) || 'fetch failed',
  };
}

function pickBucketUrl(bucket, links, baseUrl, used) {
  const doors = links.filter((l) => l.kind === 'door' && l.href && !l.is_social);
  for (const l of doors) {
    const hay = `${l.label} ${l.href}`.toLowerCase();
    if (!bucket.words.some((w) => hay.includes(w))) continue;
    const abs = l.href;
    if (!abs || !sameSite(abs, baseUrl)) continue;
    // Fragments on the homepage are the same document, not another page.
    try {
      const u = new URL(abs);
      const b = new URL(baseUrl);
      if (u.hash && u.pathname.replace(/\/$/, '') === b.pathname.replace(/\/$/, '')) continue;
    } catch { /* fall through */ }
    if (used.has(destinationKey(abs))) continue;
    return { url: abs, label: l.label || bucket.key, bucket: bucket.key };
  }
  return null;
}

/** Assembles v4's `link_inventory` from the homepage's menu plus every page's
 *  links. Doors and dropdown parents are counted separately because v4 forbids
 *  naming a dropdown parent as a place a visitor can go. */
export function buildLinkInventory(pages, homeLabel) {
  const home = pages.find((p) => p.page === homeLabel) || pages[0];
  const homeLinks = home ? home._links : [];

  const navDoors = [];
  const navSeen = new Set();
  for (const l of homeLinks) {
    if (l.location !== 'nav' || l.kind !== 'door' || l.is_social) continue;
    const k = destinationKey(l.href);
    if (navSeen.has(k)) continue;
    navSeen.add(k);
    navDoors.push(l);
  }

  const dropdownParents = homeLinks.filter((l) => l.location === 'nav' && l.kind === 'dropdown_parent');

  const footerSeen = new Set();
  const footerDoors = [];
  for (const l of homeLinks) {
    if (l.location !== 'footer' || l.kind !== 'door') continue;
    const k = destinationKey(l.href);
    if (footerSeen.has(k)) continue;
    footerSeen.add(k);
    footerDoors.push(l);
  }

  const destinations = new Set();
  const socials = [];
  const socialSeen = new Map();
  const ctas = [];
  const ctaSeen = new Set();
  for (const p of pages) {
    for (const l of p._links) {
      if (l.kind === 'door' && /^https?:/i.test(l.href)) destinations.add(destinationKey(l.href));
      // One entry per platform, not per link. A site whose front page renders a
      // photo feed carries a dozen distinct post permalinks; listing them all
      // turns "one Instagram account is linked" into "thirteen social links",
      // and that inflated number is then a count the model is entitled to
      // state. `link_count` keeps the real figure without distorting the list.
      if (l.is_social) {
        const platform = l.social_platform || 'other';
        const existing = socialSeen.get(platform);
        if (existing) {
          existing.link_count += 1;
        } else {
          const entry = { platform, href: l.href, location: l.location, link_count: 1 };
          socialSeen.set(platform, entry);
          socials.push(entry);
        }
      }
      if (l.is_cta && l.location === 'body' && l.kind === 'door') {
        const k = `${p.page}|${destinationKey(l.href)}`;
        if (!ctaSeen.has(k)) {
          ctaSeen.add(k);
          ctas.push({ label: l.label, href: l.href, page: p.page, block_index: l.block_index });
        }
      }
    }
  }

  const click_distance = {};
  for (const p of pages) click_distance[p.page] = p.page === (home ? home.page : homeLabel) ? 0 : 1;

  return {
    nav_door_count: navDoors.length,
    nav_door_labels: navDoors.map((l) => l.label),
    dropdown_parent_count: dropdownParents.length,
    dropdown_parent_labels: dropdownParents.map((l) => l.label),
    footer_door_count: footerDoors.length,
    distinct_destinations: destinations.size,
    body_ctas: ctas,
    social_links: socials,
    click_distance,
  };
}

function buildEmbeddedFeeds(pages) {
  const feeds = [];
  for (const p of pages) {
    for (const b of p.blocks) {
      if (b.type === 'embed') {
        feeds.push({
          page: p.page,
          type: b.platform || 'embed',
          item_count: b.item_count || 1,
          captions: b.sample_captions || [],
        });
      } else if (b.type === 'gallery') {
        feeds.push({
          page: p.page,
          type: 'gallery',
          item_count: b.item_count || 0,
          captions: b.sample_captions || [],
        });
      }
    }
  }
  return feeds;
}

/**
 * Fetches and extracts a site, then assembles the fact sheet and the gate.
 * @returns {Promise<{factSheet:import('./types.js').FactSheet, gate:string, gateSignals:string[], diagnostics:object}>}
 */
export async function buildFactSheet(siteUrl, options = {}) {
  const maxPages = options.maxPages || CONFIG.MAX_PAGES;
  const fetch_record = [];
  const rawPages = [];
  const attemptLog = [];
  let totalBytes = 0;

  const homeResult = await fetchOne(siteUrl);
  attemptLog.push({ page: 'homepage', attempts: homeResult.attempts });

  if (!homeResult.ok) {
    fetch_record.push(toRecordEntry('homepage', siteUrl, homeResult, 0));
    const factSheet = {
      site_url: siteUrl,
      shape_directive: computeShapeDirective(siteUrl),
      fetch_record,
      pages: [],
      embedded_feeds: [],
      first_screen_headline: null,
      link_inventory: buildLinkInventory([], 'homepage'),
    };
    return {
      factSheet,
      gate: 'decline_unfetchable',
      gateSignals: [homeResult.reason || 'homepage did not return readable HTML'],
      diagnostics: { attempts: attemptLog },
    };
  }

  totalBytes += homeResult.html.length;
  const homeUrl = homeResult.finalUrl || siteUrl;
  let home;
  try {
    home = extractPage(homeResult.html, 'homepage', homeUrl);
  } catch (err) {
    // A homepage we cannot parse is a homepage we do not have. Declining is
    // honest; a 500 to the visitor is not.
    fetch_record.push({
      page: 'homepage', url: homeUrl, fetched: false, word_count: 0,
      failure_reason: 'the page came back in a form this could not read',
    });
    return {
      factSheet: {
        site_url: siteUrl,
        shape_directive: computeShapeDirective(siteUrl),
        fetch_record,
        pages: [],
        embedded_feeds: [],
        first_screen_headline: null,
        link_inventory: buildLinkInventory([], 'homepage'),
      },
      gate: 'decline_unfetchable',
      gateSignals: [`homepage extraction failed: ${String((err && err.message) || err)}`],
      diagnostics: { attempts: attemptLog },
    };
  }
  rawPages.push(home);
  fetch_record.push(toRecordEntry('homepage', siteUrl, homeResult, home._word_count));

  const used = new Set([destinationKey(homeUrl)]);
  const chosen = [];
  for (const bucket of PAGE_BUCKETS) {
    if (chosen.length >= maxPages - 1) break;
    const pick = pickBucketUrl(bucket, home._links, homeUrl, used);
    if (pick) {
      used.add(destinationKey(pick.url));
      chosen.push(pick);
    }
  }

  for (const c of chosen) {
    if (totalBytes >= CONFIG.MAX_TOTAL_BYTES) {
      fetch_record.push({
        page: c.label, url: c.url, fetched: false, word_count: 0,
        failure_reason: 'page budget for this read was already used',
      });
      continue;
    }
    const r = await fetchOne(c.url);
    attemptLog.push({ page: c.label, attempts: r.attempts });
    if (r.ok) {
      totalBytes += r.html.length;
      // One unreadable inner page must not cost the whole read: record it as
      // unretrieved and carry on with the pages we do have.
      try {
        const p = extractPage(r.html, c.label, r.finalUrl || c.url);
        rawPages.push(p);
        fetch_record.push(toRecordEntry(c.label, c.url, r, p._word_count));
      } catch {
        fetch_record.push({
          page: c.label, url: c.url, fetched: false, word_count: 0,
          failure_reason: 'the page came back in a form this could not read',
        });
      }
    } else {
      fetch_record.push(toRecordEntry(c.label, c.url, r, 0));
    }
  }

  const link_inventory = buildLinkInventory(rawPages, 'homepage');
  const pages = rawPages.map((p) => ({ page: p.page, url: p.url, text: p.text, blocks: p.blocks }));
  const firstHeading = rawPages[0]._first_heading;

  const factSheet = {
    site_url: siteUrl,
    shape_directive: computeShapeDirective(siteUrl),
    fetch_record,
    pages,
    embedded_feeds: buildEmbeddedFeeds(rawPages),
    first_screen_headline: firstHeading
      ? { text: firstHeading.text, page: 'homepage', block_index: firstHeading.block_index }
      : null,
    link_inventory,
  };

  const totalWords = rawPages.reduce((n, p) => n + p._word_count, 0);
  const gateSignals = [`total words across retrieved pages: ${totalWords}`];
  let gate = 'read';
  if (totalWords < CONFIG.THIN_WORD_FLOOR) {
    gate = 'decline_thin';
    gateSignals.push(`under the ${CONFIG.THIN_WORD_FLOOR}-word floor`);
  }
  const homeText = rawPages[0].text;
  const productHits = PRODUCT_SIGNALS.filter((re) => re.test(homeText)).map((re) => re.source);
  if (productHits.length >= 3) gateSignals.push(`product-company signals: ${productHits.join(', ')}`);

  const unfetched = fetch_record.filter((r) => !r.fetched).map((r) => r.page);
  if (unfetched.length) gateSignals.push(`unretrieved pages: ${unfetched.join(', ')}`);

  return {
    factSheet,
    gate,
    gateSignals,
    diagnostics: { attempts: attemptLog, totalBytes, chosen: chosen.map((c) => c.bucket) },
  };
}

/** Normalizes whatever the visitor typed into a URL, or null. */
export function normalizeInputUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s.length > 2000) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}
