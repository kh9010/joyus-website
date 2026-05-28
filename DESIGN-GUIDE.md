# Joyus Studio — Design & Element Guide

A visual and component reference for anyone (human or agent) building a new page on this site.
Pair this with `CLAUDE.md` (architecture, gotchas, agent setup). This file answers
**"what does a Joyus page look and feel like, and what pieces do I assemble?"**

---

## 1. Voice

> We think with everyone. We build with a few.

- Sound human, not corporate. Lowercase eyebrows ("your move", "what mattered"), title-case headings.
- Plainspoken; no jargon unless the case study earns it.
- Pink is for warmth + emphasis, never for warning. Cyan is for confidence. Yellow is for surprise / attention. Ink (`#2C3544`) is for body. Don't introduce new accent colors.
- "Be our friends." — the standard outro. Never "contact us" or "get in touch."

---

## 2. Stack rules (non-negotiable)

- **Pure static site**: hand-written HTML + one shared `styles.css` + vanilla JS. No build, no framework, no bundler.
- **Nav and footer are the only thing templated.** Source: `_partials/nav.html` + `_partials/foot.html`. Pages mark insertion points with `<!--BEGIN:NAV-->...<!--END:NAV-->` and `<!--BEGIN:FOOT-->...<!--END:FOOT-->`. Run `node scripts/sync-chrome.js` after editing a partial.
- Page-local `<style>` blocks are fine and encouraged for unique components — don't bloat `styles.css` with one-off rules.
- **Don't** introduce build tools, npm, TypeScript, modules, CSS preprocessors, or templating engines. The hand-written nature is intentional.

---

## 3. Tokens

### Colors

| Token | Hex | Used for |
|---|---|---|
| `--pink` | `#E91E7B` | Primary accent, links, "be our friends" emphasis |
| `--cyan` | `#4FC4CF` | Secondary accent, confidence/clarity |
| `--yellow` | `#F2C94A` | Surprise/highlight, sticker accents |
| `--bg` / `--warm-gray` | `#FAF7F2` / `#F5F3F0` | Page background, hero gradient base |
| `--ink` / `--black` | `#2C3544` / `#111214` | Body text |
| `--ink-soft` | `#54606F` | Secondary text, eyebrows |
| `--ink-fade` | `#8892A0` | Hints, footer meta |
| `--rule` | `rgba(44, 53, 68, 0.12)` | Hairline dividers |

### Hub accents

Each themed hub overrides `--hub-accent` for its eyebrow + drop-cap + inline-card border.

| Hub | Accent |
|---|---|
| `hub-story` | pink `#E91E7B` |
| `hub-building` | cyan `#4FC4CF` |
| `hub-behavior` | gold `#D4A843` |
| `hub-play` | green `#5BBD72` |
| `hub-games` | purple `#8B5CF6` |
| `hub-creative` | orange `#E8734A` |

### Fonts

- **Space Grotesk** (sans) — body and most display on the studio wing (work/, services, podcast, index)
- **DM Serif Display** (serif) — editorial headings on the editorial wing (hubs, thinking, comics, about)
- **DM Sans** (sans) — editorial body on the editorial wing
- **Caveat** (cursive/handwritten) — `--hand` accents: small captions, "your move" stickers, asides

> The "studio wing" uses Space Grotesk top-to-bottom (set via `body.work-page`). The "editorial wing" uses DM Serif Display + DM Sans. These are intentionally distinct visual languages — don't homogenize.

**Going forward, new pages use Space Grotesk + Caveat only.** DM Serif Display is being phased out — existing editorial pages (`thinking/*`, `hub-*`, `ai-workshops.html`, `thesis-workshop.html`) still use it, but new builds should not introduce it. When designing a new workshop, sales, or service page: headings in Space Grotesk 600/700, body in Space Grotesk 400, handwritten accents and eyebrows in Caveat. The combination of a heavy-weight grotesque for display and a casual handwritten for voice gives the same studio warmth without the editorial-essay weight.

### Spacing

```css
--x: clamp(1.5rem, 4vw, 3rem);   /* horizontal page gutter */
```

Hero sections sit under the fixed nav, so allow `8rem` top padding when the page starts with one. Body columns are `640–680px` for editorial reading, `960–1200px` for grids.

---

## 4. Page templates

### A) Homepage (`index.html`)

