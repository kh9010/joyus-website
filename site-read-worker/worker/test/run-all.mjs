// Runs every suite in a child process each, so one crash cannot hide the rest.
//
//   node test/run-all.mjs             all suites (test-real-sites needs network)
//   node test/run-all.mjs --offline   skip the suite that hits the internet

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const offline = process.argv.includes('--offline');

const SUITES = [
  ['extractor  (offline)', 'test-extractor.mjs'],
  ['fetcher    (local server)', 'test-fetcher.mjs'],
  ['outline    (offline)', 'test-outline-validator.mjs'],
  ['containment(offline)', 'test-containment.mjs'],
  ['validator  (offline)', 'test-validator.mjs'],
  ['plumbing   (offline)', 'test-plumbing.mjs'],
  ['worker     (local server + stubbed two-pass model)', 'test-worker.mjs'],
  ['real sites (network)', 'test-real-sites.mjs'],
];

const results = [];
for (const [label, file] of SUITES) {
  if (offline && file === 'test-real-sites.mjs') {
    results.push([label, 'SKIPPED']);
    continue;
  }
  console.log(`\n${'█'.repeat(70)}\n██ ${label}\n${'█'.repeat(70)}`);
  const r = spawnSync(process.execPath, [join(here, file)], { stdio: 'inherit' });
  results.push([label, r.status === 0 ? 'PASS' : 'FAIL']);
}

console.log(`\n${'█'.repeat(70)}\n██ SUMMARY\n${'█'.repeat(70)}`);
for (const [label, status] of results) console.log(`  ${status.padEnd(8)} ${label}`);
process.exit(results.some(([, s]) => s === 'FAIL') ? 1 : 0);
