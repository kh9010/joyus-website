# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Pure static site: hand-written HTML + one shared `styles.css` + vanilla JS. **No build step, no framework, no package.json, no bundler.** Every page links `styles.css` and (except `index.html`) `shape-echo.js`. Deployed on GitHub Pages at `https://kh9010.github.io/joyus-website/`. Firebase is loaded via CDN script tags on the pages that need it; there is no JS toolchain.

## Local dev

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. Because the site gates everything behind a splash drawing (see below), test flows by either:
1. Visiting `/` first and drawing a shape, or
2. Opening DevTools → Application → Session Storage, setting `joyus_entered=1`, and loading any page directly.

There is nothing to lint or test. Changes are verified by loading pages in a browser.

## Page inventory

Root-level pages:
- `index.html` — splash (draw-to-enter)
- `home.html` — intent-box landing
- `about.html`, `services.html`, `ai-workshops.html`, `podcast.html`, `404.html`
- 6 themed hubs: `hub-story.html`, `hub-building.html`, `hub-behavior.html`, `hub-play.html`, `hub-games.html`, `hub-creative.html`

Subdirectories:
- `work/` — `index.html` + 11 case studies (agemo, convegenius, gliitch, klydo, pratham, rachna-nivas, secret-senses, tatsam, tomboyx, xtdb)
- `podcast/` — ~80 individual episode pages (Spotify / Apple / iHeart embeds vary per episode)
- `thinking/` — 15 long-form essays drawn from podcast transcripts
- `comics/` — `index.html`, `the-friend-comic.html`, `gossip.html`

`sitemap.xml` currently lists ~55 URLs (not every podcast episode is in the sitemap — many are intentional dead drops). `robots.txt` allows everything.

## Splash → site flow (index.html)

`index.html` is a canvas the user draws on. It does real shape classification, not just stroke counting:

1. User drags → strokes accumulate in `allStrokes`.
2. On stroke end, `findEnclosedRegion()` does a low-res flood fill to detect a closed region.
3. If closed, `classifyShape()` runs **two classifiers**:
   - **Primary: $1 Unistroke Recognizer** (resample to 64 points, rotate to indicative angle, scale, compare against pre-built templates for circle/triangle/rectangle).
   - **Secondary: centroid distance profile** (resample, compute radius profile, count peaks, use CV + peak count).
   - Geometric overrides: **isoperimetric quotient** bumps high-circularity shapes to `circle`, **aspect ratio** bumps square-ish rectangles to `square`.
   - **Multi-stroke override:** 3 long strokes → triangle, 4 → rectangle (beats both classifiers).
4. Shape → destination via the `SHAPES` map at `index.html:567-572`:
   - `circle` → `about.html`
   - `triangle` → `hub-games.html`
   - `square` → `comics/index.html`
   - `rectangle` → `home.html` (default fallback)

   **If you change routing, edit `SHAPES` in `index.html` and the `shapeType` inference in `shape-echo.js:340-347`.**

5. On click inside the enclosed region, `enterSite()`:
   - Sets `sessionStorage.joyus_entered = '1'`
   - Saves `joyus_shape` (normalized strokes + shape type + hint URL) to sessionStorage
   - Writes a doc to Firestore `shapes` (simplified, first 3 strokes, sampled)
   - Redirects to target page

## shape-echo.js (on every non-splash page)

Lives at project root; included via `<script src="shape-echo.js">` (or `../shape-echo.js` from `work/`, `comics/`, `podcast/`, `thinking/`). It:

1. Reads `joyus_shape` from sessionStorage.
2. If present → builds a small SVG replay of the drawing, inserts it next to the `.logo` in the nav. Click returns to `/index.html` (clearing session).
3. If absent → inserts a subtle pencil icon that also returns to splash.
4. Logs the visit to Firestore `shape_visits` ({ shapeType, page, timestamp }).
5. Queries `shape_visits` for other visitors with the same `shapeType` and renders a rotating "other circles exploring → [page]" ticker in the nav (desktop) + a banner below the nav (mobile).

