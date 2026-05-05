# Case-study algorithm — abstracted from the Agemo rebuild

This is the process we landed on after four passes on `work/agemo.html`
(commits 68b49e0 → cfb82cd → 856ee63 → dd89fac → 71a03b4). It is a
recipe, not a template — the *shape* changes per project, but the
sequence of decisions does not.

## 0. Premise

A case study is not a recap. It is **the design crit, performed for the
reader**. The page should make the reader *feel* the constraints that
forced the design, not just display the result. Every interaction on the
page is a re-enactment of a decision the team actually had.

---

## 1. Find the artifacts. All of them.

Before writing a single line of HTML, pull every artifact we have:
- the founder's pitch deck
- the hypothesis doc
- raw user-research notes (verbatim quotes, not paraphrases)
- naming brainstorm boards
- iteration timelines (every version, not just v1 and final)
- info-flow diagrams, persona maps, journey maps
- production frames

For Agemo: 1 PowerPoint (8 hypotheses), 4 Figma files (UXR analysis,
journey board, naming brainstorm, production UI). Every claim on the
final page traces back to one of these — listed in the Sources section
at the bottom. If we can't cite it, we don't say it.

**Rule:** the page is a derivative work of *real* artifacts. No
fabricated numbers, no invented quotes. If the team didn't say it, we
don't put it in their mouth.

---

## 2. Pick the thesis sentence.

One sentence the whole page argues. It is usually a tension the team
lived with — not a brag.

For Agemo:
> "8 bets, drawn 26 times."

That sentence dictates everything below it: hypotheses come early
(because we're showing bets), iteration count is foregrounded (because
we drew them 26 times), and the final coda has to land on what those
bets cost or earned.

**Rule:** if a section doesn't serve the thesis sentence, cut it. Two
unrelated thesis statements means two case studies, not one.

---

## 3. Sketch the section spine. Then halve it.

First pass: list every section we *could* have. For Agemo r1 the spine
was 16 sections including a faux Procreate UI, a REC-HUD blink, a peel
mechanic, a Show-all exploded fan, a v1↔v5 morph compare, a separate
Layers section, a chapter-coloured tick scrubber, an auto-play, and a
T-junction with rails.

Then **kill** anything that:
- is interaction for interaction's sake (the peel mechanic, the
  exploded fan)
- requires explanation before it pays off (the T-junction rails, the
  chapter tick colours)
- duplicates another section's job (the separate Layers section
  duplicated the Architect annotated screen)
- belongs to *our* aesthetic, not the project's (Procreate dark panels
  on a tool that doesn't look like that)

cfb82cd cut Agemo from 1682 → 941 lines (44%). Then we earned new
length back when adding the **right** content (verbatim quotes, persona
spectrum, info-flow SVG). Final ≈ 1632 lines.

**Rule:** start over-built, then aggressively kill. It is much harder
to add tension than to remove ornament.

---

## 4. Order the sections as an argument, not a chronology.

The natural temptation is to tell the project chronologically: brief →
research → ideation → design → ship. That reads as a deck, not a
crit.

Instead, structure as **argument**:
1. Hero — the bet (thesis sentence + one number)
2. Brief — the *real* problem behind the brief (often inverts what the
   client said)
3. Audience — who specifically, on what axis (rejects the everyone-fits
   persona)
4. Voice — verbatim user quotes, dense, repetitive on purpose (lets
   the reader feel the pattern)
5. Synthesis / hypotheses — what we believed, made falsifiable
6. Journey — how the belief plays out across the user's actual flow
7. Naming + tagline — the words we tried (with a live mechanism the
   reader can play with)
8. Info flow — the engineering shape of the bet, drawn before code
9. What shipped — annotated production screens with hotspots back to
   the hypotheses (closes the loop)
10. What landed — three signature interactions, each tied to a
    specific user complaint from §4
11. Takeaways — universal lessons, written as imperatives, not platitudes
12. Sources — every artifact, by Figma file ID

Each section is a step in the argument. Each section's interactivity
re-enacts the moment in the design process where that step happened.

**Rule:** if you remove section N and section N+1 still flows, section
N is decoration.

---

## 5. Pick one interaction per section. No more.

Every section gets *one* interactive idea. Stack two and the reader
loses the point of either.

