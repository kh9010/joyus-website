# Handoff: Joyus homepage rebuild

Last updated: 28 September 2026. Version 01.

Scope: the homepage rebuild in `wireframe/` only. The rest of the repo is described in the root `CLAUDE.md`. This file sits here, not at the root, because the root is the live site.

## Current goal

Divya, 22 September: the current site does not feel like Joyus. Rebuild the homepage as one full-width page, wireframe first, content second, no deploy. Kahran, 28 September: "I like the way she did this."

Now: Kahran's words on Divya's structure. The 37 panel sentences first.

## Where things stand

| Where | What it is |
| --- | --- |
| `wireframe/index.html` | The rail. Opens on the newest study. |
| `wireframe/iterations/01/` | Divya's wireframe, unchanged. "We reimagine ___", five pills, 37 pieces in rotation. |
| `wireframe/CONTENT-NEEDS.md` | Divya's content ledger: needs per block, owners, open questions, her 37 draft sentences. Still says Experiments; see rules below. |
| `wireframe/lines-draft/` | Draft lines for Kahran's review, one file per pill. On branch `kahran-sep28-home-lines`. Being written on kMini as of 28 September evening; absent until that job lands. |

Branches, none merged to `main`:

- `divya-sep22-home-wireframe`: Divya's original.
- `kahran-sep28-home-iterations`: hers plus the rail and this file.
- `kahran-sep28-home-lines`: the above plus the draft lines.

The live site is untouched.

## Open with Kahran right now

- Review `wireframe/lines-draft/*.md`. Each piece has Divya's draft, three candidates, a suggested pick, the grounding and flags. Pick or rewrite.
- Headline blank per pill. Each draft file proposes alternatives or says keep.
- Which clients can be named: TomboyX (down round), Klydo strategy (anonymised on the site today), anything under NDA.
- Heading for the logo wall.

## Open with Divya right now

- The Curiosities rename and the pills ruling below; she has not seen either.
- Where these branches merge. Her notes say the wireframe is not to be merged to `main`.
- Her own list in `CONTENT-NEEDS.md` §3: images per piece, mono logos, dwell time, newsletter platform, tag vocabulary.

## Rules that came out of this work

- **Service pills stand.** Kahran, 28 September 2026: "yes this is the right positioning." This settles open question 1 in `CONTENT-NEEDS.md`, and overrides "do NOT organise by service" in `POSITIONING-2026-07-20-moments.md` for the homepage.
- **The fifth pill is Curiosities, not Experiments.** Kahran, 28 September 2026. The headline reads "We reimagine curiosity".
- **One page per piece of work, not per client.** Divya, 22 September 2026.
- **Studies follow the snapshot rule.** Anything beyond a copy fix is the next `iterations/NN`; earlier studies stay untouched. Same as the Rachna repo.
- **Lines are one sentence, 25 words at most.** Divya's dwell note: five seconds is the minimum to read 25 words.

## Version 01 in detail

**01 / Rotating pills.** Divya, 22 September 2026. Grey-box wireframe. Hero with the headline and newsletter; five pills; a 70/30 panel; logo wall; footer. Every 5 s the next pill lights and the panel shows that pill's current piece. After each lap of five, every pill steps to its next piece. Clicking a pill jumps and pauses for 15 s. All 37 take ten laps, a little over four minutes. Klydo appears seven times.

Cut from the homepage: who we are, the contact form, the Everything Bazaar numbered rail (parked for piece pages).

## Next version

**02** is Kahran's lines in Divya's structure, with the fifth pill as Curiosities. Build it as a copy of 01 with the `PILLS` data replaced, once he has picked. Add it to the rail above 01.

## Wrong turns worth knowing

- Claude told Kahran he had a branch "not checked out", which he read as a homepage version of his own. He had none; the branch was The Read. Cost: one round trip.
- `claude` on kMini is not logged in over SSH. The drafting job runs as a one-off launchd job instead. Auth protocol: `~/Sync/pending-work/TOPOLOGY.md`.

## Workspace state

Run: `python3 -m http.server 8000` at the repo root, open `http://localhost:8000/wireframe/`.

MacBook worktree: `~/dev/joyus-website/home-iterations`. kMini worktree: `~/Dev/joyus-website-home-lines`.

The drafting job's workspace is `kMini:~/Dev/_joyus-lines-2026-09-28/`, labelled throwaway, with a README. `STATUS.txt` there is the progress log. Delete the directory once the lines are reviewed.

## Verification

No `verify` script yet. When 02 is built, the first checks are: the rail lists every `iterations/NN`, every study opens, every sentence is one sentence of 25 words or fewer, no sentence carries a `[bracket]`.

## Research already captured

The draft lines cite their sources per fact. Sources offered to the drafting agents, 28 September 2026: the case studies in `work/`, the `kh9010/joyus` repo, 534 meeting notes exported from the raw store's granola lane, and the repos of the studio's own projects.

## Open questions

Divya's list in `CONTENT-NEEDS.md` §4, less question 1. Still open: what EWC's pieces were, the unknown experiments, the intent box's fate, where the historical layers land.

None of the 37 piece pages exist. The panel has nothing to link to until they do.

## Working preferences to preserve

- Divya's notes: not designing, not touching the live `index.html`, not merging.
- Anything written as Kahran goes through his voice editor before he sees it.
- Drafts for Kahran to react to, never a blank prompt.
