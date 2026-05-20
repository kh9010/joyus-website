# Joyus design-language audit — 2026-05-20

Read-only review of the four modern-chrome pages: `index.html`, `work/index.html`, `services.html`, `podcast.html`. Plus shared `_partials/nav.html` and `_partials/foot.html`. No `styles.css` is consumed by these pages — each one defines its full visual system inline. That is itself the most important finding.

---

## 1. The shared system (the parts that actually agree)

All four pages declare an identical `:root` token block in their inline `<style>`:

| Token         | Value                          | Role                              |
|---------------|--------------------------------|-----------------------------------|
| `--bg`        | `#FAF7F2`                      | Paper / page                       |
| `--ink`       | `#2C3544`                      | Headlines, body                    |
| `--ink-soft`  | `#54606F`                      | Secondary text                     |
| `--ink-fade`  | `#8892A0`                      | Tertiary, meta, footer             |
| `--rule`      | `rgba(44, 53, 68, 0.12)`       | Hairlines                          |
| `--pink`      | `#E91E7B`                      | Primary accent                     |
| `--cyan`      | `#4FC4CF`                      | Secondary accent                   |
| `--yellow`    | `#F2C94A`                      | Tertiary accent                    |
| `--sans`      | `'Space Grotesk'`              | Everything                         |
| `--hand`      | `'Caveat'`                     | Annotation, kicker, asides         |
| `--x`         | `clamp(1.5rem, 4vw, 3rem)`     | Side padding                       |

Note: this is **not** the system documented in `CLAUDE.md` / `styles.css`. The legacy system used `--warm-gray #F5F3F0`, `--black #111214`, DM Serif Display + DM Sans, and `styles.css` is not linked from any of these four pages. The four "modern chrome" pages have already migrated to a different token set: Space Grotesk only (no serif), Caveat for hand notes, a brighter paper `#FAF7F2`, a softer ink `#2C3544`, and yellow promoted to a first-class accent next to pink and cyan.

**The chrome is genuinely shared.** Nav and footer markup is byte-identical across all four pages (verified against `_partials/nav.html` and `_partials/foot.html` — both are inlined including their `<style>` block, no `styles.css` dependency). Fixed top nav, 32px logo, six items (Work / Services / Workshops / Podcast / About / Say hi), blurred warm paper backdrop, pink hover and pink active underline. Footer is a single-row thin grey strip — copyright left, email right.

---

## 2. Page-by-page characterization

### `index.html` — the typewriter intent box
- **Layout:** Full-viewport sparse stage. 3-zone composition — eyebrow pinned top-left (absolute), input + suggestion list centered (max-width 820px), tagline pinned bottom-right (absolute, rotated −1.5°). One single section, no scroll required to grasp the page.
- **Type:** `i need…` italic h1 at ~1.2–1.5rem. The input itself is the headline — pink, weight 700, 2.6–5.4rem, letter-spacing −0.04em, with a 6px ink underline that flips to pink on focus. Tagline in Caveat at ~1.7–2.4rem.
- **Color:** Paper background. Pink as the active typing color and tagline accent (`<em>defeat is something to navigate.</em>`). Yellow eyebrow dot, cyan focus-shadow on the (now-hidden) suggestion intent-box. Scattered decorative dots in all three accents.
- **Motion:** Typewriter cycle on the placeholder — 65 ms type, 28 ms delete, 1800 ms hold. Pauses while user is focused or has input. No reduced-motion branch on this specific JS. Suggestion list fades in on focus (250 ms, vertical drop), fades out 160 ms after blur.
- **Voice:** "complexity · uncertainty · change · est. 2021" eyebrow. Manifesto-as-tagline. The page asks one question and waits.

### `work/index.html` — five-lens marquee
- **Layout:** Big editorial hero, then six horizontally-scrolling bands (Brand / Product / Research / Story / Growth / All). Bands have a numbered head (`01`, `02`…) with a colored band-name dot. Each band is a `.marquee` of mixed cards + fact cards at slightly different widths (`tight` 240 → default 340 → `wide` 540 → `mega` 680).
- **Type:** Hero h1 at 4–10rem, weight 700, line-height 0.92, letter-spacing −0.045em, with `<em>` in pink. Band names 1.6–2.2rem. Card names 1.45rem in white over image overlay.
- **Color:** Cards have full-bleed images with a black→transparent bottom gradient for legibility. Fact cards come in three flavors that rotate per band: `.stat` (solid band-color block, oversized 5–8rem white number), `.quote` (solid ink-black with band-color quote mark), `.note` (solid band-color with white statement, or inverted to ink with colored kicker). Band color is set per-band via `data-color="pink|cyan|yellow"`. Cards and facts both render tilted `--tilt: 1.0deg…-1.4deg` for a pinned-board feel.
- **Motion:** Auto-scrolling marquees in alternating directions and speeds (42–75). Drag-to-scroll cursor:grab. Card hover lifts (−6px / −6px) with a 14px hard-offset colored shadow (Memphis-style). Confetti / sparkle / number-scramble JS triggered on fact-card click (surprise layer).
- **Voice:** Editorial — "Same studio. Five lenses." Each band hides a one-liner principle ("A logo isn't an identity…"), a recurring-problem note, and a stat. The cards are the subjects; the facts are the studio talking back.

