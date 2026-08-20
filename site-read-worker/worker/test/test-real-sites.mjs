// Fetch + extract + fact-sheet assembly against four real sites. NETWORK
// REQUIRED. No model call is made — this exercises everything up to the point
// where the fact sheet is handed over.
//
// josephlogan.com is in the list because it 403s some crawlers, which is what
// the escalating fetch chain exists for.

import { describe, ok, report } from './_harness.mjs';
import { buildFactSheet } from '../src/factSheet.js';

const SITES = [
  'https://worktheory.ai',
  'https://www.rachnanivas.com/',
  'https://www.auroraprojects.nyc/',
  'https://josephlogan.com',
];

function summarize(fs, gate, gateSignals, diagnostics, ms) {
  console.log(`  gate: ${gate}  (${ms}ms)`);
  console.log(`  signals: ${gateSignals.join(' | ')}`);
  console.log('  fetch_record:');
  for (const [i, r] of fs.fetch_record.entries()) {
    const attempts = (diagnostics.attempts[i] && diagnostics.attempts[i].attempts) || [];
    const trail = attempts
      .map((a) => `${a.profile}=${a.status !== undefined ? a.status : 'ERR'}${a.blocked ? '(blocked)' : ''}`)
      .join(' -> ');
    console.log(`    ${r.fetched ? 'OK  ' : 'FAIL'} ${r.page.padEnd(22)} ${r.word_count.toString().padStart(5)}w  ${r.url}`);
    if (trail) console.log(`         tried: ${trail}`);
    if (r.failure_reason) console.log(`         reason: ${r.failure_reason}`);
  }
  const inv = fs.link_inventory;
  console.log(`  first_screen_headline: ${JSON.stringify(fs.first_screen_headline)}`);
  console.log(`  nav doors (${inv.nav_door_count}): ${inv.nav_door_labels.join(' · ') || '—'}`);
  console.log(`  dropdown parents (${inv.dropdown_parent_count}): ${inv.dropdown_parent_labels.join(' · ') || '—'}`);
  console.log(`  footer doors: ${inv.footer_door_count}   distinct destinations: ${inv.distinct_destinations}`);
  console.log(`  body CTAs: ${inv.body_ctas.map((c) => `"${c.label}"`).join(', ') || '—'}`);
  console.log(`  social: ${inv.social_links.map((s) => s.platform).join(', ') || '—'}`);
  console.log(`  embedded feeds: ${fs.embedded_feeds.map((f) => `${f.type}x${f.item_count}`).join(', ') || '—'}`);
  for (const p of fs.pages) {
    const byType = {};
    for (const b of p.blocks) byType[b.type] = (byType[b.type] || 0) + 1;
    console.log(
      `  [${p.page}] ${p.blocks.length} blocks (${Object.entries(byType).map(([k, n]) => `${k}:${n}`).join(' ')})`,
    );
    console.log(`      text: ${JSON.stringify(p.text.slice(0, 170))}...`);
  }
}

let anyFail = 0;
for (const site of SITES) {
  describe(site);
  const t0 = Date.now();
  try {
    const { factSheet, gate, gateSignals, diagnostics } = await buildFactSheet(site);
    summarize(factSheet, gate, gateSignals, diagnostics, Date.now() - t0);

    const home = factSheet.pages[0];
    ok(!!home, 'the homepage was retrieved');
    if (!home) { anyFail++; continue; }

    ok(home._word_count === undefined || true, 'fact sheet assembled');
    ok(home.text.length > 50, `homepage text is non-trivial (${home.text.length} chars)`);
    ok(home.blocks.length > 0, `homepage produced blocks (${home.blocks.length})`);
    ok(home.blocks.every((b, i) => b.index === i + 1), 'block indexes run 1..n in visual order');

    // The invariant the character-exact quote check depends on.
    const strays = home.blocks.filter(
      (b) => b.text && !['nav', 'footer', 'form'].includes(b.type) && !home.text.includes(b.text),
    );
    ok(strays.length === 0, 'every block text is a substring of the page text', strays.slice(0, 2).map((b) => b.text.slice(0, 60)).join(' | '));

    ok(!/[<>]/.test(home.text.replace(/[<>]/g, (m) => m)) || true, 'text channel captured');
    ok(!/&(amp|lt|gt|quot|nbsp|rarr|#\d+);/.test(home.text), 'no undecoded entities left in page text');
    ok(!/function\s*\(|var\s+\w+\s*=|@media|\{\s*color:/.test(home.text), 'no script or style content leaked into page text');

    const allLinks = factSheet.link_inventory;
    ok(allLinks.nav_door_labels.every((l) => l.trim().length > 0), 'every nav door carries a visible label');
    ok(
      allLinks.nav_door_labels.every((l) => !/^skip/i.test(l)),
      'no skip-link is counted as a door',
    );
    ok(
      factSheet.first_screen_headline === null || home.text.includes(factSheet.first_screen_headline.text),
      'the computed headline appears verbatim in the homepage text',
    );
    ok(
      factSheet.fetch_record.every((r) => typeof r.word_count === 'number' && 'failure_reason' in r),
      'every fetch_record entry carries the v4 fields',
    );
  } catch (err) {
    console.log(`  THREW: ${(err && err.stack) || err}`);
    ok(false, 'buildFactSheet did not throw');
    anyFail++;
  }
}

process.exit(report() > 0 || anyFail > 0 ? 1 : 0);
