# Homepage rebuild — handoff

_2 October 2026 · branch `divya-sep22-home-wireframe` · not merged to main_

## Where it is

The new joyus.studio homepage is being worked out as numbered **studies** (snapshots, newest first) in `studies/iterations/NN`. Nothing touches the live site.

**Current direction (Study 13): one page.** Work, About and Say hi on a single page; each piece of work gets its own details page. Everything else from Studies 04–12 (work index, client pages, person pages, separate About / Say hi / newsletter pages) folds into it.

**Latest research (Studies 14–15):** 20 interesting About pages and 20 interesting Work pages, screenshotted, one line each, grouped by the move they make. For inspiration, nothing implemented.

## Run it

```bash
node studies/server.cjs        # http://localhost:8794/studies/  (rail of all studies)
node studies/verify.cjs        # before every commit
```

The server gets killed when the machine is low on memory if it runs as a Claude Code background task. Run it in its own terminal window to keep it up.

## The studies

| # | What | Pick / state |
|---|---|---|
| 01 | Where we started: Divya's brief verbatim, her mind map, the current homepage, April concepts | baseline |
| 02 | The wireframe, four rounds (22 Sep), each with the note behind it | round 4 = the homepage |
| 03 | IA: every clickable on round 4 and where it goes (`ia.json`) | amended by later studies |
| 04 | Piece page: rounds vs case study (Klydo · branding) | rounds |
| 05 | Experiment page: the story vs the thing first (Metro Museum) | the thing first |
| 06 | Client page: by time vs by pill (Klydo) | by time; only clients with 2+ pieces |
| 07 | Work index: cards vs index | index |
| 08 | About: map's three sides vs Kahran's five things | superseded by 13 |
| 09 | Person page: a page each vs both on one | superseded by 13 |
| 10 | Say hi: open note vs knows which piece you came from | knows where you came from |
| 11 | Newsletter (issues assembled from rounds) + privacy (facts from the code) | issues on the site |
| 12 | Everything wired into a clickable prototype, crawled in a browser | superseded by 13 |
| 13 | **One page**: work · about · say hi, + piece pages | **current** |
| 14 | 20 About pages | research |
| 15 | 20 Work pages | research |

## Waiting on Divya / Kahran

1. **The words for the one page:** the hero description, About (who we are + one line each), Say hi line. Left blank on purpose; new words, not the old pages'.
2. **Pills vs positioning.** The July doc says "do NOT organise by service"; the pills are services.
3. **Content audit:** dated rounds for the 26 pieces other than Klydo · branding (piece pages need them).
4. **Unknowns:** what EWC, Brand Studio and Art stager are; is "Poem Films" the AI-videos-for-poetry experiment; Klydo day 15 vs "week six".
5. **Where the newsletter archive and privacy line go** on the one page.
6. **What leaves the nav:** Services, Workshops; the intent box and `looking.html`.

## Rules for working here

- **Studies are simple: show, don't tell.** A title, one line, pictures, a one-line pick. Under ~100 words. (Divya, 1 Oct.)
- **Never edit an old study** beyond a copy fix; a new idea is a new study. Add it to the top of the rail in `studies/index.html` and point the iframe at it.
- **Kahran's copy is used whole:** never split his sentences or paragraphs. Studies 08–10 check this against `about.html` and `say-hi.html`.
- **The repo is public.** Study pages are `noindex`, but pushing the branch publishes them, including Divya's brief, the mind map, and screenshots of other studios' sites (Studies 14–15). Everything Bazaar stays out: it's local-only.
- Don't pass regexes through `node -e '…'` in bash; the backslashes get eaten. Write the script to a file.

## Tools

- `studies/verify.cjs`: rail, local references, `noindex`, images, provenance (`02/rev4.html` = commit `2c3e0d6`), snapshots, and each study's own `check.cjs`.
- `studies/wirecheck.cjs`: shared checks for the subpage wireframes (every link names a Study 03 page type; nav and footer match round 4).
- `studies/iterations/12/crawl.mjs`: clicks through the Study 12 prototype in headless Chrome (needs the server). Its `check.cjs` fails if the crawl report is older than the site files.
- `studies/iterations/13/build.cjs`: rebuilds the one-pager from Study 12. `14/build.cjs`, `15/build.cjs`: rebuild the research pages from `refs.json`.

## Next

1. Fill the one page's words (item 1 above), then a Study 16 with them in.
2. Pick from 14–15 what the About section and the piece pages borrow, as Study 16 / 17.
3. Content audit for rounds.
4. When it's ready: design pass on the wireframes, then build into the real site on a fresh branch.
