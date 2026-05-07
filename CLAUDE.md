# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Pure static site: hand-written HTML + one shared `styles.css` + vanilla JS. **No build step, no framework, no package.json, no bundler.** Deployed on GitHub Pages at `https://kh9010.github.io/joyus-website/`. Firebase is loaded via CDN script tags on the pages that need it; there is no JS toolchain.

The nav and footer are the **only** things that go through a sync step:
- Canonical source: `_partials/nav.html` and `_partials/foot.html`
- Pages mark insertion points with `<!--BEGIN:NAV-->...<!--END:NAV-->` and `<!--BEGIN:FOOT-->...<!--END:FOOT-->`
- Run `node scripts/sync-chrome.js` after editing either partial to propagate to all marker-bearing pages
- Pages without markers (legacy hubs, thinking essays, comics, about, ai-workshops, 404, services-old) carry the older `<nav class="nav-bar">` + 4-col `.footer` markup hand-copied — these are the "editorial wing" and are not yet on the partial system

## Local dev

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. The homepage (`index.html`) is the typewriter intent box — no splash gate. Load any page directly.

There is nothing to lint or test. Changes are verified by loading pages in a browser.

## Page inventory

Root-level pages:
- `index.html` — typewriter intent-box homepage (sparse stage, dots, animated tagline). The real entry point.
- `home.html` — 14-line `meta refresh` redirect to `index.html` (kept for any inbound `/home.html` links)
- `index-old.html`, `home-old.html` — archived predecessors. The shape-classification splash and the old `CONTENT_MAP` fuzzy-match intent box live here. Not linked from anywhere.
- `about.html`, `services.html`, `services-old.html`, `ai-workshops.html`, `podcast.html`, `404.html`
- 6 themed hubs: `hub-story.html`, `hub-building.html`, `hub-behavior.html`, `hub-play.html`, `hub-games.html`, `hub-creative.html`

Subdirectories:
- `work/` — `index.html` + 11 case studies (agemo, convegenius, gliitch, klydo, pratham, rachna-nivas, secret-senses, tatsam, tomboyx, xtdb)
- `podcast/` — ~80 individual episode pages (Spotify / Apple / iHeart embeds vary per episode)
- `thinking/` — 15 long-form essays drawn from podcast transcripts
- `comics/` — `index.html`, `the-friend-comic.html`, `gossip.html`

`sitemap.xml` currently lists ~124 URLs (60 podcast episodes, 15 thinking essays, 11 case studies, 6 hubs, plus core pages — not every podcast episode is in the sitemap; many are intentional dead drops). `robots.txt` allows everything.

## index.html — typewriter intent box

`index.html` is the homepage. Sparse stage with a centered text input, eyebrow line top-left, animated tagline bottom-right, and decorative dots. The user types an intent, presses Enter, and goes to a destination.

Key inline JS (~line 520+):
- A small typewriter animation rotates pre-set tagline phrases.
- Below the input, 5 hard-coded `<a class="sug">` suggestions (Work / Services / Podcast / Comics / Say hi).
- On submit, the input value is written to Firestore `intents` ({ text, timestamp, page }) and the user is routed to `services.html` by default, or to a destination matched by inline keyword logic.

There is **no fuzzy `CONTENT_MAP` matcher anymore** — that lived in `home-old.html` and was retired when the typewriter homepage shipped. If you want fuzzy matching back, it's a feature spec, not a regression.

There is **no draw-to-enter splash anymore** — the canvas-based shape classifier ($1 unistroke + centroid distance) lives in `index-old.html` and is not linked from anywhere. The Firestore `shapes` and `shape_visits` collections are dormant. See `shape-echo.js` note below.

## shape-echo.js (legacy — slated for removal)

`shape-echo.js` shipped on every non-splash page when the splash was live. It:
1. Read `joyus_shape` from sessionStorage (set by the splash).
2. If present, replayed the drawing as an SVG next to the nav logo.
3. Logged the visit to Firestore `shape_visits` and rendered an "others exploring" ticker.

