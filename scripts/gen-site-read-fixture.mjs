#!/usr/bin/env node
// Generates site-read/fixture-data.js from site-read/fixture.json.
//
//   node scripts/gen-site-read-fixture.mjs
//   node scripts/gen-site-read-fixture.mjs --check   (CI-style: fails if stale)
//
// The sample read has exactly one home — site-read/fixture.json. The page
// cannot fetch() a sibling JSON from a file:// checkout, so the demo needs the
// same object as a script tag. This is the only thing that copies it; editing
// fixture-data.js by hand creates a second version of the fixture that wins by
// accident in whichever session happens to read it.
//
// The demo read is also written in two passes, the way production is: the
// outline in site-read/fixture-outline.json first, the prose from it second. So
// this script runs the SHIPPED containment check of the read against that
// outline — a sample read that quietly grows a proper noun, a number, an extra
// bold line or a sentence after the bridge fails here rather than shipping as
// the thing everyone sees first.
//
// The full validator cannot run: it grounds numbers and quotes against a FACT
// SHEET, and there is no fact sheet for a practice that does not exist. What can
// be checked without inventing one is checked.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const SOURCE = join(root, 'site-read/fixture.json');
const OUTLINE = join(root, 'site-read/fixture-outline.json');
const TARGET = join(root, 'site-read/fixture-data.js');

const raw = readFileSync(SOURCE, 'utf8');
const fixture = JSON.parse(raw);

if (fixture.status !== 'read') {
  throw new Error(`fixture.json status is "${fixture.status}" — the demo needs a full read`);
}
if (fixture.one_cut) {
  throw new Error('fixture.json carries a one_cut — the synthesis slot was removed in 5.2');
}

// --- hold the sample to the same checks the pipeline holds a real read to ---
const { checkContainment } = await import('../site-read-worker/worker/src/containment.js');
const { writerView } = await import('../site-read-worker/worker/src/promptAssembler.js');
const { renderProse, wordCount } = await import('../site-read-worker/worker/src/validator.js');

const outline = writerView(JSON.parse(readFileSync(OUTLINE, 'utf8')));
const violations = checkContainment(fixture, outline);
if (violations.length) {
  console.error('the sample read does not stay inside its own outline:');
  for (const v of violations) console.error(`  [${v.code}] ${v.message}`);
  process.exit(1);
}

const prose = renderProse(fixture);
const words = wordCount(prose);
if (words < 250 || words > 400) {
  console.error(`the sample read is ${words} words; it must land between 250 and 400`);
  process.exit(1);
}
if (!prose.trim().endsWith(fixture.bridge.text.trim())) {
  console.error('the sample read does not end on its bridge');
  process.exit(1);
}
const boldLines = fixture.lane_verdicts.filter((lv) => lv.bold_line);
if (boldLines.length !== 1) {
  console.error(`the sample read carries ${boldLines.length} bold lines; the plan marks exactly one`);
  process.exit(1);
}
console.log(`sample read: ${words} words, ends on the bridge, one bold line, nothing outside the outline`);

const banner = `/* fixture-data.js — GENERATED. Do not hand-edit.
   Source: site-read/fixture.json
   Regenerate: node scripts/gen-site-read-fixture.mjs

   The sample read rendered at /site-read/?demo=1. A fictional practice at a
   domain that does not exist — no real person's site is ever rendered here. */
`;

const out = `${banner}window.JOYUS_SITE_READ_FIXTURE = ${JSON.stringify(fixture, null, 2)};\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : '';
  if (current !== out) {
    console.error('site-read/fixture-data.js is stale — run: node scripts/gen-site-read-fixture.mjs');
    process.exit(1);
  }
  console.log('site-read/fixture-data.js is current');
  process.exit(0);
}

writeFileSync(TARGET, out);
console.log(`wrote site-read/fixture-data.js (${out.length} bytes) from fixture.json`);
