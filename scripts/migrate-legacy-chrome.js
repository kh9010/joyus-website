#!/usr/bin/env node
// One-shot migration: swap legacy <nav class="nav-bar">...</nav> + <footer class="footer">...</footer>
// blocks for <!--BEGIN:NAV--><!--END:NAV--> and <!--BEGIN:FOOT--><!--END:FOOT--> markers.
// After running this, run scripts/sync-chrome.js to populate the markers.
//
// Targets: 31 legacy "editorial wing" pages (hubs, thinking essays, comics, about,
// ai-workshops, services-old, 404). Skips files already on the partial system.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  'hub-story.html', 'hub-building.html', 'hub-behavior.html', 'hub-play.html', 'hub-games.html', 'hub-creative.html',
  'about.html', 'ai-workshops.html', '404.html',
  'comics/index.html', 'comics/the-friend-comic.html', 'comics/gossip.html',
  // services-old.html and *-old archives intentionally NOT migrated (archives stay legacy)
  'thinking/ai-made-us-smaller-and-weirder.html',
  'thinking/code-as-material.html',
  'thinking/designing-for-the-decision-they-almost-made.html',
  'thinking/doing-serious-things-unseriously.html',
  'thinking/from-zero-to-150-daily-sales.html',
  'thinking/pain-is-a-signal.html',
  'thinking/the-accidental-brand.html',
  'thinking/the-game-designers-toolkit.html',
  'thinking/the-two-person-studio.html',
  'thinking/voice-versus-tone.html',
  'thinking/what-making-comics-taught-us.html',
  'thinking/what-we-learned-from-story-vs-telling.html',
  'thinking/why-people-gossip.html',
  'thinking/why-your-nonprofits-website-isnt-raising-money.html',
  'thinking/your-pitch-deck-is-not-your-story.html',
];

// Match <nav class="nav-bar">...</nav> non-greedy across lines.
const NAV_RE = /(?:<!--\s*NAVIGATION\s*-->\s*)?<nav\s+class="nav-bar"[\s\S]*?<\/nav>/i;
// Match <footer class="footer">...</footer> non-greedy across lines.
const FOOT_RE = /(?:<!--\s*FOOTER\s*-->\s*)?<footer\s+class="footer"[\s\S]*?<\/footer>/i;
// Match the legacy hamburger/scroll script that controls .nav-bar — only if it references both.
// Pattern: <script>...nav-bar...hamburger...</script>
const LEGACY_SCRIPT_RE = /<script>(?:(?!<\/script>)[\s\S])*?\.nav-bar(?:(?!<\/script>)[\s\S])*?<\/script>/i;

let total = 0, skipped = 0;
const issues = [];

for (const rel of TARGETS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    issues.push(`MISSING: ${rel}`);
    continue;
  }
  let src = fs.readFileSync(full, 'utf8');
  const before = src;

  // Already migrated?
  if (/<!--BEGIN:NAV-->/.test(src) && /<!--BEGIN:FOOT-->/.test(src)) {
    skipped++;
    continue;
  }

  let navHits = 0, footHits = 0, scriptHits = 0;

  if (NAV_RE.test(src)) {
    src = src.replace(NAV_RE, '<!--BEGIN:NAV--><!--END:NAV-->');
    navHits++;
  }
  if (FOOT_RE.test(src)) {
    src = src.replace(FOOT_RE, '<!--BEGIN:FOOT--><!--END:FOOT-->');
    footHits++;
  }
  // Strip the legacy nav-controller script (the partial has its own).
  if (LEGACY_SCRIPT_RE.test(src)) {
    src = src.replace(LEGACY_SCRIPT_RE, '');
    scriptHits++;
  }

  if (!navHits) issues.push(`no nav-bar found: ${rel}`);
  if (!footHits) issues.push(`no footer found: ${rel}`);

  if (src !== before) {
    fs.writeFileSync(full, src);
    total++;
    console.log(`migrated: ${rel}  (nav:${navHits} foot:${footHits} legacy-script:${scriptHits})`);
  } else {
    skipped++;
  }
}

console.log(`\nmigrated ${total}, skipped ${skipped}`);
if (issues.length) {
  console.log('\nissues:');
  issues.forEach(i => console.log('  ' + i));
}