With the splash retired, **nothing populates `joyus_shape`**, so the script always falls into the "no shape" branch and renders a small pencil button that links back to `index.html`. It still loads Firebase Compat (~230KB) on every page that includes it.

If you see `<script src="shape-echo.js">` (or `../shape-echo.js`) in a page, it can be removed alongside the page's Firebase compat `<script>` tags. The file itself can be deleted once no page references it.

## Page templates (three patterns)

1. **Homepage**: `index.html` — sparse 3-row grid stage (eyebrow / input / tagline) with decorative dots. Doesn't link `styles.css` (self-contained inline styles).
2. **Editorial / hub / service / blog post**: left-aligned gradient hero (warm-gray → white), 640–680px body column, `.inline-card` for linked content refs, `.pull-quote` for big quotes. Each hub defines `--hub-accent` via `:root` or `body { --hub-accent: ... }`:
   - `hub-story.html` = pink `#E91E7B`
   - `hub-building.html` = cyan `#4FC4CF`
   - `hub-behavior.html` = `#D4A843`
   - `hub-play.html` = `#5BBD72`
   - `hub-games.html` = `#8B5CF6` (purple)
   - `hub-creative.html` = `#E8734A`

   `thinking/*.html` posts follow the same editorial pattern but are **heavily minified to near-single-line HTML with inline styles**. That's intentional — don't reformat them on a whim, the author maintains them that way.
3. **Grid / listing**: `work/index.html`, `podcast.html`, `comics/index.html` — centered hero, card grids below. `services.html` uses a two-column `.capability` pattern with alternating image/text.

### Two nav/footer generations (in-progress unification)

There are currently two parallel chrome systems on the site:

- **Modern** (`<nav class="nav">` + `.foot`): synced from `_partials/nav.html` and `_partials/foot.html`. Used by `index.html`, `services.html`, `podcast.html`, all `work/*` pages, all `podcast/*` episode pages, and all concept/prototype pages. Space Grotesk, ink-soft text, thin one-line footer. To propagate changes: edit the partial, run `node scripts/sync-chrome.js`.
- **Legacy** (`<nav class="nav-bar">` + 4-column `.footer`): hand-copied to ~31 pages — all 6 hubs, all 15 `thinking/*` essays, `comics/*`, `about.html`, `ai-workshops.html`, `services-old.html`, `404.html`. DM Sans, dark text, richer footer with Themes column linking the hubs.

The legacy nav surfaces Comics + About + Themes; the modern nav drops all three. **This is the biggest open coherency issue.** Migration plan: bring legacy pages onto the partial system, with the modern partial extended to surface Comics. See "What I deliberately did NOT touch" in `.site-rebuild/audit-css-coherency.md` for the full path-A vs path-B vs path-C trade-off.

`styles.css` supports legacy selectors too (`.site-nav`, `.navbar`, `.nav-inner`, `.nav-links`, `.logo-link`), so older pages using those names still style correctly.

## Firebase

Project `joyus-studio`, loaded via CDN compat SDKs (`firebase-app-compat.js`, `firebase-firestore-compat.js` v10.12.0). Config is duplicated inline in `index.html` and `shape-echo.js` (the latter is dormant — see above). The `measurementId` is `G-K7PDLTYWF6`.

`experimentalAutoDetectLongPolling: true` is set on every Firestore instance — this works around CORS issues on GitHub Pages. Do not remove.

Collections:
- `intents` — `{ text, email?, timestamp, page }` — writes from the homepage typewriter intent input
- `shapes` — `{ path (JSON-stringified strokes), shapeType, confidence, page, timestamp }` — **dormant** (was the splash; only `index-old.html` writes to it)
- `shape_visits` — `{ shapeType, page, timestamp }` — **dormant** (was `shape-echo.js`)

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

