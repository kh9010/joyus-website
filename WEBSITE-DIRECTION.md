# Website direction — where we're taking it

_Divya's brief, 2026-06-30. Kahran — take this from the repo when you next work on it._

The headline: **the site doesn't have an anchor**, and that's the main thing missing. So we don't start by redesigning pages — we start by finding the anchor, and we let the anchor decide what the pages become. Two phases.

---

## Phase 1 — Anchor workshop (do this first)

A working session to define the site's center of gravity. It is **not just** "name the anchor." The workshop has to come out the other side with real answers to:

1. **What is the anchor?** The center of gravity that everything else hangs off — the one thing the whole site is about. Right now we don't have one.

2. **What makes sense to combine into what?** The merges below are *candidates*, not decisions. The workshop decides whether they actually combine, and how.

3. **What would those final pages actually be like?** Not just "merge these two" — what is the resulting page, what does it say, what's its shape.

**The point: don't pre-decide the merges.** They go *into* the workshop as raw material. The workshop comes *out* with the anchor + the final page architecture + what each page becomes.

---

## Phase 2 — Execute what the workshop decided

Everything here flows from Phase 1's answers. Captured as candidates / raw material for the workshop to resolve:

### Candidate: Work + Services + Workshops → one
Right now these are three separate destinations. They might become a single thing that just says **"these are the things we do — this is what you came here for."** Facets of one answer, not three pages. Goal: clarity and simplicity.
- _Affected:_ `services.html`, `work/` (index + case studies), `ai-workshops.html`

### Candidate: About + Say Hi → one, much smaller
Combine who-we-are with how-to-reach-us, and **cut it way down.** Small, warm, quick.
- _Affected:_ `about.html` + the say-hi / contact path

### Homepage search action → simpler
The intent/search interaction on the main page needs to be **a lot simpler and more understandable.** It feels a bit broken right now; using it should be obvious.
- _Affected:_ `index.html` + the intent box (`intent-box.js`, `looking.html`)

### Case studies → shorter, with a specific voice
They've gone in a **weird, long-winded direction.** They need to become a lot simpler and carry a **recognizable point of view** running through them. Less length, more spine.
- _Affected:_ all of `work/*.html`

---

_Bottom line: name the anchor first. Then items above stop being a guess and become a plan._

---

## Candidate anchor — the realization

_Kahran + Claude, 2026-07-06, after re-reading Divya's brief above + the mar26 work deck._

**We hold the whole picture of where something fits — and then meet each surface with the right facet of it.**

That's the key understanding. Not a service list, not a discipline — the thing underneath all of it is that we see the whole, and everything we make is one face of that whole, chosen for the surface in front of us.

It's already how the deck works, we just never named it:
- **TomboyX** — same company, three different decks because the surface changed (emotional early investors / operator-angels who want numbers / syndicate LPs who need to feel like "their people").
- **Tatsam** — one understanding shown through visual language, brand, product, and research.

The site feels un-anchored because its structure (Work / Services / Workshops / About as separate destinations) says the opposite — it presents the facets as if they were different things, instead of faces of one whole.

---

## Anchor decision — lead with desire, understanding is the spine

_Kahran's direction, 2026-07-13 (to confirm with Divya before it's final)._

The fork we'd been sitting on — does the site **lead** with "one understanding, many facets," or with "projects that'll haunt you until they're made"? — resolves into **both, at different layers:**

- **Desire leads the surface.** "Projects that'll haunt you until they're made" is what a visitor meets first — the voice, the hook, the emotional door. We open with *want*, not with competence. It's the more alive, more provocative line, and it belongs at the front.
- **Understanding is the spine.** "One understanding, many facets" stops being the headline and becomes the **architecture** — the organizing principle underneath. It's the *reason* Work / Services / Workshops collapse out of separate destinations into facets of one thing: they genuinely are faces of a single act of understanding (see the realization above). A visitor may never read the word "understanding," but it's the load-bearing wall every page hangs off.

