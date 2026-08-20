// Extractor fixtures — every named defect the merge was supposed to fix gets a
// planted case here, so a regression fails loudly rather than quietly shipping
// a wrong fact sheet.

import { describe, ok, eq, report } from './_harness.mjs';
import { extractPage } from '../src/extractor.js';
import { decodeEntities } from '../src/html.js';

const FIXTURE = `<!doctype html>
<html><head><title>Page title should never be page text</title>
<style>.x { color: red }</style>
<script>var leak = "SCRIPT_LEAK";</script>
</head>
<body>
<a href="#main" class="skip">Skip to content</a>
<header>
  <nav aria-label="Primary">
    <a href="/">Home</a>
    <a href="/work/">The Work</a>
    <a href="#" aria-haspopup="true">More</a>
    <a href="/about">About</a>
  </nav>
</header>
<main>
  <h1>Real <em>Headline</em> Here</h1>
  <h2>You run the business.</h2>
  <h2>You do the work.</h2>
  <p>Sentence one.</p><p>Sentence two.</p>
  <p>Inline <b>bo</b>ld stays glued.</p>
  <p>Arrow entity: Enter the Village &rarr;</p>
  <p><a href="/reg?id=551328&amp;pre=21648748">Register now</a></p>
  <p><a class="btn" href="/book">Book a call</a></p>
  <span class="sr-only">SRONLY_LEAK</span>
  <div aria-hidden="true">ARIAHIDDEN_LEAK</div>
  <div hidden>HIDDENATTR_LEAK</div>
  <div style="display: none">DISPLAYNONE_LEAK</div>
  <template><p>TEMPLATE_LEAK</p></template>
  <!-- <a href="/commented">COMMENT_LEAK</a> -->
  <noscript>NOSCRIPT_LEAK</noscript>
  <figure>
    <iframe src="https://www.youtube.com/embed/abc123" title="A talk from 2019"></iframe>
    <figcaption>Recorded at the studio.</figcaption>
  </figure>
  <div class="grid">
    <img src="/1.jpg" alt="Bowl one">
    <img src="/2.jpg" alt="Bowl two">
    <img src="/3.jpg" alt="Bowl three">
    <img src="/4.jpg" alt="">
  </div>
  <a href="https://instagram.com/example"><img src="/ig.svg" alt=""></a>
  <a href="https://instagram.com/example2"><img src="/ig.svg" alt="Instagram"></a>
</main>
<footer>
  <nav><a href="/privacy">Privacy</a><a href="/contact">Contact</a></nav>
  <a href="https://instagram.com/example">Instagram</a>
</footer>
</body></html>`;

const page = extractPage(FIXTURE, 'homepage', 'https://example.com/');

describe('hidden content never reaches the fact sheet');
for (const marker of [
  'SCRIPT_LEAK', 'SRONLY_LEAK', 'ARIAHIDDEN_LEAK', 'HIDDENATTR_LEAK',
  'DISPLAYNONE_LEAK', 'TEMPLATE_LEAK', 'COMMENT_LEAK', 'NOSCRIPT_LEAK',
]) {
  ok(!page.text.includes(marker), `${marker} excluded from page text`);
  ok(!JSON.stringify(page.blocks).includes(marker), `${marker} excluded from blocks`);
}
ok(!page.text.includes('Page title should never be page text'), '<title> is not page text');

describe('first-screen headline is the whole heading, not its first text node');
const h1 = page.blocks.find((b) => b.type === 'heading');
eq(h1.text, 'Real Headline Here', 'h1 with inline markup returns the whole heading');
eq(h1.level, 1, 'heading level recorded');

describe('block boundaries separate; inline markup stays glued');
ok(page.text.includes('You run the business. You do the work.'), 'adjacent headings do not glue');
ok(!page.text.includes('business.You'), 'no glue join between block elements');
ok(page.text.includes('Sentence one. Sentence two.'), 'adjacent paragraphs separate');
ok(page.text.includes('Inline bold stays glued'), 'inline element does not split a word');
ok(!page.text.includes('PrivacyContact'), 'adjacent footer links do not glue');

describe('entity decoding, in text and in attributes');
ok(page.text.includes('Enter the Village →'), '&rarr; decoded in text');
ok(!page.text.includes('&rarr;'), 'no raw entity left in text');
const reg = page._links.find((l) => l.label === 'Register now');
ok(reg && reg.href.includes('id=551328&pre=21648748'), '&amp; decoded inside href', reg && reg.href);
ok(reg && !reg.href.includes('&amp;'), 'no double-encoded ampersand in a resolved href');
eq(decodeEntities('a &lt;b&gt; &#65; &#x42; &unknown;'), 'a <b> A B &unknown;', 'numeric + named + unknown entities');

