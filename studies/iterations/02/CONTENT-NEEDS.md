# Homepage rebuild — what I understood, and the content it needs

_Divya + Claude, 2026-09-22 (rev 4). Branch `divya-sep22-home-wireframe`. Wireframe at `studies/iterations/02/rev4.html` (moved 1 October from `wireframe/index.html`; open Study 02 via `node studies/server.cjs` → http://localhost:8794/studies/). Nothing here touches the live site._

---

## 1. What I understood

**The brief.** The current site doesn't feel like Joyus. Rebuild the homepage as one full-width page, on a branch, wireframe first, content second, no deploy.

**The page, top to bottom:**

| # | Block | What's in it |
|---|---|---|
| 01 | Hero | Left, with a lot of air around it: **"We reimagine ___"**, the blank filled by the current pill, and a short description. Right, same row: the **newsletter** signup. "Joyus Studio" is not the headline; the wordmark carries the name. |
| 02 | Pills | One row, no dividers: **Brand & Identity · Website & Product · Strategy · Storytelling · Experiments**. |
| 03 | Panel | Full width, image 70 / text 30. The text is one sentence: **"For [client], we [did the thing]."** Then tags, then the client logo and name at the bottom. No link label; the panel is the link. |
| 04 | Who we've worked with | Just logos. |
| 05 | Footer | Wordmark, say hi, find us. |

**It moves.** The page rotates on its own: every ~5 s the next pill lights up, the blank in the headline changes, and the panel shows that pill's current piece. After a full lap (all five pills), every pill steps to its **next** piece, so the second time round Website & Product shows Klydo · product instead of EWC · website, and so on through everything. Clicking a pill jumps to it and pauses the rotation for 15 s; clicking the already-active pill steps it to its next piece. The active pill has a thin progress line so the timing is visible. Respects reduced-motion.

**One page per piece of work, not per client.** Klydo isn't one case study with sub-sections; Klydo branding, product, design, marketing, pivot support, strategy, storytelling are each their own page. The rotation is how every piece gets its turn on the homepage.

**Two axes.** Pills are the coarse axis. Tags on the panel are the fine axis (what it involved, plus client work / personal exploration / artistic project).

**Historical layers.** The Everything Bazaar numbered-rail idea is off the homepage. Its likely home is each piece's page, told as numbered rounds with nothing replaced. Parked until piece pages are wireframed.

**Off the homepage.** Who we are and the contact form live at about / say hi, linked from nav and footer.

**What I'm explicitly not doing.** Not designing. Not touching `index.html`. Not merging. The only copy I wrote is the "For …, we …" sentences in §5, which Divya asked for, knowing they're drafts.

---

## 2. Order of pieces per pill, and why

First piece under each pill is what a visitor sees before anything rotates, so those five are the picks that matter.

| Pill | First piece | Why first | Then, in order |
|---|---|---|---|
| Brand & Identity | Klydo · branding | Most complete brand work in the repo. | Secret Senses · identity + packaging → Tatsam · brand → Gliitch → XTDB → Agemo · brand voice |
| Website & Product | EWC · website | Only finished website on the mind map. Zero assets in the repo, so a bet. | Klydo · product → Agemo · product design → Klydo · design → Tatsam · product → ConveGenius · gamification → Shapeshifter · AI system → Rachna Nivas · website (soon) |
| Strategy | Pratham USA · retention strategy | Full case study, strategy with a number in it. | Klydo · strategy → Pratham · donor research → Klydo · pivot support → ConveGenius · strategy → Agemo · product strategy → Klydo · marketing → Rachna Nivas · consulting |
| Storytelling | TomboyX · investor storytelling | Divya's own example. | Rachna Nivas · brand storytelling → EWC · branding storytelling → Klydo · storytelling → Tatsam · pitch |
| Experiments | Metro Museum of the Forgotten | Only experiment with something renderable today. | Poetic lineage explorer → Comics → Projection mapper → AI videos for poetry → Brand Studio → Art stager → AI personal automation → Line before → Everything Bazaar |

**Placement calls I made that are arguable:** Klydo · marketing sits under Strategy (could be Storytelling). Klydo · design sits under Website & Product (could be Brand & Identity). Shapeshifter sits under Website & Product (the mind map has it under client work with no category). Tatsam · pitch sits under Storytelling.

**Wrong turn, kept for the record.** Rev 1 picked Secret Senses first for Brand & Identity, then swapped to Klydo because the old model rewarded "one client, many tags". The rotating model makes the order matter less than the set, so Secret Senses is second and gets its turn.

---

## 3. Content needed, block by block

Status key: **have** · **partial** (exists, needs export/edit) · **missing** · **decide**.

### §01 Hero

| Item | Status | Owner | Notes |
|---|---|---|---|
| Headline verb: "We reimagine" | decide | Kahran + Divya | Placeholder. Must survive all five fills. |
| Blank-form per pill | draft | Kahran | Currently: brand & identity / websites & products / strategy / stories / whatever we're curious about. |
| Description, 2 lines max | missing | Kahran + Divya | Candidates: "Advisory & Design Studio"; "We think with everyone. We build with a few."; the July spine in `POSITIONING-2026-07-20-moments.md`; "projects that'll haunt you" in `WEBSITE-DIRECTION.md`. |
| Dwell time per pill | decide | Divya | 5 s in the wireframe. Sentences are ~25 words; 5 s is the minimum to read one. |
| Newsletter name, one line, frequency | missing | Both | "Quarterly" per brief. |
| Newsletter platform | decide | Divya | Static site on GitHub Pages: Buttondown (plain HTML form, least work), Substack embed, Mailchimp, or Firestore like the intent box. Recommend Buttondown. |
| Privacy one-liner | missing | — | |

### §02 Pills

| Item | Status | Notes |
|---|---|---|
| Labels | have | Brand & Identity · Website & Product · Strategy · Storytelling · Experiments (Divya, 2026-09-22). |
| Wordmark | have | `images/logo.webp` |

### §03 Panel (×37 pieces, see §5)

| Item | Status | Owner | Notes |
|---|---|---|---|
| One image per piece, 16:9 | partial | Divya | Existing: `images/work/{klydo,agemo,tomboyx,pratham,tatsam,convegenius,rachna-nivas,secret-senses,gliitch,xtdb}/`. Missing entirely: EWC, Shapeshifter, all experiments. One chosen still per piece, not a folder. |
| "For …, we …" sentence | draft | Kahran to edit | All 37 drafted in §5. Bracketed bits are unknowns. |
| Tags | draft | Divya | In §5. Final vocabulary in §6. |
| Client logo (mono) | missing | Divya | Name is the fallback and is already in place. |
| Year per piece | missing | Both | Nothing on the site dates a piece reliably. |
| Piece page to link to | missing | — | None exist yet. |

### §04 Who we've worked with

| Item | Status | Owner | Notes |
|---|---|---|---|
| Logo files, mono-friendly | missing | Divya | Klydo, TomboyX, Agemo/Codewords, Pratham USA, ConveGenius, Rachna Nivas, Tatsam, XTDB, Gliitch, Secret Senses, EWC. |
| Permission per logo | decide | Kahran | TomboyX (down round), anything under NDA. Klydo's strategy cut is anonymised today. |
| Include pre-Joyus clients? | decide | Both | Wireframe includes them. |
| Heading wording | missing | Kahran | |

### §05 Footer

| Item | Status | Owner | Notes |
|---|---|---|---|
| Contact route: form vs email link | decide | Both | `say-hi.html` exists. |
| Where "Who we are" lives | decide | Both | Assumed `about.html`, rebuilt later. |

---

## 4. Open questions

1. **Service-shaped pills vs the July positioning.** `POSITIONING-2026-07-20-moments.md` says "do NOT organise by service." Five service pills do exactly that. Needs the two of you.
2. **What EWC stands for.** I wrote "East West [EWC]" from what Divya said aloud. Confirm the name and what the four pieces actually were.
3. **The unknown experiments.** Brand Studio, Art stager, AI personal automation, Line before, contacts, photso: I don't know what they are, so their sentences carry brackets. Contacts and photso aren't in the rotation at all yet.
4. **Which clients can be named.** Logo wall, Klydo anonymisation.
5. **The intent box.** This page replaces the typewriter homepage; `looking.html` and `intent-box.js` move or retire.
6. **Where the historical-layers idea lands.** Proposed: the piece pages.

---

## 5. The pieces, with draft sentences

Every row is a page that doesn't exist yet. Sentences are the exact text in the wireframe's data. **Grounding:** ✔ = from a case study on the site · ◐ = from the mind map only, wording is mine · ✖ = I don't know what this is.

### Brand & Identity
| Client · piece | Sentence | Tags | Grounding |
|---|---|---|---|
| Klydo · branding | For Klydo, we built the brand for a 15-minute fashion-delivery startup, from name to launch, while the company went from four people to a million orders. | branding · identity · client work | ✔ |
| Secret Senses · identity + packaging | For Secret Senses, we drew the identity, illustrations and packaging for an Indian hair-care brand. | identity · packaging · illustration · client work | ✔ |
| Tatsam · brand | For Tatsam, we built the brand of a workplace-wellbeing company around one belief: grow people's strengths, don't catalogue their deficits. | branding · client work | ✔ |
| Gliitch · identity | For Gliitch, we made a vibrant identity for a Hong Kong digital provider to small restaurants. | identity · client work | ✔ |
| XTDB · visual identity | For XTDB, we gave a time-focused database a visual identity that could sit next to the engineering. | identity · client work | ✔ |
| Agemo · brand voice | For Agemo, we built the brand voice for a GenAI product that had no precedent to sound like. | brand voice · client work | ✔ |

### Website & Product
| Client · piece | Sentence | Tags | Grounding |
|---|---|---|---|
| EWC · website | For East West [EWC], we designed and built the website and the funnel behind it, with the artifacts a visitor needs on the way to a yes. | website · funnel · client work | ◐ |
| Klydo · product | For Klydo, we designed the product that carried the 15-minute promise from a pitch deck to a million orders. | product · client work | ✔ |
| Agemo · product design | For Agemo, we drew eight hypotheses twenty-six times to find the interface for a GenAI product nobody had seen before. | product design · research · client work | ✔ |
| Klydo · design | For Klydo, we ran design across 120 days and 30 artifacts, from the packaging to the app. | design · client work | ✔ |
| Tatsam · product | For Tatsam, we designed the product that turned a wellbeing philosophy into something a team could use every week. | product · client work | ✔ |
| ConveGenius · gamification | For ConveGenius, we turned a request for a rewards layer into a gamification system grounded in what students actually do. | gamification · product · client work | ✔ |
| Shapeshifter · AI system + automation | For Shapeshifter, we built the AI system that turns a conversation into a proposal, and the automation around it. | AI system · automation · client work | ◐ |
| Rachna Nivas · website (soon) | For Rachna Nivas, we're building the website that carries a Kathak soloist's work beyond the studio. | website · client work · soon | ◐ |

### Strategy
| Client · piece | Sentence | Tags | Grounding |
|---|---|---|---|
| Pratham USA · reactivation & retention strategy | For Pratham USA, we worked out why donors give once and stop, and designed the strategy to bring them back and keep them. | retention · strategy · client work | ✔ |
| Klydo · strategy | For Klydo, we ran the leadership offsite that found the thesis underneath the delivery channel. | strategy · offsite · client work | ✔ |
| Pratham USA · donor research | For Pratham USA, we mapped the donor journey and audited every touchpoint to find where to invest next. | research · service design · client work | ✔ |
| Klydo · pivot support | For Klydo, we stayed through the pivot, helping the team decide what to keep and what to let go. | pivot support · client work | ◐ |
| ConveGenius · strategy | For ConveGenius, we set the strategy that decided what the rewards layer was actually for. | strategy · client work | ✔ |
| Agemo · product strategy | For Agemo, we set the product strategy for a GenAI startup with nothing to copy. | product strategy · client work | ✔ |
| Klydo · marketing | For Klydo, we ran marketing as experiments, three Instagram tests in fourteen days, to learn what the brand could say. | marketing · experiments · client work | ✔ (number is from the strategy cut; verify) |
| Rachna Nivas · consulting | For Rachna Nivas, we spent nine months of strategic coaching giving her work a form that could leave the studio with her. | consulting · coaching · client work | ✔ |

### Storytelling
| Client · piece | Sentence | Tags | Grounding |
|---|---|---|---|
| TomboyX · investor storytelling | For TomboyX, we rewrote the story of a beloved underwear brand for three different investor rooms, in a down round. | investor storytelling · client work | ✔ |
| Rachna Nivas · brand storytelling | For Rachna Nivas, we found the story of a Kathak soloist's work so her photographers, editors and apprentices could carry it. | brand storytelling · client work | ✔ |
| EWC · branding storytelling | For East West [EWC], we wrote the brand story that the website and the funnel are built on. | brand storytelling · client work | ◐ |
| Klydo · storytelling | For Klydo, we wrote the story the team told itself, then investors, then a million customers. | storytelling · client work | ◐ |
| Tatsam · pitch | For Tatsam, we built the pitch: the research, the brand and the product told as one argument. | pitch · storytelling · client work | ✔ |

### Experiments
| Piece | Sentence | Tags | Grounding |
|---|---|---|---|
| Metro Museum of the Forgotten | For ourselves, we built a museum of things people left on the Delhi Metro, as a game, from the real lost-and-found records. | artistic project · game · data | ✔ (repo) |
| Poetic lineage explorer | For a demo, we built a poetic lineage explorer that traces who a poem learned from. | personal exploration · tool | ◐ |
| Comics | For ourselves, we make comics: Kahran writes the storylines, Divya draws them. | artistic project · comics | ✔ |
| Projection mapper | For a demo, we built a projection mapper to throw drawings onto real rooms. | personal exploration · tool | ◐ |
| AI videos for poetry | For ourselves, we turn poems into video with AI, one poem at a time. | artistic project · film | ◐ |
| Brand Studio | For a demo, we built Brand Studio, [what it does, in one clause]. | personal exploration · tool | ✖ |
| Art stager | For a demo, we built Art Stager, [what it does, in one clause]. | personal exploration · tool | ✖ |
| AI personal automation | For ourselves, we built a personal AI automation [for ADHD: what it does, in one clause]. | personal exploration · automation | ✖ |
| Line before | For ourselves, we made Line Before, [what it is, in one clause]. | artistic project | ✖ |
| Everything Bazaar | For ourselves, we invented five brands and art-directed a billboard for each, one still at a time, in Blender. | artistic project · research | ✔ (repo) |

Not yet in the rotation: **contacts**, **photso** (on the mind map, unknown to me).

**37 pieces** → roughly 37 piece pages, plus whatever Tatsam splits into. Each needs image, sentence, tags, client, year and a body.

---

## 6. Draft tag vocabulary (to be pruned)

**Work tags:** branding · identity · packaging · illustration · brand voice · website · funnel · product · product design · design · research · gamification · AI system · automation · strategy · product strategy · retention · service design · pivot support · marketing · experiments · consulting · coaching · offsite · investor storytelling · brand storytelling · storytelling · pitch · game · data · tool · comics · film

**Kind tags:** client work · personal exploration · artistic project · soon

**Era tags (piece pages only):** before joyus · in joyus · alongside