### `services.html` — five-verb monolith
- **Layout:** Editorial hero, then five full-viewport (`min-height: 100vh`) verb panels stacked vertically. Each panel is one solid-colored field — pink, ink, yellow, cyan, pink — with a 12-column grid that ping-pongs left/right (`.layout-l` / `.layout-r`). Top-left of each panel: `01 — of 05` label. Inside the grid: giant verb word (4.5–9.5rem) paired with a manifesto sentence, plus an explainer paragraph and an italicized client-question list.
- **Type:** Hero title 3.5–9rem with a pink `em` followed by a yellow period (`What we do, when you ask.`). Verb word is the same scale, but `::after { content: "."; }` accent-colored. Manifesto 1.2–1.65rem. Questions 1.05–1.25rem italic.
- **Color:** Each verb panel inverts: pink/ink/pink fields get white text + yellow accent dots; yellow/cyan fields get ink text + ink accent. Yellow-on-yellow and pink-on-cyan are explicitly called out and avoided. Scattered decorative dots are present on every panel at ~0.4 opacity.
- **Motion:** Fixed top progress thread — 2px gradient (pink → cyan → yellow) growing left-to-right with scroll. IntersectionObserver swaps a nav chapter number (`01`–`05`) as you cross each verb at >35% visibility. No card hover effects — the page is one big read.
- **Voice:** Manifesto-first. "You bring the problem. We help you see it clearly enough to decide." Question lists are first-person founder voice ("Should we rebuild the brand, or just rename it?"). Pure advisory tone.

### `podcast.html` — the archive
- **Layout:** Hero with progress thread → featured episode block (Spotify embed) → continuous quote ticker (110 s linear loop) → three "listen in order" series cards (pink/cyan/yellow solid blocks with offset corner dot) → backlog list with a tab-strip theme filter (recent / Creativity / Why / Growth / Together / AI&tech) → centered subscribe pill row → closing.
- **Type:** Hero h1 3–7rem with cyan `em` ("Thinking on **Thinking.**"). Featured ep number is Caveat at 3–5rem, rotated −3°, in pink. Series titles 1.75–2.2rem with Caveat sub on a new line ("The Success *series*"). Backlog rows are a 4-column grid `86px / 1fr / auto / auto` — `S7E14` in Caveat, title in sans, date and duration in `--ink-fade`.
- **Color:** Heaviest cyan presence of the four (hero accent is cyan, not pink). Quote cards are white-on-paper with a 3px pink left bar and a 0.18 opacity Caveat quote-mark watermark. Series cards are solid pink / cyan / yellow with a 120px contrast-color dot bleeding off the top-right corner.
- **Motion:** Quote ticker translates −50 % over 110 s; pauses on hover; `prefers-reduced-motion: reduce` stops the animation entirely. Filter chip flips to pink-on-pink with a 7px pink triangle pointing into the list. Series cards lift 4px on hover. Backlog rows shift 0.5rem right on hover and turn pink.
- **Voice:** "Thinking on Thinking." Founder interviews, friend conversations. Quote cards present the show as a collection of lines, not episodes. Filter labels are sentence-cased and conversational ("Understanding why" / "Working with people you love").

---

## 3. Synthesis

### What this site looks and feels like (the north-star paragraph)

A warm-paper editorial studio site — `#FAF7F2` background, no shadows on the page itself — wearing one bold sans (Space Grotesk) at near-display sizes and a handwritten Caveat for asides, hints, and numbers. Three saturated accents (magenta-pink, mint-cyan, butter-yellow) and one dark ink (`#2C3544`) carry every emphasis. Decorative ringed and filled dots — sized 8px up to 420px — scatter across every section as the studio's signature ornament; on services they're 40% opacity, on home and work they drift. Layouts swing between sparse-and-centered (home, services-verb hero) and dense-and-tilted (work-grid, podcast-series). Buttons barely exist as a class — most affordances are typography (large word, an italicized em, a pink underline) or 999px pills. The feeling is editorial-not-corporate, opinionated-not-decorated; a studio that talks the way the typewriter on the homepage types — pause, then a phrase that means something.

