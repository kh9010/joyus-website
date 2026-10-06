# Homepage rebuild — handoff

_6 October 2026 · branch `divya-oct06-coming-soon` (off `divya-sep22-home-wireframe`) · not merged to main_

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
| 16 | **Coming soon**: the Voronoi J (from `joyus/brand-lab`) assembles and follows the pointer; deck + Divya + Kahran links | wireframe, waiting on Divya |
| 17 | Looks people get: 24 real-time references, grouped by look | research |
| 18 | **Looks**: the coming-soon page on white, smooth mesh, 8 looks switchable live (`coming-soon.html?look=`); measured: 5 distinct ideas (Candy, Toon, Print, Painted, Frosted), the rest are Candy finishes | waiting on Divya's pick |
| 19 | **Construction site**: J built live in a worker (`jbuilder.js`, random seed each visit, 25 stones), floats over a floor, 2 fallen stones + barrier sign, pointer speed drives the build, J moves as one; looks plain/sugared/gummy/toon/print | superseded by 20 (Divya liked it; wanted another font and 3D) |
| 20 | **Font and depth**: J in 6 fonts (`masks/`), 2D vs 3D Voronoi, legibility measured (`legible.mjs`); pick Unbounded 3D, runner-up Space Grotesk 3D. Fixed a bug inherited from brand-lab: stones ended one rounding radius outside the letter (46% spill → 0) | Divya picked Unbounded 3D |
| 21 | **Road works**: Unbounded 3D fixed; the barrier replaced by a work-zone diamond (digging worker) on a folding stand + UNDER CONSTRUCTION plate, and two traffic cones (`site.js`) | superseded by 22 |
| 22 | **The sign, in Joyus**: cones and plate gone; spring stand (purple); brand palette only; four ways to make the sign of stones (`?sign=`): A soft, B stone diamond (busy), C stone worker (unreadable, dropped), **D the worker digging a pile of Joyus stones (pick)** | Divya: soft sign (A) is enough; smaller; more fonts |
| 23 | **Smaller sign, more fonts**: soft sign only (board 0.62 → 0.44, narrower stand); looks can restyle drawn art (`styleDecal`; Print screens the ink); 8 J fonts (`?font=`): Unbounded, Rubik, Archivo Black, Syne, Titan, Shrikhand, Dela Gothic, Bowlby | fonts and looks kept (Divya) |
| 24 | **Sign on the ground**: no stand; the soft sign leans back on the ground left of the J, behind the fallen stones (`LAYOUT.sign` = x, z, yaw, scale, lean, tilt; rests its lowest point on the floor) | superseded by 25 |
| 25 | **Knocked over**: three placements for the sign (knocked over on its stand, lying down, leaning) | Divya meant lying down |
| 26 | **Lying down**: the sign lies on the floor behind the fallen stones; placements removed; 8 fonts and 5 looks kept | **current**, waiting on Divya and Kahran: font, look |

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
- **The repo is public.** Study pages are `noindex`, but pushing the branch publishes them, including Divya's brief, the mind map, and screenshots of other studios' sites (Studies 14–15), and thumbnails from three.js / pmndrs / Maxime Heckel / Awwwards (Study 17). Everything Bazaar stays out: it's local-only.
- Don't pass regexes through `node -e '…'` in bash; the backslashes get eaten. Write the script to a file.

## Tools

- `studies/verify.cjs`: rail, local references, `noindex`, images, provenance (`02/rev4.html` = commit `2c3e0d6`), snapshots, and each study's own `check.cjs`.
- `studies/wirecheck.cjs`: shared checks for the subpage wireframes (every link names a Study 03 page type; nav and footer match round 4).
- `studies/iterations/12/crawl.mjs`: clicks through the Study 12 prototype in headless Chrome (needs the server). Its `check.cjs` fails if the crawl report is older than the site files.
- `studies/iterations/22/`: `site.js` = stand, soft diamond, face art (`faceTransform` shared by the decal and `pileOnFace`), stone helpers; the J builder takes any mask (data URLs too) and a `palette`. Fitting stones to a drawn shape: measure the built stones' box and fit that (rounding + grout shrink small shapes by about half), and sit their backs on the surface, not their middles.
- `studies/iterations/21/`: Study 20's page with the font fixed (Unbounded, 3D) and `site.js` (sign art drawn on canvas: `drawWorker`, `drawDiamond`, `drawPlate`; preview at `bake/art.html`; 3D `buildSign`, `buildCone`). Canvas art for a 45°-turned mesh must be pre-turned clockwise: three.js `rotation.z` is counter-clockwise, CSS `rotate()` clockwise.
- `studies/iterations/20/`: Study 19's page + `?font=` and `?mode=2d|3d`; `jbuilder.js` adds `layer` and `fixGlyph` (the glyph cut moved in by each stone's radius); `make-masks.mjs` draws each font's J; `legible.mjs` scores silhouettes against the font (5 seeds per config). The copied `solid-geometry.js` stays byte-identical to brand-lab; brand-lab itself still has the bulge bug in `solid-app.js`.
- `studies/iterations/19/`: `jbuilder.js` (worker: builds the J from a seed; glyph from `j-mask.png` because Android has no Arial Black; occlusion from neighbouring fields, calibrated to rays), `page-test.mjs` (43 browser checks incl. 8 random seeds), `equiv.mjs` (live J = Study 18 bake), `seeds.mjs` (60 random seeds). `?seed=` pins a J, `?look=` picks a look.
- `studies/iterations/18/`: `bake.mjs` (mesh, now keeps exact normals), `bake-ao.mjs` (per-vertex occlusion, 64 rays), `lab.html?look=&mesh=` (still render), `shoot.mjs` (lab shots → `shots.json`), `distinct.py` (how different each look is → `distinct.json`), `page-test.mjs` (every look on the page in a browser → `page-report.json`), `make-figs.py`. Looks live in `looks/*.js`, one module each. Only `p100` and `p100-ao` meshes are committed; the comparison meshes rebuild from the commands in `bake.mjs`.
- `studies/iterations/16/bake.mjs`: rebakes the J into `j.json` from a verbatim copy of brand-lab's `solid-geometry.js` (one layer of stones, 15 cells). `16/shoot.mjs` drives `coming-soon.html` in headless Chrome (SwiftShader, no GPU) and writes `report.json` + `img/`; its `check.cjs` fails if the report is older than the page or `j.json`. Both need the server.
- `studies/iterations/13/build.cjs`: rebuilds the one-pager from Study 12. `14/build.cjs`, `15/build.cjs`: rebuild the research pages from `refs.json`.

## Next

1. Fill the one page's words (item 1 above), then a new study with them in.
2. Pick from 14–15 what the About section and the piece pages borrow, as new studies.
3. Content audit for rounds.
4. When it's ready: design pass on the wireframes, then build into the real site on a fresh branch.
