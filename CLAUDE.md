# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Pure static site: hand-written HTML + one shared `styles.css` + vanilla JS. **No build step, no framework, no package.json, no bundler.** Deployed on GitHub Pages at `https://kh9010.github.io/joyus-website/`. Firebase is loaded via CDN script tags on the pages that need it; there is no JS toolchain.

The nav and footer are the **only** things that go through a sync step:
- Canonical source: `_partials/nav.html` and `_partials/foot.html`
- Pages mark insertion points with `<!--BEGIN:NAV-->...<!--END:NAV-->` and `<!--BEGIN:FOOT-->...<!--END:FOOT-->`
- Run `node scripts/sync-chrome.js` after editing either partial to propagate to all marker-bearing pages
- **~156 pages now carry the markers** (verified 2026-07-06), including the whole former "editorial wing" — all 6 hubs, all 15 thinking essays, all comics, `about.html`, `ai-workshops.html`, `404.html` — whose chrome byte-matches the current partials (0 drift). The ONLY pages still on the old hand-copied `<nav class="nav-bar">` + 4-col `.footer` markup are the archived predecessors `home-old.html`, `podcast-old.html`, `services-old.html`, `work/index-old.html`, and `thesis-workshop.html` (an orphan that should be migrated to markers). A page's WIP-banner / unstyled-*body* status is a separate axis from its chrome — a page can carry modern marker chrome while its body is still WIP.

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
- `comics/` — `index.html` + 5 comics: `the-friend-comic.html`, `gossip.html`, `plant-comic.html`, `phone-comic.html`, `serious-zine.html` (migrated to the new design system 2026-05-29; the comic pages source from the joyus.studio Creations PDFs, rendered to `images/comics/<slug>/page-N.{png,jpg}`). The reader (scroll-snap, lightbox, page indicator, print-interest form) is shared across all five.

`sitemap.xml` currently lists **99 URLs** (verified 2026-07-06). The 2026-05-29/06-01 launch trim deliberately dropped the 15 thinking essays, the 6 hubs, and all case studies except **agemo + rachna-nivas** (the two "live" ones) — the other 9 case studies show as coming-soon cards on `work/index.html` and are NOT in the sitemap. Not every podcast episode is listed either; many are intentional dead drops. **Note (audit 2026-07-06):** the de-listed case studies + essays are still fully indexable (no `noindex`) — a limbo state pending a decision (see WEBSITE-DIRECTION.md pending questions). `robots.txt` allows everything.

## index.html — typewriter intent box

`index.html` is the homepage. Sparse stage with a centered text input, eyebrow line top-left, animated tagline bottom-right, and decorative dots. The user types an intent, presses Enter, and goes to a destination.

**The intent-box logic lives in `intent-box.js` (shared by `index.html` and `looking.html`), not inline.** Each page loads the Firebase compat SDKs, then `intent-box.js`, then calls `initIntentBox({ page, prompts?, placeholder? })`. The homepage passes the typewriter `prompts`; `looking.html` passes a static `placeholder`. `intent-box.js` owns `CONTENT_MAP`, the scorer, the looser near-miss pass, Firebase intent logging, and the Enter-to-route behavior.

