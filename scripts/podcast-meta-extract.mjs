#!/usr/bin/env node
// scripts/podcast-meta-extract.mjs
//
// Walks podcast/*.html, pulls h1 + meta description + full transcript text
// out of each page, and writes a bundle of "needs-meta" episodes to
// /tmp/podcast-meta-chunk-N.json so parallel Claude agents can consume one
// chunk each and write per-episode sidecars.
//
// Skips episodes that already have podcast/<slug>.meta.json with a matching
// transcript_hash (so re-running is cheap; only new or edited transcripts
// queue for regeneration).
//
// Usage:
//   node scripts/podcast-meta-extract.mjs               # default 3 chunks
//   node scripts/podcast-meta-extract.mjs --chunks 4    # override
//   node scripts/podcast-meta-extract.mjs --force       # ignore existing sidecars

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const podcastDir = path.join(repoRoot, 'podcast');

// Index/series pages that are not single episodes — skip these.
const SKIP = new Set([
  'archive.html',
  'founder-interviews.html',
  'success-series.html',
  'story-vs-telling-series.html',
  'season-one-wrapped.html',
]);

const args = process.argv.slice(2);
const force = args.includes('--force');
const chunkArgIdx = args.indexOf('--chunks');
const NUM_CHUNKS = chunkArgIdx >= 0 ? parseInt(args[chunkArgIdx + 1], 10) : 3;

function hash(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

function extractTranscript(html) {
  // Transcripts live in <details class="ep-transcript"><div class="ep-transcript-content">...<p>...</p></div></details>
  const block = html.match(/<div class="ep-transcript-content">([\s\S]*?)<\/div>/);
  if (!block) return '';
  return [...block[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim())
    .filter(Boolean)
    .join('\n\n');
}

function extractMeta(html) {
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1];
  return { h1, desc };
}

const files = fs.readdirSync(podcastDir)
  .filter(f => f.endsWith('.html') && !SKIP.has(f))
  .sort();

const needsRegen = [];
const skipped = [];

for (const file of files) {
  const html = fs.readFileSync(path.join(podcastDir, file), 'utf8');
  const transcript = extractTranscript(html);
  const { h1, desc } = extractMeta(html);
  const url = 'podcast/' + file;
  const transcriptHash = hash(transcript);

  const slug = file.replace(/\.html$/, '');
  const sidecarPath = path.join(podcastDir, slug + '.meta.json');

  if (!force && fs.existsSync(sidecarPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
      if (existing.transcript_hash === transcriptHash) {
        skipped.push(file);
        continue;
      }
    } catch { /* malformed sidecar — regen */ }
  }

  needsRegen.push({
    slug,
    file,
    url,
    h1,
    desc,
    transcript,
    transcript_hash: transcriptHash,
    transcript_length: transcript.length,
  });
}

// Clear any stale chunk files from previous runs.
for (const f of fs.readdirSync('/tmp').filter(f => /^podcast-meta-chunk-\d+\.json$/.test(f))) {
  fs.unlinkSync(path.join('/tmp', f));
}

if (needsRegen.length === 0) {
  console.log(`✓ All ${files.length} episodes have up-to-date sidecars. Skipped ${skipped.length}.`);
  process.exit(0);
}

// Round-robin distribute episodes into N chunks so each agent gets similar load.
const chunks = Array.from({ length: NUM_CHUNKS }, () => []);
needsRegen.forEach((ep, i) => chunks[i % NUM_CHUNKS].push(ep));

chunks.forEach((c, i) => {
  if (c.length === 0) return;
  fs.writeFileSync(`/tmp/podcast-meta-chunk-${i + 1}.json`, JSON.stringify(c, null, 2));
});

const written = chunks.filter(c => c.length > 0).length;
console.log(`✓ ${needsRegen.length} episodes need sidecars (${skipped.length} already current).`);
console.log(`✓ Wrote ${written} chunk file(s) to /tmp/podcast-meta-chunk-N.json`);
console.log('');
console.log('Dispatch agents next — one per chunk file. See scripts/podcast-meta-prompt.txt.');