describe('label-less anchors are dropped, alt text recovers a label');
const igLinks = page._links.filter((l) => l.href.includes('instagram.com'));
ok(igLinks.every((l) => l.label), 'no empty-label link survives');
ok(igLinks.some((l) => l.label === 'Instagram'), 'an anchor labelled only by img alt keeps that label');
ok(page._links.every((l) => l.label.length > 0), 'every emitted link carries a visible label');

describe('nav vs footer, and hash-only doors');
const navDoors = page._links.filter((l) => l.location === 'nav' && l.kind === 'door');
eq(navDoors.map((l) => l.label), ['Home', 'The Work', 'About'], 'nav doors keep their labels');
ok(page._links.some((l) => l.label === 'More' && l.kind === 'dropdown_parent'), 'aria-haspopup anchor is a dropdown parent');
ok(page._links.some((l) => l.label === 'Skip to content' && l.kind === 'skip'), 'skip link is classified, not counted as a door');
const footerDoors = page._links.filter((l) => l.location === 'footer' && l.kind === 'door');
ok(footerDoors.length === 3, 'a nav nested inside a footer is footer, not nav', JSON.stringify(footerDoors.map((l) => l.label)));

describe('hash-only menus stay distinct');
const onePage = extractPage(
  `<nav><a href="#home">Home</a><a href="#work">The Work</a><a href="#research">Research</a><a href="#about">About</a></nav><h1>One page</h1>`,
  'homepage',
  'https://example.com/',
);
eq(
  onePage._links.filter((l) => l.kind === 'door').map((l) => l.label),
  ['Home', 'The Work', 'Research', 'About'],
  'four fragment doors do not collapse into one',
);

describe('galleries, embeds and buttons');
const gallery = page.blocks.find((b) => b.type === 'gallery');
ok(!!gallery, 'a run of images becomes one gallery block');
eq(gallery.item_count, 4, 'gallery item_count counts every image in the run');
eq(gallery.sample_captions, ['Bowl one', 'Bowl two', 'Bowl three'], 'gallery captions are the non-empty alts');
const embed = page.blocks.find((b) => b.type === 'embed');
ok(!!embed && embed.platform === 'youtube', 'third-party iframe becomes a youtube embed block');
ok(embed.sample_captions.includes('A talk from 2019'), 'iframe title becomes a caption');
ok(embed.sample_captions.includes('Recorded at the studio.'), 'figcaption in the same figure becomes a caption');
const button = page.blocks.find((b) => b.type === 'button');
ok(!!button && button.text === 'Book a call', 'a button-classed anchor becomes a button block');
const buttonTextBlocks = page.blocks.filter((b) => b.type === 'text' && b.text === 'Book a call');
eq(buttonTextBlocks.length, 0, 'a button label is not also emitted as a text block');

describe('nav and footer are single blocks in visual order');
const navBlock = page.blocks.find((b) => b.type === 'nav');
const footerBlock = page.blocks.find((b) => b.type === 'footer');
ok(!!navBlock, 'nav block emitted');
ok(!!footerBlock, 'footer block emitted');
ok(navBlock.index < h1.index, 'the menu sits above the headline in block order');
ok(footerBlock.index > h1.index, 'the footer sits below the headline in block order');
eq(page.blocks.map((b) => b.index), page.blocks.map((_, i) => i + 1), 'block indexes are 1..n in order');

describe('the substring invariant the validator depends on');
let violations = 0;
for (const b of page.blocks) {
  if (!b.text) continue;
  if (b.type === 'nav' || b.type === 'footer' || b.type === 'form') continue; // rolled-up regions
  if (!page.text.includes(b.text)) {
    violations++;
    console.log(`        block ${b.index} (${b.type}) not a substring: ${JSON.stringify(b.text.slice(0, 60))}`);
  }
}
eq(violations, 0, 'every block text is a character-exact substring of the page text');

describe('malformed HTML does not latch the hidden flag');
const malformed = extractPage(
  `<div style="display:none"><span>HIDDEN<div><p>Visible after an unclosed div`,
  'homepage',
  'https://example.com/',
);
ok(!malformed.text.includes('HIDDEN'), 'hidden subtree still excluded');
const unclosed = extractPage(
  `<div style="display:none">HIDDEN<div></div></div><p>VISIBLE_TAIL</p>`,
  'homepage',
  'https://example.com/',
);
ok(unclosed.text.includes('VISIBLE_TAIL'), 'content after a hidden div is still extracted');
ok(!unclosed.text.includes('HIDDEN'), 'the hidden div itself stays excluded');

process.exit(report() > 0 ? 1 : 0);