Sparse 3-row stage: eyebrow top-left, intent input centered, animated tagline bottom-right, decorative `.dot` blobs scattered. Self-contained inline styles (does NOT link `styles.css`). The only page like this — don't copy the pattern; copy the page if you need a sibling stage.

### B) Editorial — hubs, thinking essays, services, blog posts

```
[ NAV ]
[ .editorial-hero ]      ← left-aligned, 640px max-width, gradient warm-gray → white
   .editorial-theme      ← Caveat, accent color
   <h1>                  ← DM Serif Display
   .editorial-lede       ← left-bordered with --hub-accent
[ .editorial-body ]      ← 680px max-width, drop-cap on first paragraph
   <p>...
   .inline-card          ← cross-link to a podcast/case-study/comic
   .pull-quote           ← big standalone quote
[ .editorial-more ]      ← "keep exploring" — reading-links + .explore-pills
[ .hub-cta ]             ← "Have a story to tell? → Be our friends"
[ FOOT ]
```

Body copy is `1.05rem / 1.85` line-height, color `#444`. **Do not center-align** editorial heroes — they're left-aligned.

### C) Grid / listing — `work/`, `podcast.html`, `comics/`

Centered hero, then a card grid. Each grid page picks its own grid mechanic — `work/index.html` is the band-marquee model (see §6); `comics/index.html` is a card grid; `podcast.html` is a structured episode list. Don't unify these; the variation is content-fit.

### D) Case study — `work/<slug>.html`

```
[ NAV ]
[ .cs-cover-narrative ]  ← name, h1, lede, services chips, scroll-thread
[ .cs-slide ] × N        ← alternating warm-gray + white sections, 640–960px content
   .cs-fig                ← image with rotated-shadow-on-hover memphis treatment
   .cs-note               ← short caption
[ .cs-closing ]          ← see §6.7
[ FOOT ]
```

Each case study lives in its own `<style>` block at the top of the file — uses page-specific `cs-` prefixes (e.g. `.kl-`, `.tx-`, `.rn-`, `.ts-`). Shared cs-shell components (`.cs-cover-narrative`, `.cs-slide`, `.cs-fig`, `.cs-closing`) are in `styles.css` via `case-study.css` or shared rules.

---

## 5. Chrome (nav + footer)

### Nav (`_partials/nav.html`)

Modern nav: Work · Services · Podcast · About · Say hi.

```html
<!--BEGIN:NAV--><!--END:NAV-->
```

Drop the markers anywhere `<nav>` would go. Run sync-chrome to populate. Active link is auto-detected by URL pattern.

### Footer (`_partials/foot.html`)

Slim one-line: copyright on the left, `hello@joyus.studio` on the right.

```html
<!--BEGIN:FOOT--><!--END:FOOT-->
```

Always after `<main>` / before `</body>`.

### Updating either

Edit the partial, then:

```bash
node scripts/sync-chrome.js
```

This walks every `.html` under the repo and rewrites the marker contents. Pages without markers (a few `*-old.html` archives) are skipped.

---

## 6. Components

### 6.1 `.inline-card` — content reference

Used inside editorial body to link out to a podcast / case study / comic / essay.

```html
<div class="inline-card">
  <a href="podcast/story-vs-telling-part-1.html">
    <span class="inline-card-type">Podcast</span>
    <span class="inline-card-title">Story Vs. Telling Part 1 &rarr;</span>
  </a>
</div>
```

Border-left in `--hub-accent`. Hover lifts subtly.

### 6.2 `.pull-quote`

```html
<div class="pull-quote">
  <p>"The story is already in you."</p>
  <cite>Divya Tak</cite>   <!-- optional -->
</div>
```

Italic, large, often paired with the editorial hub accent on the left border.

### 6.3 `.closing` / `.cs-closing` — outro flourish

The "Be our friends" closing block. Goes immediately before the footer on every public page that warrants a CTA.

```html
<section class="cs-closing">
  <span class="cs-closing-label">your move</span>
  <h3>See a project that feels like yours? <em><a href="mailto:hello@joyus.studio">Be our friends.</a></em></h3>
  <span class="cs-closing-hint">hello@joyus.studio · we read everything</span>
  <a class="cs-next" href="rachna-nivas.html">next case study: rachna nivas <span class="arrow">→</span></a>  <!-- case studies only -->
</section>
```

