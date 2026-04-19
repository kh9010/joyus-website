#!/usr/bin/env node
// One-time helper. Wraps the existing <nav class="nav">…</nav> and
// <footer class="foot">…</footer> blocks with BEGIN/END markers so
// scripts/sync-chrome.js can keep them in sync from /_partials.

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  'home.html',
  'services.html',
  'work/index.html',
  'work/tomboyx.html',
  'work/agemo.html',
  'work/xtdb.html',
  'work/tatsam.html',
  'work/secret-senses.html',
  'work/gliitch.html',
  'work/pratham.html',
  'work/convegenius.html',
  'work/klydo.html',
  'work/rachna-nivas.html',
];

function wrapBlock(content, openRe, closeStr, tag) {
  if (content.includes('<!--BEGIN:' + tag + '-->')) return content;
  const openMatch = content.match(openRe);
  if (!openMatch) return content;
  const openIdx = openMatch.index;
  const afterOpen = content.indexOf(closeStr, openIdx);
  if (afterOpen === -1) return content;
  const closeEnd = afterOpen + closeStr.length;
  return (
    content.substring(0, openIdx) +
    '<!--BEGIN:' + tag + '-->\n' +
    content.substring(openIdx, closeEnd) +
    '\n<!--END:' + tag + '-->' +
    content.substring(closeEnd)
  );
}

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { console.log('skip (missing):', rel); continue; }
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  content = wrapBlock(content, /<nav class="nav"[^>]*>/, '</nav>', 'NAV');
  content = wrapBlock(content, /<footer class="foot"[^>]*>/, '</footer>', 'FOOT');
  if (content !== before) {
    fs.writeFileSync(file, content);
    console.log('marked:', rel);
  } else {
    console.log('already marked or no match:', rel);
  }
}
