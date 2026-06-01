# Case-study architecture

How we think about, and build, the `work/*.html` project pages. Read this
before starting or rebuilding a case study. It complements `DESIGN-GUIDE.md`
(visual tokens/components) and `DESIGN-LANGUAGE.md` (the 2026-05-20 system) —
this doc is specifically about **case-study page structure + editorial method**.

Reference implementations to copy from: **`work/rachna-nivas.html`**,
**`work/agemo.html`**, **`work/convegenius.html`** (+ their cuts).

---

## 1. First principle — we don't manufacture the thinking

The thinking already exists, in the source material (the client deck, the
brainstorm boards, the research, the Notion). **Our job is to read it and
construct a page from it — not to invent a narrative that sounds good.**

- Pull headlines, frameworks, numbers, and decisions from the real artifacts.
- If a claim isn't in the source, don't write it. No invented metrics, no
  manufactured "insight," no retrofitted process.
- Preserve the team's actual vocabulary (e.g. ConveGenius: "Growth vs
  Engagement," "Ephemeral / Collectibles / Long-term rewards," the 8 goal
  buckets). Those framework nouns are the spine of the page.
- Reconstruct, don't screenshot. A FigJam board of sticky notes becomes a
  clean `cs-` layout that *says the same thing*, not a photo of the chaos.
  (Deck diagrams/mind-maps can be exported as images — see §6.)
- Editorial trim is welcome; reinvention is not. Tighten wordy source copy
  (we leave `<!-- KAHRAN-REVIEW: ... -->` comments noting trims), but keep the
  meaning and the voice.

## 2. Page taxonomy — main study + cuts

A project is usually **one main study + 0–N "cuts."**

- **Main** (`work/<slug>.html`) — the synthesis. The whole arc at a readable
  altitude: the problem/tension, the frameworks, the system, the outcome.
- **Cut** (`work/<slug>-cut-<aspect>.html`) — a focused deep-dive into one
  facet, for the reader who wants more. Cuts are *deeper*, not just shorter.
  - agemo → `agemo-cut-research`, `agemo-cut-interface`
  - rachna-nivas → `rachna-nivas-cut-story`, `rachna-nivas-cut-brand`
  - klydo → `klydo-cut-design`, `klydo-cut-strategy`
  - pratham → `pratham-cut-process`
  - convegenius → `convegenius-cut-activities`, `convegenius-cut-rewards`
- **When to cut:** when the source has more than one self-contained body of
  work (e.g. ConveGenius ran *separate* brainstorm sessions for activities and
  for rewards → one cut each), or when one audience wants strategy and another
  wants craft. If there's only one story, don't force cuts.
- **Naming is load-bearing:** `<slug>-cut-<aspect>.html`, all lowercase, where
  `<aspect>` is a **lens** (see §2a) — not project jargon. So
  `convegenius-cut-research` / `convegenius-cut-product`, **not**
  `-cut-activities` / `-cut-rewards` (those are facets of the project, not a way
  the studio works).

## 2a. Every study and cut maps loosely to one of the five lenses

The studio frames all work through **five lenses** (the bands on
`work/index.html`):

1. **Brand & Identity**
2. **Product & Interface**
3. **Research & Strategy**
4. **Story & Narrative**
5. **Growth**

A case study usually leads with one lens and touches a second. **Cuts should
each take a lens** — that's how a project's facets fit the studio's own
vocabulary instead of inventing per-project buckets. The good examples already
do this:

- **rachna-nivas** → `story` + `brand` cuts (Story & Narrative, Brand & Identity)
- **agemo** → `research` + `interface` cuts (Research & Strategy, Product & Interface)
- **convegenius** → `research` + `product` cuts (Research & Strategy = the student
  discovery + activities/rewards landscape; Product & Interface = the
  gamification system, IA, wireframes)

"Loosely" is the operative word — `interface` reads as Product & Interface,
`design`/`strategy` map to the nearest lens. But if you're about to name a cut
after a deliverable (a board, a deck, a feature), stop: re-frame it as the lens
that work expresses. The reader should be able to say "ah, that's the research
angle" / "that's the product angle," and recognise the same five lenses they
saw on the work index.

## 3. The invariant scaffold (every case study page)

Top to bottom, in this order:

1. **`<head>`** — `styles.css` + Google Fonts; per-page `<meta>` description,
   `og:*`, `twitter:card`, `<link rel="canonical">`, and a JSON-LD
   `CreativeWork` block (name, one-line description, url, creator = Joyus
   Studio). Page-specific `<style>` for any new primitives goes here.