**Always work on a feature branch. Never commit directly to main. Don't auto-merge — wait for explicit instruction to merge.** The pattern is: branch off latest `main` → edit → commit → push the branch. **Stop there.** Only merge into main when the user says "merge" / "ship" / similar. Auto-merging mid-task disrupts parallel sessions (Kahran often works in a second window simultaneously, e.g. on `thesis-workshop.html`).

Every change should pick or create a clearly-named branch (e.g. `designmay06-podcast-recent`, `kahran-comics-spec`) and stay on it. Verify with `git branch --show-current` before every commit. If the harness silently switches you to a different branch (it sometimes does), switch back before continuing.

When the user explicitly asks to merge: first stash any unrelated working-tree changes (the parallel window's edits land here), `git checkout main`, `git merge <branch> --no-ff`, push main, switch back to the working branch. Don't carry the parallel session's in-flight files through a merge.

## Klydo cuts — three-version case study

Klydo follows the same multi-cut pattern as Agemo (main + two cuts):

- `work/klydo.html` — **the main synthesis.** Editorial pattern, pink accent. High-level case study covering both arcs: the 120-day build (chapter 01) and the 8-months-in offsite/thesis chapter (chapter 02). Ends with a two-card decision block linking out to the design and strategy cuts. Pink "main" pill in the cuts-switch.
- `work/klydo-cut-design.html` — **the design cut.** The original 120-day cork-board timeline (30 artifacts, interactive scrubber, cyan/yellow accents on a pink-led brand). Pink "design" pill in the cuts-switch.
- `work/klydo-cut-strategy.html` — **the strategy cut.** Cyan accent. The leadership offsite — diagnostic, floor-and-spike frame, the "discovery + styling" sentence, 90-day plan, outcomes panel. Body anonymized (company referred to as *"a Series A fashion-commerce startup"*); URL slug retains "klydo." Cyan "strategy" pill in the cuts-switch. Linked from `thesis-workshop.html` as the primary case-study reference.

All three cuts are indexed (priority 0.7 in sitemap.xml). They share the agemo-style cross-link pattern: a fixed cuts-switch pill at top-right (becomes a bottom-centered floating bar on mobile) that highlights the current cut and links to the other two; plus a `kl-cuts-out` CTA pair before the closing section pointing back to the main + the sibling cut.

**Note for Divya's Claude (next session): all three klydo files are LIVE on staging. Before they're treated as final-final, please do a Figma sweep on each:**
- `klydo.html` — confirm hero / section imagery (currently text-only, may want a single big lifestyle render or launch screen at the hero); confirm the key-numbers panel (4 / 30 / 120 / 150) is the right snapshot or wants more recent numbers.
- `klydo-cut-design.html` — confirm lifestyle render thumbs (`slide75-product-*`, `slide76-hat-*`, `slide111-product-*`, `slide77-launch`) match current Brand v2 in Figma; confirm the 30-artifact list still maps to what we want to show; swap accents if the brand has shifted.
- `klydo-cut-strategy.html` — confirm anonymization is at the right level given Kahran's CRO status; concrete metrics in the closing ("3 Instagram experiments in 14 days", "selection meetings 45 → 20 min") should match real numbers if you have them.

Each file has its own HTML comment block at the top with the same brief.

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
- **After editing `_partials/nav.html` or `_partials/foot.html`, run `node scripts/sync-chrome.js`** to propagate to all marker-bearing pages. The partials use `{{P}}` as the relative-path-to-root token; the script substitutes it per page based on directory depth.
- **If you add a new page on the modern chrome system**, include `<!--BEGIN:NAV--><!--END:NAV-->` and `<!--BEGIN:FOOT--><!--END:FOOT-->` markers and run `sync-chrome.js`. If you add a legacy "editorial wing" page (hub, thinking essay, comic), copy the nav + footer markup verbatim from a sibling and update relative paths.
- **Add new sitemap entries** to `sitemap.xml` for any new public page.
- **Splash/shape classifier is archived** at `index-old.html`. Don't link it without restoring the full flow (see "shape-echo.js" section).
