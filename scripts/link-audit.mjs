// Internal link/asset audit: resolves every relative href/src in the site's
// HTML against the filesystem and reports targets that don't exist.
// Usage: node scripts/link-audit.mjs
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const htmlFiles = [];

// Skip template/source files that legitimately contain placeholder tokens
// ({{P}}, {{SPOTIFY_EP_URL}}) or JS template literals (${...}).
const SKIP = (p) =>
  p.includes('_partials') || p.endsWith('.template.html');

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html') && !SKIP(p)) htmlFiles.push(p);
  }
}
walk(ROOT);

// GitHub Pages serves the site under /joyus-website/, so an absolute
// "/joyus-website/foo" maps to ROOT/foo.
const GH_BASE = '/joyus-website';

const ATTR = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const isExternal = (u) =>
  /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(u);

const missing = [];      // {file, line, raw, resolved}
const externalHosts = {}; // host -> count (informational)

for (const file of htmlFiles) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    let m;
    ATTR.lastIndex = 0;
    while ((m = ATTR.exec(line))) {
      const raw = m[1].trim();
      if (!raw) continue;
      // Skip unresolved template syntax (JS template literals / mustache tokens)
      if (raw.includes('${') || raw.includes('{{')) continue;
      if (isExternal(raw)) {
        const hm = raw.match(/^https?:\/\/([^/]+)/i);
        if (hm) externalHosts[hm[1]] = (externalHosts[hm[1]] || 0) + 1;
        continue;
      }
      // strip query/hash
      const clean = raw.split('#')[0].split('?')[0];
      if (!clean) continue;
      let target = clean.startsWith('/')
        ? join(ROOT, clean.startsWith(GH_BASE + '/') ? clean.slice(GH_BASE.length) : clean)
        : resolve(dirname(file), clean);
      target = normalize(target);
      // directory link -> index.html
      let ok = existsSync(target);
      if (ok && statSync(target).isDirectory()) {
        ok = existsSync(join(target, 'index.html'));
      }
      if (!ok) {
        missing.push({
          file: file.replace(ROOT, '').replace(/\\/g, '/'),
          line: i + 1,
          raw,
        });
      }
    }
  });
}

console.log(`Scanned ${htmlFiles.length} HTML files.\n`);
console.log(`=== MISSING internal targets: ${missing.length} ===`);
const byTarget = {};
for (const r of missing) (byTarget[r.raw] ||= []).push(`${r.file}:${r.line}`);
for (const [raw, locs] of Object.entries(byTarget).sort()) {
  console.log(`\n  ${raw}  (${locs.length}x)`);
  for (const l of locs.slice(0, 6)) console.log(`      ${l}`);
  if (locs.length > 6) console.log(`      …and ${locs.length - 6} more`);
}
console.log(`\n=== External hosts referenced (informational) ===`);
for (const [h, c] of Object.entries(externalHosts).sort((a, b) => b[1] - a[1]))
  console.log(`  ${c.toString().padStart(4)}  ${h}`);