2. **`<body class="work-page" data-accent="pink">`** — case studies are
   pink-accent (see DESIGN-GUIDE). Cuts may shift accent to signal the cut
   (e.g. klydo strategy cut = cyan).
3. **NAV** — the `<!--BEGIN:NAV-->…<!--END:NAV-->` partial. Run
   `node scripts/sync-chrome.js` after creating the page.
4. **Hero** — see §4.
5. **Cuts cross-link** — see §5 (only if the study has cuts).
6. **Narrative body** — the bespoke middle, built from source. See §7.
7. **`.cs-closing`** — the shared end block:
   ```html
   <section class="cs-closing">
     <span class="cs-dots" aria-hidden="true">…3 dots…</span>
     <span class="cs-closing-label">your move</span>
     <h3>… one-line provocation … <em><a href="../say-hi.html">Be our friends.</a></em></h3>
     <span class="cs-closing-hint">hello@joyus.studio · we read everything</span>
     <a class="cs-next" href="<next-study>.html">next case study: <name> <span class="arrow">→</span></a>
   </section>
   ```
8. **FOOT** — the `<!--BEGIN:FOOT-->…<!--END:FOOT-->` partial.
9. **`.cs-dots`** — every major section carries a small decorative dot cluster
   (`<div class="cs-dots" aria-hidden="true">` with 2–3 `<span class="pink|cyan|yellow">`
   inline-positioned). Keep colours from the tokens; vary placement per section
   (don't repeat the same giant-corner dot — see the dots note in DESIGN-GUIDE).

## 4. The opening (hero) — use the agemo / rachna pattern, do NOT invent one

**This is the canonical hero. `agemo.html` and `rachna-nivas.html` open with the
exact same structure — match it.** (Earlier ConveGenius/Pratham/Tatsam rebuilds
used a bespoke `cg-hero` with a service-pill meta and a 3-paragraph deck — that
was an invented pattern and is being retrofitted to this.)

```html
<section class="hero">
  <!-- agemo: six floating <span class="hero-dot hdN"> · rachna: a .hero-photo portrait -->
  <div class="hero-inner">
    <span class="hero-eyebrow">{Client} · {discipline} · Case study</span>
    <h1>
      {a CRAFTED headline — set the tension typographically with
       <span class="num">, <span class="accent">, <span class="strike">,
       <span class="replace">, and <br/> — not one flat line with an <em>}
    </h1>
    <p class="hero-deck">{ONE tight paragraph that frames the tension}</p>
    <div class="hero-meta">
      <span>Engagement<strong>{Client} &times; Joyus</strong></span>
      <span>Discipline<strong>{e.g. Research, Strategy, Interface}</strong></span>
      <span>Year<strong>{e.g. 2024  ·  Jan&ndash;Sep 2025}</strong></span>
    </div>
  </div>
</section>
```

- **Eyebrow** = `{Client} · {discipline} · Case study`. Real examples:
  "Codewords by Agemo · Case study"; "Rachna Nivas · Strategic coaching · Case study".
- **h1 is crafted, not a label or a flat question.** It's a *tension*, set with
  the emphasis spans + line breaks. Real examples: agemo — "**8** bets, drawn
  **26 times**."; rachna — "A philosophy that worked in person. *A form that
  could work without her in the room.*"
- **`hero-deck` = ONE paragraph.** The setup + the tension. Not a 3-paragraph
  who/scale/problem block.
- **`hero-meta` = exactly three labelled facts**: `Engagement` (Client × Joyus),
  `Discipline` (the lenses), `Year`. Each is `label<strong>value</strong>`. Not a
  services-pill row, not a facts row.

## 4b. The ending — dark `takeaways`, then `.cs-closing` (also from agemo)

Every **main** ends with two blocks in this order; cuts skip the takeaways and
end on a `.cta-row` (see §5).

**1 — Takeaways** (`<section class="sec takeaways">`, dark): a `sec-eyebrow`
("what mattered" / "what we left them with"), a `sec-title`, then a **numbered
`<ol class="takeaway-list">` of the actual lessons** — each item a full sentence
of real learning you could carry into another project, *not* a label. Then the
cut CTAs and a hand-note. Agemo's, verbatim in spirit:

> "Write down what you believe before you draw — and write down how you'd know
> you were wrong. Hypothesis docs aren't research busy-work; they're the only
> thing that prevents post-hoc rationalization."

**2 — `.cs-closing`** (verbatim shape — no decorative dots inside it):

```html
<section class="cs-closing">
  <span class="cs-closing-label">your move</span>
  <h3>{one-line provocation} <em><a href="../say-hi.html">Be our friends.</a></em></h3>
  <span class="cs-closing-hint">hello@joyus.studio · we read everything</span>
  <a class="cs-next" href="{next}.html">next case study: {name} <span class="arrow">→</span></a>
</section>
```

## 4c. The body — `.sec` narrative, with the depth agemo shows

Between hero and takeaways, the body is bespoke per project but built from the
same primitives and, crucially, the **same depth**:

- `<section class="sec [modifier]">` → `.sec-inner.reveal` → `sec-eyebrow` +
  `sec-title` + `sec-deck` + body. Reveal-on-scroll + a scroll-progress thread.
- **Surface the real thinking, not a description of it.** Agemo's body is a
  `synthesis-quote` (key phrases in `<mark>`), **eight named, falsifiable
  hypotheses** (belief + "how we'd know we were wrong" test criteria), and a
  journey **anchored to verbatim user quotes**. That specificity — named bets,
  real numbers, actual quotes, the *why* — is the bar. A page that only shows
  *that work happened* (images + generic captions) has failed this section.
- Pull frameworks, figures, decisions, and quotes **verbatim from the source**
  (deck / board / report / Notion). Reconstruct diagrams as markup where it
  reads crisper; use exported images for rich mind-maps, wireframes, renders.

### Page IA, in order
1. `.hero` (§4)  2. narrative `.sec` blocks (§4c)  3. cut cross-link (§5, if cuts)
4. dark `.sec.takeaways` (§4b)  5. `.cs-closing` with `cs-next` (§4b)  6. foot.
Cuts: `.hero` → narrative `.sec` → bottom `.cta-row` (no takeaways, no cs-closing).

## 5. How the pieces connect (cross-linking — observed in agemo + rachna)

A study + its cuts form one object. The wiring is **bidirectional**, and the
mains form a **chain**. This is the real pattern in `agemo.html` /
`rachna-nivas.html` and their cuts — match it, don't reinvent it.

### Main → its cuts (two accepted patterns, pick one)

- **Fixed `cuts-switch` pill** (rachna) — placed immediately after `<body>`,
  *before* the nav, so it floats with the page:
  ```html
  <div class="cuts-switch" id="cutsSwitch">
    <span class="cuts-switch-label">prefer the short version?</span>
    <a class="cuts-switch-btn" href="rachna-nivas-cut-story.html">story cut</a>
    <a class="cuts-switch-btn" href="rachna-nivas-cut-brand.html">brand cut</a>
  </div>
  ```
- **Takeaways CTA pair** (agemo) — inside the dark `takeaways` section, after
  the takeaway list, a pair of `takeaways-cta` buttons (second one tinted to
  the sibling cut's accent), with a hand-note:
  ```html
  <a class="takeaways-cta" href="agemo-cut-research.html">see the research cut →</a>
  <a class="takeaways-cta" href="agemo-cut-interface.html" style="background:var(--cyan);…">see the interface cut →</a>
  <!-- hand-note: "two takes on the same project, in 30 seconds each" -->
  ```

### Each cut → its main + its sibling (always both)

- **Top back-tag** — a small labelled link back to the main, near the hero.
  rachna: `<a class="proto-tag" href="rachna-nivas.html">brand cut · v1</a>`.
- **Bottom `.cta-row`** — the canonical end-of-cut pair:
  ```html
  <div class="cta-row">
    <a class="cta cta-primary" href="<main>.html">see the full case study →</a>
    <a class="cta cta-ghost" href="<sibling-cut>.html">jump to the <sibling> cut →</a>
  </div>
  ```

### The main → next study (the chain)

Every main ends its `cs-closing` with a `cs-next` to the **next** case study,
so the studies read as a browsable sequence:
```html
<a class="cs-next" href="convegenius.html">next case study: convegenius <span class="arrow">→</span></a>
```
Current chain order (keep it intact when inserting a study): …agemo → convegenius
→ klydo → … → rachna-nivas → tatsam → …. Cuts do **not** appear in the chain
(they're `noindex` and reached only from their main).

### Rule of thumb

- The **main** points *out* to its cuts (pill or takeaways pair) and *forward*
  to the next study (cs-next).
- Each **cut** points *back* to its main (top tag + bottom primary CTA) and
  *across* to its sibling (bottom ghost CTA).
- Mirror the main's scaffold in the cut so the set feels like one object; shift
  the cut's accent to its lens colour (research = yellow, product/interface =
  cyan, etc.) to signal which cut you're in.

## 6. Sourcing workflow (Figma / boards / Notion)

1. **Figma** — pull content via `mcp__figma__get_figma_data` (fileKey + nodeId
   from the URL). Per the project rule, the **`joyus-architect`** agent is the
   designated Figma consumer; batch/cache to respect rate limits. Large files
   exceed context — fetch saves to a tool-results file; have a subagent read it
   in chunks and return a **verbatim** structured extraction (don't summarize
   away the real wording).
2. **Boards (FigJam)** — same call; sticky/section text comes back in `name:`/
   `text:` fields. Capture goals, participants, every sticky, and any
   matrix/axis structure (from `locationRelativeToParent`).
3. **Notion** — token at `.site-rebuild/notion.env` (gitignored), used via the
   REST API (no MCP server). Pull the page + child blocks.
4. **Images** — export the deck's *diagrams/mind-maps/wireframes* (not text
   slides) with `mcp__figma__download_figma_images` into
   `images/work/<slug>/`. Name them by content (`cg-rewards-taxonomy.png`,
   `cg-effort-frequency-matrix.png`). Reconstruct sticky-note boards as clean
   `cs-` layouts instead of exporting the raw board.

## 7. The narrative-body primitive kit

The middle is bespoke per study, assembled from these reusable blocks (defined
in `styles.css`; see real usage in `convegenius.html` / `rachna-nivas.html`):

| Block | Role |
|---|---|
| `.cs-slide` (+ `.alt`) | A narrative "slide" section — the workhorse unit |
| `.cs-slide-eyebrow` | Small label above the slide headline |
| `.cs-slide-headline` | The slide's claim (a sentence, not a noun) |
| `.cs-intro` / `.cs-sub` | Lead paragraph + supporting paragraph |
| `.cs-bridge` | One-line connective tissue between slides ("↓ goals set — now how do we hit them?") |
| `.cs-matrix` (`.cs-matrix-col/-header/-body/-pill`) | Two-column comparison (e.g. Growth vs Engagement) |
| `.cs-cluster` (`.cols-2/-3/-4`) + `.cs-fig` (`.phone`) | Figure grid for images/notes; `.cs-note` captions |
| `.cs-flow-diagram` (`.cs-flow-row`, `.cs-pink-box`, `.cs-flow-arrow`, `.cs-flow-pills`) | User-flow / IA diagrams in markup |
| `.sec` (+ page modifiers like `.premise`, `.work-section`) | rachna/agemo's narrative section primitive |

Rule of thumb: **reconstruct source diagrams as markup** (matrices, flows,
pill lists) where it'll read crisper than an image; **use exported images** for
rich mind-maps, wireframes, and lifestyle/brand renders.

## 8. Wiring a new (or newly-live) case study

- **Status:** unpublished studies point to `coming-soon.html` (in
  `work/index.html` tiles and in `intent-box.js` `CONTENT_MAP`). When a study
  goes live, switch its tile to a real `<a href>` and its CONTENT_MAP rows to
  the real URL. (Live as of this writing: agemo, rachna-nivas.)
- **Sitemap:** add `work/<slug>.html` and each cut to `sitemap.xml`
  (case studies ~0.7, cuts ~0.7).
- **Search:** case studies surface via `intent-box.js`; cuts usually don't get
  their own CONTENT_MAP rows (the main carries the search intent).
- **Chrome:** include the NAV/FOOT markers and run `node scripts/sync-chrome.js`.

## 9. Ship checklist

- [ ] Hero: question-headline, 3-para lede, meta-bar with real facts
- [ ] Body built from source only; framework vocabulary preserved; copy trimmed
- [ ] Decorative `cs-dots` per section, varied placement, token colours
- [ ] Cuts (if any) created, cross-linked both ways, consistent accent logic
- [ ] `.cs-closing` with provocation + `cs-next` to the next study
- [ ] NAV/FOOT markers present; `sync-chrome.js` run
- [ ] `images/work/<slug>/` populated; alt text on every image
- [ ] canonical + og:url + JSON-LD url correct for the slug
- [ ] sitemap.xml updated; work/index.html tile + CONTENT_MAP status correct
- [ ] reads true to the people who did the work
