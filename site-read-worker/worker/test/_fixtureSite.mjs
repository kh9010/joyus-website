// A synthetic two-page site, extracted through the real extractor and
// assembled into a real fact sheet, so the validator tests run against the same
// object shape production produces rather than a hand-written stand-in.

import { extractPage } from '../src/extractor.js';
import { buildLinkInventory } from '../src/factSheet.js';
import { computeShapeDirective } from '../src/shapeRotation.js';

const HOME = `<!doctype html><html><body>
<header><nav>
  <a href="/">Home</a><a href="/work">Work</a><a href="/about">About</a><a href="/contact">Contact</a>
</nav></header>
<main>
  <h1>Sound that carries a room</h1>
  <p>Mara Feldt designs sound for theatre and installation work.</p>
  <p>The studio has run since 2014 out of a converted mill in Leeds.</p>
  <p>Recent work includes a score for the Vaults Festival and a commission from Site Gallery.</p>
  <p><a class="btn" href="/contact">Start a conversation</a></p>
</main>
<footer><a href="/privacy">Privacy</a> <a href="https://instagram.com/marafeldt">Instagram</a></footer>
</body></html>`;

const ABOUT = `<!doctype html><html><body>
<header><nav><a href="/">Home</a><a href="/work">Work</a></nav></header>
<main>
  <h1>About</h1>
  <p>Mara trained at the Royal Northern College of Music.</p>
  <p>She has taught sound design at Leeds Arts University since 2019.</p>
  <p>Her practice moves between live performance, gallery installation and radio.</p>
</main>
</body></html>`;

export function buildFixtureFactSheet(siteUrl = 'https://marafeldt.example/') {
  const home = extractPage(HOME, 'homepage', siteUrl);
  const about = extractPage(ABOUT, 'About', `${siteUrl}about`);
  const pages = [home, about];
  const firstHeading = home._first_heading;

  return {
    site_url: siteUrl,
    shape_directive: computeShapeDirective(siteUrl),
    fetch_record: [
      { page: 'homepage', url: siteUrl, fetched: true, word_count: home._word_count, failure_reason: null },
      { page: 'About', url: `${siteUrl}about`, fetched: true, word_count: about._word_count, failure_reason: null },
    ],
    pages: pages.map((p) => ({ page: p.page, url: p.url, text: p.text, blocks: p.blocks })),
    embedded_feeds: [],
    first_screen_headline: firstHeading
      ? { text: firstHeading.text, page: 'homepage', block_index: firstHeading.block_index }
      : null,
    link_inventory: buildLinkInventory(pages, 'homepage'),
  };
}
