#!/usr/bin/env node
// scripts/podcast-sync.mjs
//
// Pulls the Thinking on Thinking RSS feed, finds episodes that aren't on the
// site yet, and scaffolds everything a new episode needs:
//   • podcast/<slug>.html               (full episode page, from template)
//   • podcast.html  featured block      (swapped to the newest)
//   • podcast.html  backlog <li>         (prepended)
//   • podcast.html  archive counts        (bumped)
//   • sitemap.xml   <url>                 (added)
//   • podcast/<slug>.meta.json            (search sidecar — when drafts supply intents)
//   • prev-newest episode nav-bar         (gets a "Newer →" link to the new one)
//
// Data sources (both verified live):
//   RSS    https://anchor.fm/s/ab690c0c/podcast/rss   → title, desc, date, duration, S/E, mp3, Spotify link
//   Apple  itunes lookup (entity=podcastEpisode)      → per-episode trackId (matched on guid) for the player embed
//
// The mechanical fields fill straight from the feed. The "voice" fields — the
// featured excerpt, notable-moment quotes, the backlog theme tag, and the
// search intents — are judgment calls: pass them via --drafts <file.json>
// (see scripts/podcast-sync-draft-prompt.txt). Without drafts the tool falls
// back to the raw feed blurb so the page still ships, just rougher.
//
// This NEVER touches git. It leaves a clean working tree for you to review and
// commit on your own cadence.
//
// Usage:
//   node scripts/podcast-sync.mjs                 # scan + apply (writes files)
//   node scripts/podcast-sync.mjs --dry           # report only, no writes
//   node scripts/podcast-sync.mjs --scan          # write pending.json for the drafting agent, no site writes
//   node scripts/podcast-sync.mjs --drafts f.json # apply, using drafted voice copy + intents
//   node scripts/podcast-sync.mjs --preview       # force the newest feed item as "new" and print artifacts (no writes)
//   node scripts/podcast-sync.mjs --no-bake       # skip the intent-box.js bake step at the end
//   node scripts/podcast-sync.mjs --sync-chrome   # also re-run sync-chrome (only if you changed _partials)
//
// After applying, the tool bakes search rows into intent-box.js (when drafts
// carry intents). The generated page already embeds the current nav/foot, so
// sync-chrome is NOT run by default — pass --sync-chrome only if you've edited
// the partials (it rewrites every marker page and churns line-endings here).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const podcastDir = path.join(repoRoot, 'podcast');

const FEED_URL = 'https://anchor.fm/s/ab690c0c/podcast/rss';
const APPLE_ID = '1636574012';
const APPLE_LOOKUP = `https://itunes.apple.com/lookup?id=${APPLE_ID}&entity=podcastEpisode&limit=200`;
const SPOTIFY_SHOW = '1tr060dblBf7kUvIQ1Qanz';
const SITE = 'https://kh9010.github.io/joyus-website';

const TEMPLATE = path.join(__dirname, 'podcast-episode.template.html');
const STATE_FILE = path.join(podcastDir, '.sync-state.json');
const PENDING_FILE = path.join(__dirname, '.podcast-sync-pending.json');
const PODCAST_INDEX = path.join(repoRoot, 'podcast.html');
const SITEMAP = path.join(repoRoot, 'sitemap.xml');

// Valid backlog theme keys (must match the .bk-filter data-filter values in podcast.html).
const THEME_KEYS = new Set(['creativity', 'why', 'growth', 'together', 'ai']);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── args ──
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt  = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DRY = flag('--dry');
const SCAN = flag('--scan');
const PREVIEW = flag('--preview');
const NO_BAKE = flag('--no-bake');
const DRAFTS_PATH = opt('--drafts');

// ── tiny helpers ──
const escAttr = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const escHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

function decodeEntities(s) {
  return s.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&#x27;/gi,"'")
          .replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}

