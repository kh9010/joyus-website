#!/usr/bin/env node
// Replace nav and footer blocks in every HTML file from the canonical
// partials in /_partials. Run this after editing nav.html or foot.html.
//
// In each HTML file, mark where the chrome lives with:
//   <!--BEGIN:NAV-->...anything here gets overwritten...<!--END:NAV-->
//   <!--BEGIN:FOOT-->...anything here gets overwritten...<!--END:FOOT-->
//
// {{P}} in the partials is replaced with the relative path prefix needed
// to reach the repo root (e.g. "" for /home.html, "../" for /work/x.html).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['_partials', 'scripts', 'node_modules', '.git', '.claude']);

const navTpl = fs.readFileSync(path.join(ROOT, '_partials/nav.html'), 'utf8').trim();
const footTpl = fs.readFileSync(path.join(ROOT, '_partials/foot.html'), 'utf8').trim();

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.htaccess') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function pathPrefix(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const depth = rel.split('/').length - 1;
  return '../'.repeat(depth);
}

function replaceBlock(content, tag, replacement) {
  const start = `<!--BEGIN:${tag}-->`;
  const end = `<!--END:${tag}-->`;
  const re = new RegExp(
    `${start.replace(/[/]/g, '\\/')}[\\s\\S]*?${end.replace(/[/]/g, '\\/')}`,
    'g'
  );
  if (!re.test(content)) return null;
  return content.replace(re, `${start}\n${replacement}\n${end}`);
}

const files = walk(ROOT);
let changed = 0, skipped = 0;
for (const file of files) {
  const orig = fs.readFileSync(file, 'utf8');
  const prefix = pathPrefix(file);
  const nav = navTpl.replace(/\{\{P\}\}/g, prefix);
  const foot = footTpl.replace(/\{\{P\}\}/g, prefix);
  let next = orig;
  const navReplaced = replaceBlock(next, 'NAV', nav);
  if (navReplaced) next = navReplaced;
  const footReplaced = replaceBlock(next, 'FOOT', foot);
  if (footReplaced) next = footReplaced;
  if (next !== orig) {
    fs.writeFileSync(file, next);
    console.log('updated:', path.relative(ROOT, file).split(path.sep).join('/'));
    changed++;
  } else {
    skipped++;
  }
}
console.log(`\nupdated ${changed}, skipped ${skipped} (no markers)`);
