#!/usr/bin/env node
// scripts/podcast-meta-bake.mjs
//
// Reads every podcast/*.meta.json sidecar, flattens their `intents` arrays
// into CONTENT_MAP entry rows, and splices them into index.html between the
// `podcast.html` umbrella entry and the `// Comics` marker.
//
// Idempotent: re-running with no sidecar changes produces no diff.
//
// Usage:
//   node scripts/podcast-meta-bake.mjs           # bake + write
//   node scripts/podcast-meta-bake.mjs --dry     # print, don't write
//   node scripts/podcast-meta-bake.mjs --check   # exit 1 if index.html is stale

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const podcastDir = path.join(repoRoot, 'podcast');
const indexPath = path.join(repoRoot, 'index.html');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const check = args.includes('--check');

// Anchors in index.html — keep these stable. If you rename, update both
// places (and the splice will detect a mismatch and exit non-zero).
const BEFORE_LINE = '      { display: "a conversation worth listening to", terms: ["podcast", "thinking on thinking", "listen", "episode", "spotify", "apple podcast", "conversation"], url: "podcast.html", dest: "the podcast" },\n';
const AFTER_ANCHOR = '\n      // Comics';

// ── Load all sidecars ──
const sidecars = fs.readdirSync(podcastDir)
  .filter(f => f.endsWith('.meta.json'))
  .sort()
  .map(f => {
    const full = path.join(podcastDir, f);
    try {
      return JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      console.error(`✗ Bad JSON in ${f}: ${e.message}`);
      process.exit(2);
    }
  });

if (sidecars.length === 0) {
  console.error('✗ No sidecars found under podcast/*.meta.json. Run scripts/podcast-meta-extract.mjs first and dispatch agents.');
  process.exit(2);
}

// ── Flatten intents into CONTENT_MAP entry rows ──
function entryLine({ display, terms, url, dest }) {
  const termsStr = '[' + terms.map(t => JSON.stringify(t)).join(', ') + ']';
  return `      { display: ${JSON.stringify(display)}, terms: ${termsStr}, url: ${JSON.stringify(url)}, dest: ${JSON.stringify(dest)} },`;
}

const lines = [];
let intentCount = 0;
for (const sc of sidecars) {
  if (!Array.isArray(sc.intents)) {
    console.warn(`⚠ ${sc.slug}: no intents array, skipping`);
    continue;
  }
  for (const intent of sc.intents) {
    if (!intent.display || !intent.dest || !Array.isArray(intent.terms)) {
      console.warn(`⚠ ${sc.slug}: malformed intent, skipping`);
      continue;
    }
    if (intent.dest.length > 22) {
      console.warn(`⚠ ${sc.slug}: dest "${intent.dest}" is ${intent.dest.length} chars (>22)`);
    }
    lines.push(entryLine({
      display: intent.display,
      terms: intent.terms,
      url: sc.url,
      dest: intent.dest,
    }));
    intentCount++;
  }
}

const newBlock = lines.join('\n');

// ── Splice into index.html ──
const html = fs.readFileSync(indexPath, 'utf8');
const beforeIdx = html.indexOf(BEFORE_LINE);
const afterIdx = html.indexOf(AFTER_ANCHOR, beforeIdx);

if (beforeIdx === -1 || afterIdx === -1) {
  console.error('✗ Anchors not found in index.html — splice aborted.');
  console.error('  Expected umbrella line:', JSON.stringify(BEFORE_LINE.slice(0, 80) + '…'));
  console.error('  Expected after-anchor:', JSON.stringify(AFTER_ANCHOR));
  process.exit(2);
}

const next = html.slice(0, beforeIdx + BEFORE_LINE.length) + newBlock + '\n' + AFTER_ANCHOR + html.slice(afterIdx + AFTER_ANCHOR.length);

if (dry) {
  console.log(`(dry run) would write ${intentCount} intents from ${sidecars.length} sidecars`);
  console.log(`(dry run) preview of first 3 lines:`);
  console.log(lines.slice(0, 3).join('\n'));
  process.exit(0);
}

if (check) {
  if (next === html) {
    console.log(`✓ index.html is up-to-date (${intentCount} intents from ${sidecars.length} sidecars)`);
    process.exit(0);
  } else {
    console.error('✗ index.html is stale. Run: node scripts/podcast-meta-bake.mjs');
    process.exit(1);
  }
}

if (next === html) {
  console.log(`✓ No changes (${intentCount} intents from ${sidecars.length} sidecars — already current)`);
  process.exit(0);
}

fs.writeFileSync(indexPath, next);
console.log(`✓ Baked ${intentCount} intents from ${sidecars.length} sidecars into index.html`);
console.log(`  size delta: ${next.length - html.length} bytes`);