- Left-aligned, cyan dot before "your move", warm-cream background, `border-top: 2px solid --ink`.
- The h3 verb changes per page ("Building something brand new?", "Have a voice that isn't coming through?", "Pick a verb."). Always ends in **"Be our friends."**
- `.closing` and `.cs-closing` are visually identical — use `.closing` outside `work/`, `.cs-closing` inside.
- For pages that **don't** link `styles.css` (currently `work/agemo.html` and `work/rachna-nivas.html`), the cs-closing CSS must be inlined in a page-local `<style>` block. See those files for the exact ruleset.

### 6.4 Band + marquee + card (`work/index.html` system)

A horizontal auto-scrolling carousel. Used on the work index, but available for any "browse a collection" surface.

```html
<section class="band" id="band-brand" data-color="pink">
  <div class="band-head">
    <span class="band-num">01</span>
    <span class="band-name">Brand</span>
  </div>
  <div class="marquee" data-speed="60" data-dir="-1">
    <a class="card" href="./klydo.html"
       style="background-image: url('../images/work/klydo.jpg'); --tilt: 0.6deg;">
      <span class="card-name">Klydo</span>
    </a>
    <!-- ... duplicate the entire card set so the marquee can loop seamlessly ... -->
  </div>
</section>
```

- `data-color` controls the band accent: `pink`, `cyan`, or `yellow`.
- `data-speed` is px/sec (typical: 40–80). `data-dir` is `1` or `-1`.
- Card variants: default, `.wide`, `.tight`, `.mega`. Each card has a `--tilt` CSS var for hand-placed rotation (small ± degrees).
- **The card list MUST be duplicated in full inside `.marquee`** — the engine measures `scrollWidth / 2` and freezes if the duplicate is missing.

### 6.5 `.card-sticker` — overlay badge on cards

```html
<a class="card mega" href="./klydo.html" style="background-image: url(...); --tilt: 0.8deg;">
  <span class="card-sticker yellow right">★ studio favourite</span>
  <span class="card-name">Klydo</span>
</a>
```

Color: `yellow`, `pink`, `cyan`, or `ink`. Position: `.left` or `.right`. Use sparingly — one per band max.

### 6.6 `.fact` — non-link inline cards (inside `.marquee`)

```html
<div class="fact stat" style="--tilt: 0.6deg;">
  <div class="fact-num-wrap"><span class="fact-num">10</span></div>
  <span class="fact-num-label">Full case studies, written front to back.</span>
</div>
```

Variants: `.stat` (big number), `.quote` (pull-quote on a card), `.note` (short aside), `.note.invert` (dark). Decorative, not links — they trigger a click "surprise" animation (confetti, sparkles, etc.) defined at the bottom of `work/index.html`.

### 6.7 `.dot` — decorative blobs

Scattered colored circles for the homepage and some hero stages. Absolute-positioned via inline `style`:

```html
<span class="dot d-pink" style="top:12%;left:8%;width:160px;height:160px;"></span>
<span class="dot d-cyan" style="bottom:18%;right:14%;width:80px;height:80px;"></span>
<span class="dot d-yellow" style="top:60%;left:36%;width:24px;height:24px;"></span>
```

Three color classes only: `d-pink`, `d-cyan`, `d-yellow`. Don't add more.

### 6.8 `.cta-btn` / `.cs-next` — buttons and forward arrows

CTA button (used in `.hub-cta` and a few editorial pages):
```html
<a href="mailto:hello@joyus.studio" class="cta-btn">Get in touch</a>
```

Forward arrow link (used inside `.cs-closing`):
```html
<a class="cs-next" href="...">next case study: tatsam <span class="arrow">→</span></a>
```

The `.arrow` slides on hover.

### 6.9 Hand-written eyebrows

Caveat (`--hand`) is for things that should feel marginal — eyebrows, captions, "your move" labels, "what mattered" tags. ~1.0–1.4rem, slight rotation if it fits the layout.

```html
<span style="font-family: var(--hand); font-size: 1.2rem; color: var(--ink-soft); transform: rotate(-1deg); display: inline-block;">
  two takes on the same project, in 30 seconds each
</span>
```

---

## 7. Animation & interaction

- `prefers-reduced-motion` — every animated element has a guard at the bottom of its `<style>` block.
- Hover lifts on cards, inline-cards, links: subtle (translateY ~2px, soft shadow).
- Marquee pauses on hover/touch; clickable through to card link via `pointercancel` / `setPointerCapture` dance — don't refactor casually.
- Surprise animations on `.fact` cards (`work/index.html`) — confetti, scramble, rain, rings, stamp, sparkles. Adding a new band? They'll get the surprises for free as long as they use `.fact` markup.
- Scroll-progress thread (`.thread`) at top of case studies — width = scrollY/scrollHeight × 100%.