**If a page is missing this behavior, check:** it has a `.logo`, `.nav-logo`, or `.logo-link` element (the script anchors off that), and the `<script src>` path matches its directory depth.

## home.html intent box

The pink-underlined input on `home.html` is the other big interactive surface. Logic lives inline in `home.html` around lines 520-920:

- **`CONTENT_MAP`** (~120 entries): array of `{ display, terms, url, dest }`. Each entry maps fuzzy search terms to a destination (case study, service, podcast, comic, hub, blog post, or `mailto:`). If you add new content, add it here too or it won't surface in suggestions.
- **`fuzzyMatch()`**: substring scoring against `terms`, `display`, and per-word hits. Threshold score ≥ 2 to surface.
- **Past intents**: reads last 50 docs from Firestore `intents`, deduped, and mixes into suggestions as "others asked:" rows.
- **Submit flow**: clicking a suggestion navigates immediately; pressing Enter on a custom intent opens an interstitial with an optional email capture and a `routeForIntent()`-chosen destination (default: `services.html`). Both paths write to Firestore `intents`.

## Page templates (three patterns)

1. **Splash**: `index.html` only — its own standalone canvas page. Doesn't link `styles.css`.
2. **Editorial / hub / service / blog post**: left-aligned gradient hero (warm-gray → white), 640–680px body column, `.inline-card` for linked content refs, `.pull-quote` for big quotes. Each hub defines `--hub-accent` via `:root` or `body { --hub-accent: ... }`:
   - `hub-story.html` = pink `#E91E7B`
   - `hub-building.html` = cyan `#4FC4CF`
   - `hub-behavior.html` = `#D4A843`
   - `hub-play.html` = `#5BBD72`
   - `hub-games.html` (accent varies — check the file)
   - `hub-creative.html` = `#E8734A`

   `thinking/*.html` posts follow the same editorial pattern but are **heavily minified to near-single-line HTML with inline styles**. That's intentional — don't reformat them on a whim, the author maintains them that way.
3. **Grid / listing**: `work/index.html`, `podcast.html`, `comics/index.html` — centered hero, card grids below. `services.html` uses a two-column `.capability` pattern with alternating image/text.

All non-splash pages share the same nav bar (`.nav-bar > .nav-container > .logo + .hamburger + .nav-menu`) and footer (`.footer-brand`, `.footer-nav`, `.footer-themes`, `.footer-contact`). These are hand-copied to every file, not templated — if you add a page, copy both blocks verbatim and update relative paths for subdirectories.

`styles.css` supports legacy selectors too (`.site-nav`, `.navbar`, `.nav-inner`, `.nav-links`, `.logo-link`), so older pages using those names still style correctly.

## Firebase

Project `joyus-studio`, loaded via CDN compat SDKs (`firebase-app-compat.js`, `firebase-firestore-compat.js` v10.12.0). Config is duplicated inline in `index.html`, `home.html`, and `shape-echo.js` — keep them in sync. The `measurementId` is `G-K7PDLTYWF6`.

`experimentalAutoDetectLongPolling: true` is set on every Firestore instance — this works around CORS issues on GitHub Pages. Do not remove.

Collections:
- `intents` — `{ text, email, timestamp, page }` — writes from the home-page intent box
- `shapes` — `{ path (JSON-stringified strokes), shapeType, confidence, page, timestamp }` — writes from the splash
- `shape_visits` — `{ shapeType, page, timestamp }` — writes from `shape-echo.js` on every page load

All Firestore writes are best-effort (try/catch, silent on failure). The UI never blocks on the network.

## Design system

- **Fonts**: DM Serif Display (headings), DM Sans (body), Caveat (script/accents)
- **Colors** (`styles.css` `:root`): `--pink #E91E7B`, `--cyan #4FC4CF`, `--warm-gray #F5F3F0`, `--black #111214`
- **Hero accent pattern**: gradient from `--warm-gray` to white, 8rem top padding (fits under the fixed nav)
- **Body column**: 640–680px max-width for editorial content, 960–1200px for grids

## Positioning