So: **the haunting line is the entrance; understanding is the structure.** This gives the Phase-2 page merges a *principled* basis instead of a cosmetic one — pages combine because they're facets of one understanding, while the front-of-house voice leads with the desire that makes someone want to walk in.

_Next: Divya to confirm / refine, then this is the brief the Phase-2 page rebuild executes against._

---

## Open questions from the audit (2026-07-06)

_An ultracode audit of the whole site ran 2026-07-06. The **mechanical fixes** (XSS guard on `looking.html`, focus-ring contrast, intent-input length cap, truncated theme-music URLs on 19 episode pages, comics-lightbox keyboard access, sitemap canonical-form, a stale-CLAUDE.md refresh) were applied on branch `kahran-jul06-audit-fixes`. The items below are **design / content / link decisions** — they need Kahran + Divya to choose, ideally folded into the rebuild rather than patched piecemeal. Several tie directly to the anchor above: the site currently spends crawl budget and design attention on pages that contradict the "two live case studies, one understanding" positioning._

**1. The 25 de-listed pages — noindex or bring back? (biggest one.)**
The 2026-05-29 launch trim pulled 10 case studies + 15 thinking essays out of the sitemap and nav, but never `noindex`'d them — so Google still serves them, including the ones CLAUDE.md flags as visually broken (secret-senses, tomboyx). Two clean options per page: (a) `noindex` them (matching how the hubs were retired), or (b) decide they're launch-worthy and give them a real home + sitemap entry. Right now they're in limbo — a shadow site that contradicts the "agemo + rachna only" positioning. _Sub-question: the root stubs `klydo.html`/`convegenius.html` still canonicalize INTO the hidden pages — repoint to `/work/`?_

**2. The 15 thinking essays specifically.** They're real published writing, zero inbound links, zero sitemap entries — reachable only via stale `/musings/` redirects that dump visitors onto an unstyled WIP page with no way back. If the essays matter (they're strong podcast-derived pieces), they want a `thinking/` index + entry points (footer? hub? podcast cross-links). If they don't, note the deliberate de-listing so nobody "fixes" it later. **This is a content-strategy call, not a bug.**

**3. `ai-workshops.html` + `workshops-investing-c.html` — finish or hide?** Both are in the sitemap (so search sends people there) but `ai-workshops.html` still wears the yellow "WIP — to be redesigned" banner and `workshops-investing-c.html` is orphaned (no inbound links). Either finish/link them or drop them from the sitemap until they're ready. Ties to the "merge Workshops into the whole" question in Divya's brief.

**4. Homepage intent-box keyboard/screen-reader support (the one high-severity finding).** The safe half is fixed (invisible suggestion links no longer trap keyboard focus). The full fix — arrow-key navigation through suggestions + proper ARIA combobox roles so screen readers announce them — is an **interaction redesign** of the box, so it's parked here rather than hacked in. Worth doing whenever the homepage search gets its "simplify" pass (also in Divya's brief).

**5. Comics print-interest form: restore or remove?** All 5 comic pages ship the CSS + JS + ~230KB of Firebase for a print-interest email capture, but the actual `<form>` markup is gone — so the feature silently collects nothing. Either restore the form (it's a real lead-capture for print runs) or strip the dead weight from all five. Product call: do we still want to gauge print interest?

**6. Footer text contrast (design-token call).** Footer copyright + the footer "say hi" link use `--ink-fade` (#8892A0), which fails AA contrast on the paper background on every page. Nudging the token darker (or using `--ink-soft` for footer links) fixes it site-wide but shifts a brand color slightly — so it's Divya's call, not a silent edit.

**7. Small SEO follow-ups** (low stakes, listed so they're not lost): `work/rachna-nivas.html`'s `og:image` is a 5.4MB PNG that exceeds Twitter/WhatsApp's share-card limit (needs a ~1200×630 <300KB export — one of only two promoted case studies); and 4 live-linked podcast collection pages (`archive`, the 3 series hubs) are missing from the sitemap.
