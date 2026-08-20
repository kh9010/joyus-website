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

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const SOURCE = join(root, 'site-read/fixture.json');
const TARGET = join(root, 'site-read/fixture-data.js');

const raw = readFileSync(SOURCE, 'utf8');
const fixture = JSON.parse(raw);

if (fixture.status !== 'read') {
  throw new Error(`fixture.json status is "${fixture.status}" — the demo needs a full read`);
}

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