"We think with everyone. We build with a few." Advisory is the front door; operational/production work is the premium tier. Homepage tag line is "Advisory & Design Studio." Keep copy aligned with this — services page leads with advisory, operational/build work is positioned as selective. See `notion-pass1-storytelling.md` for the full framing.

## Content ownership

- **Kahran Singh** and **Divya Tak** are the founders (spelling matters — no middle initials, no alternates).
- **Comics**: Kahran writes storylines + pencil sketches, Divya illustrates. The zine is all Divya.
- **Podcast transcripts**: auto-generated from speech and intentionally conversational. **Do not "fix" grammar or punctuation in `podcast/*.html` transcript blocks.**
- **Blog posts in `thinking/`**: drawn from podcast transcripts. Real words from Kahran and Divya — preserve voice over polish.

## Claude Code setup

- `.claude/skills/proposal-builder/SKILL.md` — project-local skill for building client proposals. Auto-triggers on proposal / SOW / scope-of-work requests.
- `.claude/scheduled_tasks.lock` — runtime artifact, ignore.
- `notion-pass1-storytelling.md` + `notion-site-review.csv` — in-progress editorial review tracking (Week 1 of April 2026). Read these if the user asks about the "site review" or "pass 1/2/3" — they encode the current content-review workflow.

## Pre-deploy QA (run before the last commit of the day)

Spin up 6 agents in parallel for a final pass. Each should fix issues directly, not just report.

1. **UX** — dead ends, missing CTAs, hover states, mobile breakpoints, nav consistency, a11y (aria-labels, skip-to-content link, focus-visible outlines).
2. **Grammar** — typos, double hyphens → em dashes, Oxford commas, name spellings (Kahran Singh, Divya Tak). **Skip `podcast/*.html` transcript blocks.**
3. **Product marketing** — value prop clarity, trust signals, CTAs on every page, hub→service bridges, advisory-first positioning.
4. **SEO** — title + meta description (150–160 chars) + og tags + canonical + twitter:card on every page. JSON-LD: `CollectionPage` on hubs, `Article` on `thinking/*`, `CreativeWork` on `work/*`, `Service` on `services.html` / `ai-workshops.html`, `PodcastSeries` on `podcast.html`. One `<h1>` per page. Sitemap covers all public pages.
5. **QA (programmatic)** — every internal link resolves, every non-splash page includes `shape-echo.js` with correct relative path, nav + footer + footer-themes + footer-contact blocks are present and consistent, no stray `console.log`.
6. **Analytics** — Firebase config identical in `index.html`, `home.html`, `shape-echo.js`. Measurement ID is `G-K7PDLTYWF6` only. Firestore collection names are `intents`, `shapes`, `shape_visits`.

## Gotchas

- **Do not add GA tag `G-H63H3KD6WQ`** anywhere. That's Kahran's personal site. Joyus uses `G-K7PDLTYWF6`.
- **Do not remove `experimentalAutoDetectLongPolling`** from any Firestore init — CORS on GitHub Pages breaks without it.
- **Do not center-align editorial hero content** (hubs, services, `thinking/*`, blog posts) — they're left-aligned with a 640–680px column. Only grid/listing heroes (`work/`, `podcast.html`, `comics/`) are centered.
- **Do not reformat minified `thinking/*.html` files** — they're intentionally single-line with inline styles. Edit content without expanding the formatting.
- **Canonical URLs currently point to `kh9010.github.io`**. When migrating to `joyus.studio`, update every `<link rel="canonical">`, every `og:url`, every absolute URL in JSON-LD, and the `sitemap.xml` / `robots.txt`.
- **Shape classification is tuned for 3–4 shapes only**. Don't add more — freehand accuracy drops fast.
- **If you change shape routing**, update BOTH the `SHAPES` dict in `index.html` AND the shapeType-inference fallback in `shape-echo.js:340-347`.
- **If you add a new page**, copy the nav + footer blocks from an existing same-depth page (don't try to abstract them — there's no template system), and add an entry to `sitemap.xml` and (if relevant) to `CONTENT_MAP` in `home.html`.
