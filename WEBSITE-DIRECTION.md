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
