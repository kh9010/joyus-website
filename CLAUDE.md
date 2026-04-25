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

## Agent team (joyus-*)

Project-local agent configs live in `.claude/agents/`:
- `joyus-pm.md` — owns backlog, writes acceptance criteria, gates handoffs (sonnet)
- `joyus-architect.md` — interaction + technical specs; sole Figma API consumer (sonnet)
- `joyus-dev.md` — implements against spec; up to 3 parallel (haiku for mechanical, sonnet for interaction-heavy)
- `joyus-tester-manual.md` — walks pages, breakpoints, a11y (haiku)
- `joyus-tester-auto.md` — lightweight static contract scripts (haiku)

The session uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (set in `.claude/settings.local.json`) so these agents can be launched by `subagent_type` directly. **Default to the lightest model that fits the task** — sonnet for synthesis/design/architecture, haiku for mechanical edits + test execution. Don't put everyone on opus.

When orchestrating, run agents in parallel only on non-conflicting files (each case study is independent; `styles.css` is the one shared file — devs should prefer page-local `<style>` blocks for new families to avoid concurrent-edit merges).

`git push origin main` is permitted by `.claude/settings.local.json` (no PR review). Each fix → its own commit + push so releases stay reviewable.

## R4 case-study rebuild — current state

The April 2026 R4 pass shipped 12 releases to main rebuilding the `work/*.html` case studies. Backlog + specs + test plans live in `.site-rebuild/` (gitignored — local only). If the dir is missing on a fresh clone, regenerate via the PM agent.

**As of 2026-04-25 (Kahran's verbal assessment after browser walkthrough):**

| Page | Status | Notes |
|---|---|---|
| klydo | ✅ good | r3 + R4-05 timing fix landed |
| pratham | ✅ good | R4-04 scroll-margin landed (UX architect proposed deeper fix, optional) |
| tatsam | ✅ good | R4-03 tightening + R4-09 disclosure accordion landed |
| xtdb | ✅ good | R4-08 alphabet folded into parallax |
| convegenius | ⚠️ okay | R4-07 hover/tap term tooltips landed (6 terms) |
| gliitch | ⚠️ okay | R4-11 sticky tab-nav landed (note filename has 2 i's) |
| **agemo** | ❌ still broken | R4-02 + R4-02-followup shipped (rail hit areas + visibility) but Kahran reports "play button still not loading." Root cause likely deeper than the rail-geometry fix — needs runtime debugging when browser access is available |
| **secret-senses** | ❌ still broken | R4-01 (double-rAF + ResizeObserver guard) shipped but section is "blank" in browser. Initial 404s on `cover.webp` + `slide90-illustrations-3.webp` were CDN-propagation cache (now 200) — but underlying rendering issue may still exist after hard-reload |
| **rachna-nivas** | ❌ "really weird, needs more ideas" | R4-10: 3 directions spec'd at `.site-rebuild/specs/r4-10-rachna-nivas.md`. **Blocks on Kahran's pick** — UX architect recommended Direction B but no shipping until confirmed |
| **tomboyx** | ❌ "weird" | R4-06 attribution-only partial shipped (`pitch-9.webp` figcaption). Slide-to-narrative mapping still wrong in 2 places: (a) Beat 03 Operator needs an `operator-issues.webp` exported from `Birthing tomboyx anew_ Apr _25.pptx` slide 15 (the four-problem issues+solutions slide), (b) Beat 01 Syndicate `story-5.webp` is the wrong slide (shows brand manifesto, not the queer-owned/women-founded "All up in our undies" opener) — needs replacement export from the syndicate deck |

**Lesson learned for the team:** the R4 dev agents' static-analysis "high confidence" fixes for the two P0 bugs (secret-senses, agemo) were insufficient — both still broken in browser. Static reading of HTML/JS/CSS can confirm a fix is structurally plausible but cannot confirm the timing/race/geometry actually resolves. **Don't trust "high confidence" from static reasoning on browser-runtime bugs.** Either get a browser involved, or have the test-lead spec a reproducible runtime contract before declaring a fix done.

**Open assets locally (parent of repo):**
- `../drive-download-20260424T131135Z-3-001/*.pptx` — 6 TomboyX source decks
- `../2024-02-23-Convegenius-Gamification System.docx` — convegenius gamification doc
- `Joyus - work deck-mar26.pdf` (in repo root, uncommitted) — Figma export, canonical narrative for tomboyx remap
- `../Joyus_ Investor Workshops II.pdf` — additional context

**Don't ship without browser-verified fix:** secret-senses + agemo. Investigate root cause via console output Kahran can paste, not via guesswork.

## Gotchas

- **Do not add GA tag `G-H63H3KD6WQ`** anywhere. That's Kahran's personal site. Joyus uses `G-K7PDLTYWF6`.
- **Do not remove `experimentalAutoDetectLongPolling`** from any Firestore init — CORS on GitHub Pages breaks without it.
- **Do not center-align editorial hero content** (hubs, services, `thinking/*`, blog posts) — they're left-aligned with a 640–680px column. Only grid/listing heroes (`work/`, `podcast.html`, `comics/`) are centered.
- **Do not reformat minified `thinking/*.html` files** — they're intentionally single-line with inline styles. Edit content without expanding the formatting.
- **Canonical URLs currently point to `kh9010.github.io`**. When migrating to `joyus.studio`, update every `<link rel="canonical">`, every `og:url`, every absolute URL in JSON-LD, and the `sitemap.xml` / `robots.txt`.
- **Shape classification is tuned for 3–4 shapes only**. Don't add more — freehand accuracy drops fast.
- **If you change shape routing**, update BOTH the `SHAPES` dict in `index.html` AND the shapeType-inference fallback in `shape-echo.js:340-347`.
- **If you add a new page**, copy the nav + footer blocks from an existing same-depth page (don't try to abstract them — there's no template system), and add an entry to `sitemap.xml` and (if relevant) to `CONTENT_MAP` in `home.html`.
