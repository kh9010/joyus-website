# Study 92: the EWC editing desk (for Kahran to edit 91 a with options)

Kahran picked Study 91 option a ("Six pairs that fit") as "okay for now; I want it a little more clear". He wants to edit it himself, the way he did on kahransingh.com's About desk: "add in a study with options for each question with options on how I might answer them, like what we did for the writing desk."

## The model to copy
`/Users/kahransingh/dev/kahransingh.com/studies/09/` (read build.mjs, desk.js, lines.json, picks.json, index.html) and its HANDOFF note in `/Users/kahransingh/dev/kahransingh.com/HANDOFF.md` ("09, the About desk"). Lines down one side, each with 2-4 options (tap to pick) plus "my own words" (free edit); the live draft of the page beside it, rebuilt from the picks. On a phone (he will use it on his phone): rows stacked, the draft reachable in one tap and readable at full width.

## The page and its lines
Base: `/Users/kahransingh/dev/joyus-site/studies/iterations/91/src/a.html`. One desk row per line of that page, in order, each labelled with which of Divya's reader questions it answers (`studies/sitemap/bet.json`, quote the question in plain words):
1. headline
2. the paragraph (the moving equation)
3. the column labels (who / what)
4. the six pairs (one row per pair is fine, or one row with whole sets; your call, keep it light)
5. the proof
6. a client quote (NEW, optional: include "no quote" as an option)
7. who, how long, what it cost (NEW: duration is "two weeks", Kahran 8 Nov; it is the persona-and-reason piece only)
8. the close

Option sources, for each row: 91 a/b/c/d, 90 a-d, 89 d (`studies/iterations/NN/src/*.html`), Kahran's own frame in `studies/iterations/88/brief.md`, plus a fresh plain-language option where the existing ones are muddy. Option 1 of each row is what 91 a says now. Show each option's source (e.g. "91 d") small.

Proof options (use these):
- "Founding members are signing up ahead of the club's schedule." (91 a, current)
- "Founding members are signing up, with no paid marketing yet."
- a version using quote B below as the proof.

Client quote options (verbatim from the club's founders, transcribed; attribute as "a founder, East West Club" with no name; keep their grammar):
- A: "It's been great to have those profiles because you can slot people in, like, as they're talking to you... the things they're saying resonate with a lot of the things that we discussed." (hand-off call, Aug 2026)
- B: "We haven't had one person come for a tour or walk in and say like, I don't understand what you guys are doing." (Nov 2026)
- C: "These are spot on... if we get these buckets, I think we fill up our membership pretty quickly." (May 2026, on first seeing the six) — splice of two consecutive sentences "These are all, these are spot on." and "if we get these buckets, I think we fill up our membership pretty quickly."; show the ellipsis.
- D: "That exercise you guys ran us through has really made us more cognizant of the groups." (Aug 2026)
- none

## Saving
Picks must persist so Claude can read them later: `studies/iterations/92/picks.json`, written by a small POST route (`/api/study-92/pick`, body `{row, pick}` where pick is `{from, i}`, `{edit: "..."}` or null) added to `studies/server.cjs` with the narrowest change possible (validate row/option against lines.json; reject anything else; write atomically). It is Divya's server: keep every existing behaviour identical and note the route in HANDOFF. The desk must still be readable with no server (shows option 1s).

## Rules (public repo)
No names of the club's people or prospects (Kahran and Divya may be named). No money except $5-10K, no figures (no 88, no member counts), no income or family details, never "before the club was built", never "an easy weekday place", no em dashes in our words, noindex, legibility (16px body, 13px labels, 4.5:1). The desk is for Kahran so its labels can be working labels, but the draft must be clean.

## Done
check.cjs (rows present, every option traces to a source, rules above on the draft, the POST route rejects a bad row: break once, see red, restore), rail link at top of studies/index.html, HANDOFF row 92 ("for Kahran: edit 91 a") + Newest line, `node studies/verify.cjs` (only the old 70 failure allowed). Restart the phone server so the route is live: it runs as `HOST=100.90.104.120 node studies/server.cjs` from /Users/kahransingh/dev/joyus-site (kill only that process; also the localhost one on 8794 if present, then restart both). Test a pick end to end over http://100.90.104.120:8794 then reset picks.json to empty.