- A small typewriter animation rotates pre-set placeholder prompts (homepage only — pass `opts.prompts`).
- A `CONTENT_MAP` of ~150 intent entries + a `scoreEntries()` scorer drives live autocomplete in `#intentSuggestions` as the user types. On focus with empty input, a curated default of 5 suggestions shows. No matches → falls back to the say-hi entry.
- Scoring: substring-in-query → +3 per term; word-in-single-word-term → +1 (multi-word terms are deliberately skipped to avoid `"work"` matching `"ai workshop"`); query-in-display → +2; word-in-display → +0.5. Min word length 3 chars (so `"in"` doesn't substring-match `"uncertainty"`). The autocomplete dropdown surfaces everything scoring ≥2.
- **Enter-to-route confidence bar (`CONFIDENT_MATCH = 4`):** a query scoring ≥4 deep-links straight to its top hit. Anything weaker routes to `looking.html?q=…&n=…`, handing over near-miss cards (the strict ≥2 cluster, topped up by a looser IDF-weighted token pass — see below). This is why most strong queries deep-link but vague ones land on the near-miss page instead of force-routing to one shaky match. (Changing the bar changes how aggressively the near-miss page fires.)
- The podcast portion of `CONTENT_MAP` is generated, not hand-edited. See `## Podcast metadata workflow` below.

### looking.html — near-miss / "things you might be into" page

The failed-search landing. Trimmed to: the headline "We don't have a page like that yet", an autocomplete search box (same `intent-box.js`, so visitors can try another intent right there), and — when the homepage handed over near-misses via `?n=` (a JSON array of `{d:display, u:url, t:dest}`) — a soft list of cards under "Here's a few things we've made that might be close to what you're pulling on." No near-misses → just the headline + search box. The near-miss source is the strict ≥2 cluster, topped up by `looseEntries()` (a lenient token-overlap pass weighted by IDF so rare words like "fashion"/"tax" carry signal and common ones like "brand"/"team" don't); truly-unrelated queries surface nothing, by design.

There is **no draw-to-enter splash anymore** — the canvas-based shape classifier ($1 unistroke + centroid distance) lives in `index-old.html` and is not linked from anywhere. The Firestore `shapes` and `shape_visits` collections are dormant. See `shape-echo.js` note below.

## Podcast metadata workflow

Every podcast episode has a structured sidecar JSON at `podcast/<slug>.meta.json` capturing the episode's `summary`, `topics`, `people`, `places`, and `intents` (the search rows the homepage autocomplete consumes). Sidecars are generated by reading the full transcript (not just the meta description) — so secondary topics like "parenting" inside an episode billed as "burnout" still surface.

**Pipeline (3 scripts + 1 prompt):**
- `scripts/podcast-meta-extract.mjs` — walks `podcast/*.html`, hashes each transcript, writes "needs-meta" chunk files to `/tmp/podcast-meta-chunk-N.json`. Skips episodes whose sidecar already matches the current hash, so re-runs are cheap.
- `scripts/podcast-meta-prompt.txt` — the agent prompt template + schema. Reusable.
- `scripts/podcast-meta-bake.mjs` — reads all sidecars, flattens `intents` arrays into `CONTENT_MAP` rows, splices into `intent-box.js` between the `podcast.html` umbrella entry and the `// Comics` anchor. Idempotent. Has `--dry` and `--check` modes. (Target moved from `index.html` to `intent-box.js` when the intent box was extracted into a shared file.)
- `scripts/README-podcast-meta.md` — full workflow doc + recipes.

**New episode? Run:**
1. Drop the episode HTML into `podcast/`
2. `node scripts/podcast-meta-extract.mjs` — queues the new episode (or any whose transcript changed)
3. Dispatch one Claude Code agent per chunk file using the prompt at `scripts/podcast-meta-prompt.txt`
4. `node scripts/podcast-meta-bake.mjs` — splices into `index.html`

**Hand-editing:** sidecars are committed JSON files — edit freely. The bake step picks up your changes on next run.

**Missing transcript?** Some old template-preview episodes shipped without real transcripts. The fix: download the m4a from the Anchor cloudfront URL (find it via `https://itunes.apple.com/lookup?id=1636574012&entity=podcast` → `feedUrl` → grep the RSS for the episode), `ffmpeg -ar 16000 -ac 1` to wav, then `whisper-cli -m ~/.whisper-models/ggml-base.en.bin`. Inject the resulting paragraphs into the episode HTML's `<div class="ep-transcript-content">` block. The extract script detects the hash change and requeues automatically.

## shape-echo.js (legacy — slated for removal)

`shape-echo.js` shipped on every non-splash page when the splash was live. It:
1. Read `joyus_shape` from sessionStorage (set by the splash).
2. If present, replayed the drawing as an SVG next to the nav logo.
3. Logged the visit to Firestore `shape_visits` and rendered an "others exploring" ticker.

With the splash retired, **nothing populates `joyus_shape`**, so the script always falls into the "no shape" branch and renders a small pencil button that links back to `index.html`. It still loads Firebase Compat (~230KB) on every page that includes it.

If you see `<script src="shape-echo.js">` (or `../shape-echo.js`) in a page, it can be removed alongside the page's Firebase compat `<script>` tags. The file itself can be deleted once no page references it.

## Page templates (two patterns + WIP)

1. **Homepage**: `index.html` — sparse 3-row grid stage (eyebrow / input / tagline) with decorative dots. Self-contained inline styles.
2. **Modern editorial / grid / listing**: hero + body content + closing/foot. Links `styles.css` for tokens + primitives + body baseline; the page's own inline `<style>` carries the page-specific composition. Used by `services.html`, `podcast.html`, all `work/*`, all `podcast/*`. Set `<body data-accent="pink|cyan">`.
3. **WIP (unmigrated)**: 6 hubs, 15 `thinking/*` essays, `about.html`, `ai-workshops.html`, `services-old.html`, `404.html`. These wear the yellow `<div class="wip-banner">` sticker at the top. (`comics/*` was migrated to the new system on 2026-05-29 — Space Grotesk, tokens, no WIP banner — so it's no longer in this list.) They link `styles.css` but their old class names (`.nav-bar`, `.footer` 4-col, `.hub-eyebrow`, etc.) no longer have rules there, so they render mostly unstyled until rebuilt. Migrate one at a time. `thinking/*.html` posts are heavily minified to near-single-line HTML — don't reformat them on a whim, the author maintains them that way; rebuild as a deliberate restructure.

### Two nav/footer generations (HTML-level — visual is unified by `styles.css`)

At the HTML level, two nav/footer shapes still coexist; the **visual** system is unified by `styles.css`.

- **Modern partial** (`<nav class="nav">` + `.foot`): synced from `_partials/nav.html` and `_partials/foot.html`. Used by `index.html`, `services.html`, `podcast.html`, all `work/*`, all `podcast/*`, plus concept/prototype pages. To propagate partial changes: edit the partial, run `node scripts/sync-chrome.js`.
- **Legacy hand-copied** (`<nav class="nav-bar">` + 4-column `<footer class="footer">`): now only on 5 pages — `home-old.html`, `podcast-old.html`, `services-old.html`, `work/index-old.html` (all archived predecessors), and `thesis-workshop.html`. These markup shapes no longer have CSS in `styles.css`, so they render as plain lists. (Corrected 2026-07-06: the hubs/thinking/comics/about/ai-workshops/404 pages were migrated to markers — they are NOT on legacy chrome anymore, even where their bodies are still WIP.)

When a WIP page gets rebuilt, its nav and footer markup should be replaced with the partial markers (`<!--BEGIN:NAV--><!--END:NAV-->`, `<!--BEGIN:FOOT--><!--END:FOOT-->`); then re-run `sync-chrome.js` to inject the modern chrome.

## /site-read/ — the site-read tool (soft launch)

A self-serve diagnostic: a practitioner drops a URL and gets a read of what a
stranger meets on their site. Page at `site-read/`, backend at
`site-read-worker/` (excluded from the Pages build by `_config.yml` — see that
file and `site-read-worker/README.md`; do not publish the analysis prompt).

- **The reader is off until the Worker is deployed.** `site-read/site-read.js`
  has `API_BASE = null`; while it is null a typed URL gets an honest "the reader
  isn't switched on yet" state. It must never render fixture content for a real
  URL — the sample read is reachable only through an explicit `?demo=` param.
- **Demo states**: `?demo=1` (the sample read), `?demo=analyzing`,
  `?demo=decline_product_company|decline_thin|decline_unfetchable|decline_incomplete`,
  `?demo=offline`. Any `demo` param also reveals the preview pills.
- **`decline_incomplete` is pipeline-only** — the Worker's fail-safe status, not
  in the model's schema. The page branches on it as a warm decline. Any front end
  reading `read.status` needs that branch.
- **`site-read/fixture-data.js` is GENERATED** from `site-read/fixture.json` by
  `node scripts/gen-site-read-fixture.mjs` (`--check` fails if stale). The
  fixture is a fictional practice at an unregistered domain, on purpose: never
  ship a sample read of a real person's site.
- **The sample read is written in two passes, like production.**
  `site-read/fixture-outline.json` is pass 1; `fixture.json` is the prose
  written from it. The generator runs the shipped containment check of the read
  against that outline, so a sample that grows a proper noun, a number, a second
  bold line or a sentence after the bridge fails the build.
- **The read ends on its bridge and has no `one_cut`** (removed in v5.2 — a
  synthesis slot is a recap by construction). The visual arrival is the one
  sentence the render plan marks bold: `.rd-arrival`, centred between hairlines,
  typed. Any front end reading a read needs that branch, not a cut branch.
- Deliberately **not in the nav** yet. It is in `sitemap.xml` and the intent-box
  `CONTENT_MAP`; add the nav link when the Worker is live.

## Firebase

Project `joyus-studio`, loaded via CDN compat SDKs (`firebase-app-compat.js`, `firebase-firestore-compat.js` v10.12.0). Config is duplicated inline in `index.html` and `shape-echo.js` (the latter is dormant — see above). The Firebase config carries a `measurementId` of `G-K7PDLTYWF6`, but this is **inert** — the Firebase **Analytics** SDK is never loaded, so it sends nothing. It's a *separate* GA property Firebase auto-created; do NOT use it for site analytics. See the GA note under Gotchas.

`experimentalAutoDetectLongPolling: true` is set on every Firestore instance — this works around CORS issues on GitHub Pages. Do not remove.

Collections:
- `intents` — `{ text, email?, timestamp, page }` — writes from the homepage typewriter intent input
- `shapes` — `{ path (JSON-stringified strokes), shapeType, confidence, page, timestamp }` — **dormant** (was the splash; only `index-old.html` writes to it)
- `shape_visits` — `{ shapeType, page, timestamp }` — **dormant** (was `shape-echo.js`)

All Firestore writes are best-effort (try/catch, silent on failure). The UI never blocks on the network.

## Design system

**`styles.css` is the canonical source of truth — one system, every page links it.** The old DM Serif / DM Sans / warm-gray editorial-wing system was retired on 2026-05-20; the legacy class definitions that used to live in `styles.css` were removed in the same pass. Pages that haven't been redesigned against the new system **wear a yellow `<div class="wip-banner">` sticker** immediately after `<body>` so the breakage reads as intentional — they look mostly unstyled (browser defaults + the new body font) until rebuilt. Migrate WIP pages one at a time. See `DESIGN-LANGUAGE.md` (repo root) for the full 2026-05-20 audit.

### Tokens (in `styles.css :root`)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FAF7F2` | Paper / page |
| `--ink` | `#2C3544` | Headlines, body |
| `--ink-soft` | `#54606F` | Secondary text |
| `--ink-fade` | `#8892A0` | Tertiary / meta |
| `--rule` | `rgba(44, 53, 68, 0.12)` | Hairlines |
| `--pink` | `#E91E7B` | Primary accent |
| `--cyan` | `#4FC4CF` | Secondary accent |
| `--yellow` | `#F2C94A` | Tertiary accent (first-class) |
| `--sans` | `'Space Grotesk'` | Everything |
| `--hand` | `'Caveat'` | Asides, hand-notes |
| `--x` | `clamp(1.5rem, 4vw, 3rem)` | Side-padding |

No serif. Display sizes are large (4–10rem) with tight letter-spacing (~-0.04em).

### Per-page accent (set on `<body data-accent="…">`)

| Page / family | Accent |
|---|---|
| `index.html` (home) | `pink` |
| `services.html` | `pink` |
| `work/index.html`, all `work/*.html` | `pink` |
| `podcast.html`, all `podcast/*.html` | `cyan` |
| Reserved campaigns | `yellow` |

The variation across pages is intentional — keep it static per page (don't randomize), and don't mix accents within one page. `--accent` resolves to the page's accent via the `body[data-accent]` rule in `styles.css`.

### Primitives (all prefixed `.j-` to avoid colliding with existing inline `.hero` / `.card` / `.eyebrow` on modern pages)

| Class | Purpose |
|---|---|
| `.j-hero` + `.j-hero__inner` / `__title` / `__kicker` | Unified hero for non-home pages |
| `.j-eyebrow` | Section label with leading accent dot |
| `.j-kicker` | Caveat hand-note |
| `.j-pill` (+ `--solid`, `--active`) | Round-corner inline button/link |
| `.j-card` (+ `--photo`, `--solid`, `--quote`, `--stat`) | Card primitive family |
| `.j-dots` (+ `.j-dot--pink` / `--cyan` / `--yellow` / `--ink` / `--ring`) | Decorative ornament |
| `.j-progress-thread` | Fixed gradient scroll indicator |
| `.j-closing` (+ `__inner` / `__cta` / `__hint`) | End-of-page block, flows into `.foot` |
| `.foot` | Footer (shared with `_partials/foot.html`) |
| `.wip-banner` (+ `.wip-banner__note`) | The redesign sticker |

When you reach for a card / pill / hero treatment that doesn't fit an existing variant, **add a variant to `styles.css`** rather than inventing inline — that's how design debt builds up. Update this table when you add new primitives.

### Closing + footer = one design moment

`.j-closing` and `.foot` are designed as a single end-of-page moment: same paper bg, the seam is invisible (the `.j-closing + .foot` rule kills the footer's top border and tightens the gap). When editing one, edit the other.

### WIP banner

```html
<div class="wip-banner">WIP — to be redesigned <span class="wip-banner__note">we'll rework this page in the new system soon</span></div>
```

Drop it immediately after `<body>` on any unmigrated page. Remove it once the page has been rebuilt with the new primitives.

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

`git push origin main` is permitted by `.claude/settings.local.json` (no PR review), but only after merging from a feature branch — see Branch discipline below.

## Branch discipline

**Always work on a personal/task-named branch. Never commit directly to main. Never commit on Divya's branches. Don't auto-merge — wait for explicit instruction.**

**Branches named `designmay05`, `designmay06`, `designmayNN` etc. are Divya's** — date-named feature branches she uses for her own iteration. Do NOT commit on them, even if they appear to be "the active feature branch" with recent activity. Mixing Claude/Kahran-session commits with Divya's commits on her date branches conflates histories and crowds her workspace. (Confirmed correction from Kahran on 2026-05-07: *"why are you using divyas branches we talked about this you should be on your own branch."*)

For Claude/Kahran-session work: use a **`kahran-<date>-<task>`** branch. Date format matches Divya's date branches (`mmmDD` lowercase, zero-padded) — e.g. `kahran-may07-thesis-quiz`, `kahran-may07-comics-spec`, `kahran-jun14-pricing-update`. The date is essential, not optional: Kahran often runs two parallel Claude Code sessions in different windows on different tasks, and date-less branch names collide when both windows happen to pick the same task name. The date guarantees uniqueness per session-day.

Create fresh off latest `main`: `git checkout main && git pull && git checkout -b kahran-<date>-<task>`.

(Confirmed by Kahran on 2026-05-07: *"make it name and date based branches as our standard ... because i might be claude coding in two different windows on two different things it causes issues."*)

**Pattern:** branch off latest `main` → edit → commit → push the branch. **Stop there.** Only merge to main when the user says "merge" / "ship" / similar. Auto-merging mid-task disrupts parallel sessions — Kahran often works in a second window simultaneously (e.g. on `thesis-workshop.html`) while another branch is open.

**Verify with `git branch --show-current` before EVERY commit.** The Claude Code session on this machine silently shifts branches between turns — this has happened repeatedly. Don't assume the branch from the previous turn is still checked out. If the wrong branch is checked out, `git checkout` to the correct one BEFORE committing.

**When the user asks to merge: merge on the REMOTE, never locally** (Kahran + Divya discussed and agreed on 2026-06-18 that remote-PR merge beats local merge). Push the branch, then merge it via a GitHub PR (`gh pr create -B main` → `gh pr merge --merge --delete-branch`). Do NOT `git checkout main && git merge <branch> --no-ff && push main` — this repo is shared (Divya + the mini + parallel windows), and local merging caused diverged-`main` / a stranded branch on 2026-06-18. After the remote merge, only if you need local `main` current: stash the parallel window's unrelated working-tree changes first, then `git checkout main && git pull`.

**Always clean up merged branches.** Once a feature branch is merged to `main` and `main` is pushed, delete that branch both locally and on origin (`git branch -d <branch>` && `git push origin --delete <branch>`). Don't let merged `kahran-*`/`ks-*` branches accumulate. Never delete Divya's `designmay*` branches or unmerged WIP. (Standing instruction from Kahran, 2026-05-31.)

Each fix → its own commit on a `kahran-*` branch → push → wait for merge instruction → merge on the remote via PR (never local `git merge` + push main).

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

## Old-URL redirects (Squarespace → new site)

The site moved off Squarespace; the old structure used different paths that now
404 (and GitHub Pages can't issue real HTTP 301s). The old shapes were:

- `/thinking-on-thinking` → `/podcast.html` (podcast index)
- `/thinking-on-thinking/<NNN>-<slug>` → `/podcast/<slug>.html` (episodes; `<NNN>` = season·100+episode)
- `/our-work/<slug>` → `/work/<slug>.html` (case studies)
- `/musings/<slug>` → `/thinking/<slug>.html` (essays)
- a few old root pages (`/agemo.html`, `/klydo.html`, `/about-us`, `/joyus-services-and-offerings`, …)
- legacy `/joyus-website/...` (pre-cutover GitHub Pages project path) → same path at root

**`scripts/gen-redirects.mjs` is the single source of truth.** It (1) reads live
files to index current podcast/thinking/work slugs, (2) writes `redirects.js`
(the baked data the 404 page reads at runtime), and (3) writes redirect **stub
files** (200 + `<link rel=canonical>` + meta-refresh, the same pattern as the
older `divya-tak.html`/`our-work/*` stubs) for the finite, exactly-known old URLs.
Re-run after adding episodes/case studies: `node scripts/gen-redirects.mjs`.

> **Note for future sessions:** some old URLs currently redirect to a *fallback*
> because their real page doesn't exist yet — notably `/our-work/quiznext`,
> `/our-work/pathfinder`, `/our-work/misplaced-game`,
> `/our-work/immersive-inclusive-audio-institute` all point at `/work/` (the
> index). **When one of those case studies is actually built** (e.g. QuizNext —
> it's in PENDING-WORK), re-run `node scripts/gen-redirects.mjs`: the fuzzy
> matcher will repoint the old URL straight at the new `/work/<slug>.html`.

Two layers work together:
1. **Stub files** at the exactly-known old paths — cleanest SEO signal (real 200 + canonical).
2. **Smart `404.html`** — GitHub Pages serves `/404.html` for *any* unknown path, so
   it loads `redirects.js` and pattern-redirects the long tail (incl. ~150 episodes
   Google indexed but nobody's clicked) by fuzzy-matching the slug. No match → the
   normal "oops" page shows. It is NOT the `looking.html` search page — `looking.html`
   stays dedicated to homepage near-miss/search results; don't repurpose it for 404s.

**`404.html` must use root-absolute links** (it carries `<base href="/">`) because it
renders at the *failed* URL, often many levels deep — relative links would resolve
against the bad path. Keep `<base href="/">`; don't reintroduce `/joyus-website/` paths.

## Gotchas

- **Google Analytics (GA4): the site's web tracking uses `G-74FZR7YY60`** — the GA property **"website joyus.studio"** (property 427004605, under the `joyus` account). The GA4 `gtag.js` snippet is in the `<head>` of every public page (added 2026-06-04). **Do NOT use `G-K7PDLTYWF6`** for web tracking — that's a separate, inert property Firebase auto-created (no Analytics SDK is loaded). **Do NOT add `G-H63H3KD6WQ`** — that's Kahran's personal site.
- **Do not remove `experimentalAutoDetectLongPolling`** from any Firestore init — CORS on GitHub Pages breaks without it.
- **Do not center-align editorial hero content** (hubs, services, `thinking/*`, blog posts) — they're left-aligned with a 640–680px column. Only grid/listing heroes (`work/`, `podcast.html`, `comics/`) are centered.
- **Do not reformat minified `thinking/*.html` files** — they're intentionally single-line with inline styles. Edit content without expanding the formatting.
- **Canonical URLs now point to `joyus.studio`** (migration done — verified 2026-07-06, 0 `kh9010.github.io` canonicals remain). `CNAME` = `joyus.studio`. If you add a page, use `https://joyus.studio/…` for its `<link rel="canonical">`, `og:url`, and any JSON-LD absolute URLs.
- **After editing `_partials/nav.html` or `_partials/foot.html`, run `node scripts/sync-chrome.js`** to propagate to all marker-bearing pages. The partials use `{{P}}` as the relative-path-to-root token; the script substitutes it per page based on directory depth.
- **Every new page should use the marker system**: include `<!--BEGIN:NAV--><!--END:NAV-->` and `<!--BEGIN:FOOT--><!--END:FOOT-->` and run `sync-chrome.js`. (The old advice to hand-copy `nav-bar`/4-col `.footer` markup for "editorial wing" pages is retired — that markup has no CSS and renders as plain lists. The editorial wing is on markers now; don't reintroduce legacy chrome.)
- **Add new sitemap entries** to `sitemap.xml` for any new public page.
- **Splash/shape classifier is archived** at `index-old.html`. Don't link it without restoring the full flow (see "shape-echo.js" section).