### 3–5 strongest, most consistent design moves

1. **The three-accent system holds across every page.** Pink as primary, cyan as secondary, yellow as tertiary. Every eyebrow gets a dot in one of these three; every section accent uses one. No drift to other hues.
2. **Caveat for the "human" register.** Hints ("we read everything"), episode numbers, kicker labels, the homepage tagline — Caveat does the job a serif would do on a more traditional site, and it does it consistently.
3. **Scattered dots as the studio mark.** Present on every page, every hero, most sections. Sizes, opacities, and drift speeds vary but the vocabulary is the same: filled circles in the three accents (occasionally ink), absolute-positioned, `pointer-events:none`, layered behind content at `z-index:0`.
4. **Closing block is now a real template.** All four pages end with `.closing` — `--ink` top border, `your move` label with yellow/cyan dot, h3 with a pink-underlined mailto, and a `we read everything` hint. It's the only block that's truly templated.
5. **One sans for everything.** Space Grotesk 400/500/600/700 carries hero display, eyebrows, body, captions, and buttons. The discipline of one workhorse + one decorative (Caveat) reads as confidence.

### 3–5 most visible inconsistencies and weak spots

1. **Hero treatment varies more than it should.** Home is a sparse single-screen stage with no h1 visual mass at all (the input is the headline); work and services are 4–10rem display-h1 walls; podcast is in between at 3–7rem. The progress thread (pink→cyan→yellow gradient bar) appears on services and podcast but not on work and not on home. The hero eyebrow gets a yellow dot on home and work, but a pink dot on services and podcast — small but the system is supposed to be deliberate about which color flags which page.
2. **Hero "em accent" color is unpredictable.** Pink on home and services and work; cyan on podcast. There's no documented rule for when cyan takes the lead vs. pink. Podcast's choice reads as deliberate (cyan = the show's accent), but nothing else on podcast actually carries the cyan-lead pattern — quote-card bars are still pink, filter chips are pink-active.
3. **Tokens are duplicated, not shared.** Each page redeclares the same `:root` block inline. If any value moves (e.g. paper goes from `#FAF7F2` to a different warmth), four files have to change. `styles.css` exists in the repo but none of these four pages link it. This is the biggest fragility in the system.
4. **Card families don't agree.** Work uses tilted full-bleed image cards with white labels + Memphis offset hover shadows. Podcast uses solid-color flat series cards with corner-dot bleed and an upward-shift hover. Quote cards (podcast) are white-with-pink-bar — yet another family. None of them rhymes with the next. There's no `.card` primitive; each page invents one.
5. **Footer is austere to the point of absence on every page.** A single-row grey strip with copyright + email. No nav-recap, no social, no contact-block. Compared to the headlong density of work/index and the editorial heft of services, the footer drops the page abruptly. (CLAUDE.md notes the legacy footer was a richer 4-col layout with Themes — that information is just gone now on modern pages.)
6. **The closing block is the most templated piece on the site, but its accent dot is not stable.** Home closing has a yellow dot; services has a yellow dot; podcast has a yellow dot; work has a cyan dot. Tiny but it's the only obvious inconsistency in the one block that's supposed to be uniform.

### Bonus observation: nav misses its own page
The shared nav declares Work / Services / Workshops / Podcast / About / Say hi. Of the four pages audited, only podcast and services even surface in the modern nav's active state. The `data-nav` system covers all five, but there is no "Comics" or "Thinking" entry — the partials don't yet account for the editorial wing CLAUDE.md flags as the open coherency issue. Not a "drift between these four", but a drift between these four and the rest of the site.

---

## TL;DR for a designer

- **Palette:** paper `#FAF7F2`, ink `#2C3544`, pink `#E91E7B`, cyan `#4FC4CF`, yellow `#F2C94A`.
- **Type:** Space Grotesk everything; Caveat for asides + numbers. Display sizes are big (4–10rem) and tight (letter-spacing −0.04em).
- **Ornament:** scattered dots, ringed or filled, at every scale.
- **Voice:** editorial, opinionated, advisory-first. The homepage waits for a sentence; services answers in five verbs; work shows the work as principles + artifacts; podcast collects lines.
- **Biggest opportunity:** consolidate the duplicated `:root` tokens into a shared sheet, stabilize hero eyebrow + accent rules across pages, and define a primitive `.card` family so work / podcast / future grids rhyme.