Keep transitions short (`0.2s–0.3s`). Long, choreographed animations belong on the homepage and case-study covers, not on every link.

---

## 8. Images

- WebP for case-study slides (originals retained as PNG when available, e.g. `images/work/rachna-nivas-2025/`).
- Preload the first 3 above-the-fold images on case studies:
  ```html
  <link rel="preload" as="image" href="../images/work/<slug>/slideX-hero.webp">
  ```
- All `<img>` need a meaningful `alt`. Decorative `<span class="dot">` blobs are background-only (no alt needed).
- Background-image cards in marquees are NOT lazy-loaded (browser limitation). For a band of 10+ cards, consider migrating to `<img loading="lazy">` if mobile data is a concern.

---

## 9. Accessibility

- `<html lang="en">` on every page.
- `<title>` reflects content, not template.
- Skip-to-content link (`<a href="#main-content" class="skip-to-content">`) on editorial pages with a `<main id="main-content">`.
- Keyboard focus styles: pink 2px outline (declared globally in `styles.css`).
- Color contrast: `--ink-soft` on `--bg` is the soft-text ratio; don't go softer.
- Hover-only affordances are duplicated for touch via `@media (hover: none) and (pointer: coarse)` in `styles.css`.

---

## 10. Don'ts

- **Do not** add a build step, npm, or any framework.
- **Do not** introduce a new accent color.
- **Do not** center-align editorial hero content (hubs, services, thinking, blog posts).
- **Do not** reformat `thinking/*.html` files — they're intentionally minified single-line. Edit content without expanding the HTML.
- **Do not** add the GA tag `G-H63H3KD6WQ` — Joyus uses `G-K7PDLTYWF6`.
- **Do not** remove `experimentalAutoDetectLongPolling: true` from any Firestore init.
- **Do not** edit nav/footer markup directly in pages — edit `_partials/*.html` and run sync.
- **Do not** add more than the four established shapes (`.dot` palette = pink/cyan/yellow only).
- **Do not** copy the homepage stage template (`index.html`) to other pages — it's bespoke.
- **Do not** invent new closing language — always "Be our friends."

---

## 11. New-page checklist

When adding a public page (e.g. a new case study or hub):

1. **Pick a template** (§4) — case study, editorial, or grid.
2. **Copy a sibling page** that already follows the template. Update the title, OG tags, canonical URL, JSON-LD schema.
3. **Path prefix**: at root use no prefix; in `work/`, `comics/`, `podcast/`, `thinking/` use `../` for cross-directory links.
4. **Chrome markers**: include `<!--BEGIN:NAV--><!--END:NAV-->` and `<!--BEGIN:FOOT--><!--END:FOOT-->` in the body. Run `node scripts/sync-chrome.js`.
5. **Closing**: every public page ends with a `.closing` or `.cs-closing` block (§6.3) before the footer.
6. **Sitemap**: add the page URL to `sitemap.xml`.
7. **Page-local styles**: put unique component rules in a `<style>` block at the top of the file. Only promote to `styles.css` if a third page needs it.
8. **Test**: load the page over `python -m http.server 8000` and click every link. Check mobile breakpoint at 720px and 480px.
9. **Reduced motion**: if the page has animations, add a `@media (prefers-reduced-motion: reduce)` guard at the bottom of the `<style>` block.
10. **Fonts**: use **Space Grotesk + Caveat only** — no DM Serif Display on new pages.

---

## 12. Where to look for examples

| Need | Reference page |
|---|---|
| Editorial / hub | `hub-story.html` (DM Sans, pink accent) |
| Editorial / minified essay | `thinking/voice-versus-tone.html` |
| Case study (clean) | `work/klydo.html` |
| Case study (heavy custom) | `work/agemo.html` (no styles.css link; everything inline) |
| Grid index | `work/index.html` (band-marquee model) |
| Listing | `comics/index.html`, `podcast.html` |
| Service page | `services.html` (alternating `.capability` two-column) |
| Homepage stage | `index.html` (one-of-a-kind) |
| Closing flourish | `.cs-closing` in any case study or `.closing` on `services.html` / `work/index.html` |

When in doubt, copy from `work/klydo.html` for case-study work and `hub-story.html` for editorial. They are the cleanest references.