Agemo final:
- Hero — pulse dot + drifting hero-dots (ambience only)
- Persona spectrum — staggered chip-in animation along the proficiency axis
- Voice — masonry of verbatim quote cards (no JS, just visual density)
- Hypotheses — 8 cards, each with falsifier microcopy
- Tagline — a slot machine running the team's actual bracket grammar
- Info flow — SVG that draws itself in stagger order
- Annotated screen — hover hotspots that surface which hypothesis a
  pixel implements
- What landed — 3 cards, each tied back to a named user from §4

Things we tried and cut: peel mechanic on the architect screen, v1↔v5
morph comparator, exploded layer fan, REC-HUD blinking corner, faux
Procreate toolbar, auto-play timeline, chapter-colour ticks. All cool;
none essential.

**Rule:** a single, well-tuned interaction beats five half-tuned ones.
If two interactions live in the same section, one of them is a sketch
that didn't get cut yet.

---

## 6. The cuts (always do these, every time)

These are the kills that recurred across every Agemo pass, so codify:

| Cut | Why |
|---|---|
| Faux toolbars / chrome of other tools (Procreate, Figma, ChatGPT) | Steals the project's look. Ours is paper-and-ink. |
| Auto-playing scrubbers / timelines | Reader can't pause to read. Becomes ambient noise. |
| Per-keyframe coloured ticks | Looks like data, encodes nothing. |
| "Show all" exploded views | Spectacle without insight. The annotation is the value. |
| Dark mode for one section | Breaks the rest of the page's contrast contract. |
| Comparators (v1↔v5 morph) | Implies "look how far we came." A crit shows the *current* decision, not the journey. |
| Long descriptive paragraphs in section headers | Reader skips them. Use a short deck (≤2 sentences) and let the artifact do the work. |
| Generic stock-y stat numbers ("100+ interviews") | The specific number ("11 interviews, the same theme") is more honest. |
| "What we learned" / "Lessons" written as platitudes | Either omit, or write them as imperatives that another team could use tomorrow. |

---

## 7. Make the page citable.

Final section is always **Sources**. List every artifact by name and
Figma file ID. This does three things:
- forces us to actually have artifacts (no Sources section means no
  case study)
- earns the reader's trust (they can verify anything)
- gives us a pre-built defense against "did you make this up?"

For Agemo the Sources block lists 5 files: 1 PPT + 4 Figma file IDs,
each with the relevant section ID where the page draws from.

---

## 8. Build a long version and a short version. Cross-link them.

Some readers want the 30-second version. Some want the full crit.
Build both, link them from each other, don't apologize for either.

Agemo final:
- `work/agemo.html` — the full case study (≈1630 lines, 12 sections)
- `work/agemo-cut-research.html` — 30-second ambient/textural cut,
  research-led
- `work/agemo-cut-interface.html` — 30-second polished/product-led cut

The full case study has a floating "prefer the short version?" pill in
the top-right that switches to either cut. The cuts link back.

**Rule:** the cuts are not "lite" versions. They are *different
arguments* for the same project — research-cut foregrounds the user
voice; interface-cut foregrounds the bracket grammar and the architect
screen. A reader who watches both should learn different things.

---

## 9. Iterate by browser, not by static reasoning.

This is the lesson R4 taught (logged in `CLAUDE.md` under "R4 case-study
rebuild — current state"). Static reading of HTML/CSS/JS will tell you
a fix is *plausible*. It will not tell you whether the timing, race, or
geometry actually resolves in a real browser.

**Rule:** when fixing runtime behavior (animations, scroll-pinning,
intersection triggers, pointer events), open the page in a browser
yourself or get a console paste from the user. Don't ship a "high
confidence" static fix on a runtime bug.

---

## 10. Process loop, summarized

```
1. Pull every artifact. Refuse to write what you can't cite.
2. Write the thesis sentence. One.
3. List every section you might want. Then halve it.
4. Order the surviving sections as an argument, not a chronology.
5. Assign one interaction per section. Cut the spares.
6. Apply the standing cuts list (§6) — every time, no exceptions.
7. Add the Sources section. If it's empty, the page isn't ready.
8. Build a 30-second cut alongside the full version. Cross-link.
9. Verify in a browser. Static reasoning is not enough for runtime bugs.
10. Ship to main as one focused commit. Each fix is its own commit.
```