function slugify(title) {
  return decodeEntities(title)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'joyus-podcast-sync/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

// ── RSS parsing ──
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`));
  return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() : null;
}

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  return items.map(b => {
    const enc = b.match(/<enclosure[^>]*url="([^"]+)"/);
    return {
      guid: tag(b, 'guid'),
      title: decodeEntities(tag(b, 'title') || '').trim(),
      descHtml: tag(b, 'description') || '',
      link: tag(b, 'link') || '',
      pubDate: tag(b, 'pubDate') || '',
      duration: tag(b, 'itunes:duration') || '',
      season: tag(b, 'itunes:season'),
      episode: tag(b, 'itunes:episode'),
      mp3: enc ? enc[1] : '',
    };
  }).filter(it => it.guid);
}

function descToParagraphs(html) {
  const parts = html.split(/<\/p>/i).map(p =>
    decodeEntities(p.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
  ).filter(Boolean);
  return parts.length ? parts : [decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()].filter(Boolean);
}

function metaDescFrom(paras) {
  const joined = paras.join(' ');
  if (joined.length <= 157) return joined;
  const cut = joined.slice(0, 157);
  return cut.slice(0, cut.lastIndexOf(' ')).trim();
}

function fmtDate(pubDate) {
  const d = new Date(pubDate);
  if (isNaN(d)) return pubDate;
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}, ${d.getUTCFullYear()}`;
}
function fmtDateShort(pubDate) {
  const d = new Date(pubDate);
  if (isNaN(d)) return pubDate;
  return `${MON3[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function fmtDur(raw) {
  if (!raw) return '';
  let secs;
  if (/^\d+$/.test(raw)) secs = parseInt(raw, 10);
  else {
    const p = raw.split(':').map(Number);
    if (p.length === 3) secs = p[0] * 3600 + p[1] * 60 + p[2];
    else if (p.length === 2) secs = p[0] * 60 + p[1];
    else secs = parseInt(raw, 10) || 0;
  }
  return `${Math.max(1, Math.round(secs / 60))} min`;
}

function playerIframe(trackId) {
  if (trackId) {
    return `<iframe
      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
      height="175"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      src="https://embed.podcasts.apple.com/us/podcast/id${APPLE_ID}?i=${trackId}&amp;theme=auto"
      loading="lazy"
      title="Podcast player">
    </iframe>`;
  }
  // Fallback: Spotify show embed (always shows the latest episode).
  return `<iframe
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      height="175"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
      src="https://open.spotify.com/embed/show/${SPOTIFY_SHOW}?utm_source=generator&amp;theme=0"
      loading="lazy"
      title="Podcast player">
    </iframe>`;
}

function shortTitle(t, n = 42) {
  return t.length <= n ? t : t.slice(0, t.slice(0, n).lastIndexOf(' ')).trim() + '…';
}

// ── build one episode page from the template ──
function buildPage(tpl, ep, draft, newerEp) {
  const paras = (draft && draft.summary && draft.summary.length) ? draft.summary : descToParagraphs(ep.descHtml);
  const summaryHtml = paras.map(p => `<p>${escHtml(p)}</p>`).join('\n      ');
  const metaDesc = escAttr((draft && draft.metaDescription) || metaDescFrom(paras));
  const titleAttr = escAttr(ep.title);

  const tag = (draft && draft.tag) ? `<span class="ep-tags"><span class="ep-tag">${escHtml(draft.tag)}</span></span>` : '';
  const quotes = (draft && draft.quotes && draft.quotes.length)
    ? `<section class="ep-quotes">
    <span class="ep-quotes-label">notable moments</span>
    <div class="ep-quote-grid">
      ${draft.quotes.map(q => `<blockquote class="ep-quote"><p>${escHtml(q)}</p></blockquote>`).join('\n      ')}
    </div>
  </section>`
    : '';

  const transcriptText = `This episode's transcript hasn't been added yet — ${escHtml(paras[0] || ep.title)} Listen on Spotify or Apple Podcasts above; we'll drop the full transcript in here soon.`;
  const transcriptHtml = `<p>${transcriptText}</p>`;

  const newerNav = newerEp
    ? `<a class="next" href="${newerEp.slug}.html">
      <span class="label">Newer</span>
      ${escHtml(shortTitle(newerEp.title))} →
    </a>`
    : '';

  const eyebrowSe = ep.se ? `· ${ep.se}` : '';

  return tpl
    .split('{{DESC}}').join(metaDesc)
    .split('{{TITLE_PLAIN}}').join(titleAttr)        // used in title/og/h1 — attr-safe escaping is fine for text too
    .split('{{SLUG}}').join(ep.slug)
    .split('{{EYEBROW_SE}}').join(eyebrowSe)
    .split('{{DATE}}').join(escHtml(ep.dateLong))
    .split('{{DUR}}').join(escHtml(ep.dur))
    .split('{{TAGS}}').join(tag)
    .split('{{PLAYER_IFRAME}}').join(playerIframe(ep.trackId))
    .split('{{SPOTIFY_EP_URL}}').join(escAttr(ep.link))
    .split('{{SUMMARY_HTML}}').join(summaryHtml)
    .split('{{QUOTES_SECTION}}').join(quotes)
    .split('{{TRANSCRIPT_HTML}}').join(transcriptHtml)
    .split('{{NEWER_NAV}}').join(newerNav);
}

// ── podcast.html patches ──
function patchFeatured(html, ep, draft) {
  const m = html.match(/<section class="featured">[\s\S]*?<\/section>/);
  if (!m) throw new Error('featured section not found in podcast.html');
  let f = m[0];
  const featTitle = (draft && draft.featuredTitle) || ep.title;
  const guest = (draft && draft.featuredGuest) || '';
  const excerpt = (draft && draft.excerpt) || descToParagraphs(ep.descHtml)[0] || '';
  f = f.replace(/<div class="featured-ep-no">[\s\S]*?<\/div>/, `<div class="featured-ep-no">S${ep.season} · E${ep.episode}</div>`);
  f = f.replace(/<h2 class="featured-title">[\s\S]*?<\/h2>/, `<h2 class="featured-title">${escHtml(featTitle)}</h2>`);
  if (/<span class="featured-guest">[\s\S]*?<\/span>/.test(f)) {
    f = guest
      ? f.replace(/<span class="featured-guest">[\s\S]*?<\/span>/, `<span class="featured-guest">${escHtml(guest)}</span>`)
      : f.replace(/<span class="featured-guest">[\s\S]*?<\/span>\s*/, '');
  }
  f = f.replace(/<p class="featured-excerpt">[\s\S]*?<\/p>/, `<p class="featured-excerpt">\n      ${escHtml(excerpt)}\n    </p>`);
  f = f.replace(/(<a class="btn-secondary" href=")podcast\/[^"]+(">)/, `$1podcast/${ep.slug}.html$2`);
  return html.replace(m[0], f);
}

function patchBacklog(html, ep, draft) {
  const theme = (draft && THEME_KEYS.has(draft.theme)) ? draft.theme : '';
  const li = `      <li data-themes="${theme}"><a class="bk-item" href="podcast/${ep.slug}.html">
        <span class="bk-se">S${ep.season}E${ep.episode}</span>
        <span class="bk-title">${escHtml(ep.title)}</span>
        <span class="bk-date">${escHtml(ep.dateShort)}</span>
        <span class="bk-dur">${escHtml(ep.dur)}</span>
      </a></li>\n\n`;
  return html.replace(/(<ul class="bk-list">\s*\n)/, `$1\n${li}`);
}

function bumpCounts(html, by) {
  return html
    .replace(/(\d+) episodes · pick a thread/, (_, n) => `${parseInt(n, 10) + by} episodes · pick a thread`)
    .replace(/the full (\d+)-episode archive/, (_, n) => `the full ${parseInt(n, 10) + by}-episode archive`);
}

function addSitemap(xml, eps) {
  const blocks = eps.map(ep =>
    `  <url>\n    <loc>${SITE}/podcast/${ep.slug}.html</loc>\n    <priority>0.5</priority>\n  </url>\n`
  ).join('');
  return xml.replace(/<\/urlset>\s*$/, blocks + '</urlset>\n');
}

// Patch an existing episode page's nav-bar to point "Newer →" at a freshly added episode.
function addNewerLink(file, newerEp) {
  let h = fs.readFileSync(file, 'utf8');
  const link = `<a class="next" href="${newerEp.slug}.html">
      <span class="label">Newer</span>
      ${escHtml(shortTitle(newerEp.title))} →
    </a>`;
  if (/<a class="next"/.test(h)) {
    h = h.replace(/<a class="next"[\s\S]*?<\/a>/, link);
  } else {
    h = h.replace(/(<\/a>\s*)(<\/nav>)/, `$1  ${link}\n  $2`);
  }
  fs.writeFileSync(file, h);
}

function fileForSlug(slug) { return path.join(podcastDir, slug + '.html'); }

// ── meta sidecar (so the new episode shows up in site search) ──
function writeSidecar(ep, draft) {
  if (!draft || !Array.isArray(draft.intents) || draft.intents.length === 0) return false;
  const paras = (draft.summary && draft.summary.length) ? draft.summary : descToParagraphs(ep.descHtml);
  const transcriptText = `This episode's transcript hasn't been added yet — ${paras[0] || ep.title} Listen on Spotify or Apple Podcasts above; we'll drop the full transcript in here soon.`;
  const sidecar = {
    slug: ep.slug,
    url: `podcast/${ep.slug}.html`,
    title: ep.title,
    summary: draft.metaDescription || paras[0] || '',
    topics: draft.topics || [],
    people: draft.people || [],
    places: draft.places || [],
    intents: draft.intents.map(i => ({ display: i.display, terms: i.terms || [], dest: i.dest })),
    transcript_hash: hash(transcriptText),  // matches the placeholder; real transcript later will re-queue via extract
    generated_at: new Date().toISOString(),
    generator: 'podcast-sync.mjs',
  };
  fs.writeFileSync(path.join(podcastDir, ep.slug + '.meta.json'), JSON.stringify(sidecar, null, 2) + '\n');
  return true;
}

// ── main ──
(async () => {
  if (!fs.existsSync(TEMPLATE)) { console.error('✗ Missing template:', TEMPLATE); process.exit(2); }

  let feed;
  try { feed = parseFeed(await fetchText(FEED_URL)); }
  catch (e) { console.error('✗ Could not fetch/parse RSS:', e.message); process.exit(1); }
  if (!feed.length) { console.error('✗ Feed parsed to 0 items.'); process.exit(1); }

  // Feed is newest-first. Derive season/episode fallbacks from the current featured block.
  const indexHtml0 = fs.readFileSync(PODCAST_INDEX, 'utf8');
  const featNo = indexHtml0.match(/<div class="featured-ep-no">S(\d+)\s*·\s*E(\d+)<\/div>/);
  const curSeason = featNo ? parseInt(featNo[1], 10) : 7;
  const curEp = featNo ? parseInt(featNo[2], 10) : feed.length;
  const curFeatLink = (indexHtml0.match(/<a class="btn-secondary" href="podcast\/([^"]+)\.html">/) || [])[1];

  // State / baseline.
  let state = { seenGuids: [] };
  let baseline = false;
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { /* re-baseline */ }
  } else {
    baseline = true;
  }
  const seen = new Set(state.seenGuids || []);

  let newFeed;
  if (PREVIEW) {
    newFeed = [feed[0]];                       // pretend the newest is new
  } else if (baseline) {
    // First run ever: everything on the feed is already on the site → adopt as seen.
    if (!DRY && !SCAN) {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ seenGuids: feed.map(f => f.guid) }, null, 2) + '\n');
    }
    console.log(`✓ Baseline initialised — ${feed.length} existing episodes marked as seen. 0 new to scaffold.`);
    console.log('  (Re-run after a new episode publishes to scaffold it.)');
    return;
  } else {
    newFeed = feed.filter(f => !seen.has(f.guid));
  }

  if (newFeed.length === 0) {
    console.log(`✓ Up to date — no new episodes on the feed (site has ${feed.length}).`);
    return;
  }

  // Apple trackIds (best-effort) for the player embeds.
  let appleMap = new Map();
  try {
    const aj = JSON.parse(await fetchText(APPLE_LOOKUP));
    for (const r of aj.results || []) {
      if (r.wrapperType === 'podcastEpisode' && r.episodeGuid) appleMap.set(r.episodeGuid, r.trackId);
    }
  } catch (e) {
    console.warn('⚠ Apple lookup failed — falling back to Spotify show embed:', e.message);
  }

  // Order oldest→newest so "Newer" links chain forward in time.
  const ordered = [...newFeed].reverse();

  // Resolve per-episode derived fields.
  ordered.forEach((ep, i) => {
    ep.slug = slugify(ep.title);
    // collision guard
    if (fs.existsSync(fileForSlug(ep.slug)) && !PREVIEW) {
      let n = 2; while (fs.existsSync(fileForSlug(`${ep.slug}-${n}`))) n++;
      ep.slug = `${ep.slug}-${n}`;
    }
    ep.season = ep.season || String(curSeason);
    ep.episode = ep.episode || String(curEp + i + 1);
    ep.se = `S${ep.season}E${ep.episode}`;
    ep.dateLong = fmtDate(ep.pubDate);
    ep.dateShort = fmtDateShort(ep.pubDate);
    ep.dur = fmtDur(ep.duration);
    ep.trackId = appleMap.get(ep.guid) || null;
  });
  const newestEp = ordered[ordered.length - 1];

  // Drafts
  let drafts = {};
  if (DRAFTS_PATH) {
    try { drafts = JSON.parse(fs.readFileSync(DRAFTS_PATH, 'utf8')); }
    catch (e) { console.error('✗ Could not read drafts file:', e.message); process.exit(1); }
  }

  // ── SCAN: emit work file for the drafting agent, no site writes ──
  if (SCAN) {
    const pending = ordered.map(ep => ({
      guid: ep.guid, slug: ep.slug, title: ep.title, se: ep.se,
      date: ep.dateLong, duration: ep.dur, link: ep.link,
      description: descToParagraphs(ep.descHtml),
    }));
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2) + '\n');
    console.log(`✓ ${pending.length} new episode(s) → ${path.relative(repoRoot, PENDING_FILE)}`);
    pending.forEach(p => console.log(`   • ${p.se}  ${p.title}`));
    console.log('\nNext: draft voice copy with scripts/podcast-sync-draft-prompt.txt, then:');
    console.log('  node scripts/podcast-sync.mjs --drafts <drafts.json>');
    return;
  }

  console.log(`${DRY || PREVIEW ? '(no writes) ' : ''}${ordered.length} new episode(s):`);
  ordered.forEach(ep => console.log(`   • ${ep.se}  ${ep.title}  →  podcast/${ep.slug}.html  [${ep.trackId ? 'apple' : 'spotify-fallback'}, ${ep.dur || '?'}]`));

  const tpl = fs.readFileSync(TEMPLATE, 'utf8');

  // ── PREVIEW: print artifacts, no writes ──
  if (PREVIEW || DRY) {
    const ep = newestEp;
    const page = buildPage(tpl, ep, drafts[ep.guid], null);
    console.log('\n── episode page (first 60 lines) ──');
    console.log(page.split('\n').slice(0, 60).join('\n'));
    console.log('\n── backlog <li> ──');
    console.log(patchBacklog('<ul class="bk-list">\n', ep, drafts[ep.guid]).replace('<ul class="bk-list">\n', '').trim());
    console.log('\n── featured-ep-no / title ──');
    console.log(`S${ep.season} · E${ep.episode}  |  ${(drafts[ep.guid] && drafts[ep.guid].featuredTitle) || ep.title}`);
    console.log('\n(preview/dry — nothing written)');
    return;
  }

  // ── APPLY ──
  // 1. Generate episode pages; chain Newer links within the batch.
  ordered.forEach((ep, i) => {
    const newer = ordered[i + 1] || null;     // the next-newer episode in this batch
    fs.writeFileSync(fileForSlug(ep.slug), buildPage(tpl, ep, drafts[ep.guid], newer));
  });

  // 2. Point the previously-newest episode's nav-bar at the oldest new one.
  if (curFeatLink) {
    const prevFile = fileForSlug(curFeatLink);
    if (fs.existsSync(prevFile)) addNewerLink(prevFile, ordered[0]);
  }

  // 3. podcast.html: featured (→ newest), backlog (prepend oldest→newest so newest ends on top), counts.
  let idx = fs.readFileSync(PODCAST_INDEX, 'utf8');
  ordered.forEach(ep => { idx = patchBacklog(idx, ep, drafts[ep.guid]); });
  idx = patchFeatured(idx, newestEp, drafts[newestEp.guid]);
  idx = bumpCounts(idx, ordered.length);
  fs.writeFileSync(PODCAST_INDEX, idx);

  // 4. sitemap.
  fs.writeFileSync(SITEMAP, addSitemap(fs.readFileSync(SITEMAP, 'utf8'), ordered));

  // 5. search sidecars (only when drafts carry intents).
  let sidecars = 0;
  ordered.forEach(ep => { if (writeSidecar(ep, drafts[ep.guid])) sidecars++; });

  // 6. update state.
  const nextSeen = new Set(seen);
  ordered.forEach(ep => nextSeen.add(ep.guid));
  fs.writeFileSync(STATE_FILE, JSON.stringify({ seenGuids: [...nextSeen] }, null, 2) + '\n');

  console.log(`\n✓ Wrote ${ordered.length} page(s), updated podcast.html + sitemap.xml${sidecars ? `, ${sidecars} search sidecar(s)` : ''}.`);

  // 7. (opt-in) propagate nav/foot. The template already embeds the current
  //    nav/foot, so a new page is correct WITHOUT this. Only needed if you've
  //    recently edited _partials/nav.html or foot.html — and note sync-chrome
  //    rewrites every marker page, which churns line-endings on this repo.
  if (flag('--sync-chrome')) {
    try {
      execFileSync('node', [path.join(__dirname, 'sync-chrome.js')], { cwd: repoRoot, stdio: 'inherit' });
    } catch (e) { console.warn('⚠ sync-chrome.js failed — run it manually:', e.message); }
  }

  // Bake search rows into intent-box.js (single-file edit) when sidecars exist.
  if (!NO_BAKE && sidecars) {
    try {
      execFileSync('node', [path.join(__dirname, 'podcast-meta-bake.mjs')], { cwd: repoRoot, stdio: 'inherit' });
    } catch (e) { console.warn('⚠ podcast-meta-bake.mjs failed — run it manually:', e.message); }
  }

  console.log('\nDone. Review the diff and commit when you\'re ready (this tool never commits).');
  if (!sidecars) console.log('Tip: no search sidecars written (no drafted intents). Run with --drafts to add the episode to homepage search.');
})();
