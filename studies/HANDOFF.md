# Homepage rebuild — handoff

_13 October 2026 · branch `divya-oct06-coming-soon`, pushed · Studies 27–41 committed 13 Oct · the page is live on joyus.studio from `main` (PR #15, #16); the studies themselves stay on this branch, off `main`_

## Where it is

The new joyus.studio homepage is being worked out as numbered **studies** (snapshots, newest first) in `studies/iterations/NN`. Nothing touches the live site.

**Current direction (Study 13): one page.** Work, About and Say hi on a single page; each piece of work gets its own details page. Everything else from Studies 04–12 (work index, client pages, person pages, separate About / Say hi / newsletter pages) folds into it.

**Newest (Studies 42–43, 26 Oct):** the EWC strategy piece, eight ways: 42 = A rounds vs B grid-first; 43 = six more (log, lenses, web, record, references, its own voice), each borrowing Study 15 picks. For Divya + Kahran.

**Latest research (Studies 14–15):** 20 interesting About pages and 20 interesting Work pages, screenshotted, one line each, grouped by the move they make. For inspiration, nothing implemented.

**joyus.studio is this page since 13 Oct 2026** (PR #15: Study 40 as `index.html` and `404.html`, assets in `/cs/`, the old site removed from `main`; `CLAUDE.md` on `main` rewritten for it). Studies stay here, on this branch, off `main`.

**The coming-soon page, as of Study 40 (13 Oct 2026):** Gummy look; 40 stones; ten fonts cycling (6 s whole, then the stones let go and the next font flies in, idle build ~2.7 s); the exact distance field on 1024px masks (smooth edges, same polygons); the J left, the words right (headline up to 3.8rem with "under construction" whole, Space Grotesk subtitle, three stacked links with coloured underlines and a hover sweep that turns the word white); the sign under the words, the two fallen stones (from inside the outline) under the J. Decided by Divya through Studies 27–41, including the fonts: all ten cycle. Nothing is open. Divya (13 Oct): don't update this file per study; update it when committing.

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
| 26 | **Lying down**: the sign lies on the floor behind the fallen stones; placements removed; 8 fonts and 5 looks kept | Divya: Gummy; drop Syne, Titan, Dela Gothic and "new J"; more fonts; cycle them |
| 27 | **The J cycles its fonts**: Gummy only; ten seconds after the J is whole its stones let go (bottom first), land, fade, and the next font flies in (built ahead in the worker); the bar brings a font next; reduced motion cuts; 14 fonts (9 new: Anton, Lilita, Alfa Slab, Bungee, Chango, Luckiest Guy, Fredoka, Rowdies, Bagel Fat), all ≥ 0.75 legible | Divya: more cursive/other fonts, keep exploring; J left, words right; 6 s |
| 28 | **Left and right**: the J in a left column, the words right (stacked on a phone); six seconds whole; 18 more fonts tried (7 cursive, 11 other); 25 kept, 7 out: the connected scripts (Pacifico, Lobster, Kaushan, Courgette, Leckerli) plus Bangers and Sedgwick score 0.57–0.74, and 40 stones instead of 25 changes nothing (`legible-cursive40.json`): thin strokes don't survive the stones, whatever their number | Divya picked 10 fonts (Tilt Warp unmentioned); other breaks for Calistoga, Abril, Sansita; Ultra wants more stones; "how many are there?" |
| 29 | **More stones**: `?cells=` 25 / 40 / 60 per J (bar row; the fly-in delays scale so the build takes the same time); the eleven kept fonts, each shot and scored at all three; three other seeds each for Calistoga, Abril and Sansita Swashed | Divya: 40 reads a lot better; Tilt Warp out; Sansita's stones taken from a different spot |
| 30 | **Forty**: 40 stones is the build (no switch; `?cells=` stays for the test); ten fonts; `FALL_FROM` takes a font's two fallen stones only from its tail (Sansita: lowest 35%), so the thin swash keeps whole | Divya: headline bigger; new second line and its font; links nicer, a few treatments; some curved edges not smooth |
| 31 | **The words**: headline up to 3.8rem; "in the meantime… you can check us out here"; four treatments (`?words=`): A serif aside (Instrument Serif italic) + dotted outlined pills, B mono label (DM Mono) + hairline list with coloured arrows, C Unbounded line + thick coloured underlines, D Nunito line + tinted rounded cards. The J untouched | waiting on Divya: which treatment |
| 32 | **Smoother stones**: `?res=` 0.6 (as since Study 19) / 1 / 1.5 on the mesh grid (surface nets, `jbuilder.js`); the page reports `T.buildMs` and `T.tris`; close-ups and a table on the study page | Divya: the facets look the same at every count, it's the font's shape; C's style works, not its font |
| 33 | **C, another line**: C is the default; its line in four fonts (`?line=`): Space Grotesk (the page's own), Instrument Serif italic, Fraunces italic, Space Mono | waiting on Divya: which line |
| 34 | **Smoother edges, same polygons**: Divya was right that it isn't the poly count. The glyph field was a 320px mask through a 3×3 chamfer transform (octagonal contours, up to ~8% off), and the stones' cut edges and normals follow it. `?edge=` chamfer (as before) / exact (Euclidean distance, `bake/dist.js`) / exact1024 (plus a 1024px mask, `masks1024/`); same mesh resolution; `field.mjs` draws both fields' contours and measures the chamfer's error | waiting on Divya: which edges |
| 35 | **The words, after the sketch** (Divya, 13 Oct): the words' column wider (1.15 : 1, 720px); "under construction" in a `.keep` span that never splits; in C the links stack as a list; `?line=` dresses the line and the links alike | waiting on Divya: the font pair |
| 36 | **The site, under the words** (Divya's sketch): on wide screens the sign and the fallen stones sit bottom right under the links, placed on the floor by unprojecting a pixel through the camera (`floorAt`, `placeSite`); the J alone sizes its column; on a phone they stay in front of the J | Divya: don't break Sansita's tail; take the blocks from anywhere, the silhouette should retain |
| 37 | **The silhouette keeps**: for every font the two fallen stones come from inside the outline (`edge < −INSIDE`, 0.06 field units), the front-most four of those, then the two smallest; a thin letter with fewer than two inside stones takes its innermost two. The tail rule (`FALL_FROM`) is gone | Divya: keep 40 stones; the style is display; more subtitle fonts |
| 38 | **The subtitle, twelve voices**: `?line=` on the subtitle alone (the links stay Space Grotesk): Space Grotesk, Instrument Serif it., Fraunces it., Newsreader it., Playfair it., Cormorant it., Space Mono, Plex Mono it., Patrick Hand, Lilita One, Nunito, Bricolage Grotesque. `shoot.mjs` takes its pictures in ~2 min before the test | Divya: Space Grotesk; only the sign moves, blocks under the J; hover sweep; "finer" slow?; J too big; remove the chosen switches |
| 39 | **Decided, and the sweep**: subtitle Space Grotesk, treatment C; the words/subtitle/mesh/edge switches gone (res 0.6, exact field on the 1024 mask); only the sign under the words, the two blocks under the J and back in the frame; `SHRINK` 0.84 (the J at 84% of what the column allows); the links' colour sweeps in from the left on hover (`background-size` 0 → 100%, anchored left) | Divya: order the fonts so no two sans follow; sign further right; white text under the band; more air; heavier headline; the Drive deck; commit |
| 40 | **Six small things**: fonts alternate sans/not-sans round the wrap (Rubik · Alfa Slab · Archivo Black · Shrikhand · Lilita · Calistoga · Bagel Fat · Abril · Sansita · Ultra); the sign at 66% of the words' column; the hovered word is painted by clipped layers and goes white in step with the band (ink on the yellow one); `.note` margin 2.6rem; the headline wears a 0.9px ink stroke (Space Grotesk stops at 700); "Our work" → the Drive deck | committed 13 Oct; **live on joyus.studio** (PR #15) |
| 41 | **A graceful first load**: the words and a CSS floor at once; the worker starts from an inline script before three.js downloads; the floor and sign appear when the renderer is up; each stone flies in as it is meshed (`newGen`/`addStone`/`finishGen`); the two fallen stones are chosen last and change course to the floor; `load-timing.json` (40 vs 41, cold and warm) | **current**; to go live next |
| 42 | **EWC, told two ways** (Kahran, 26 Oct): a new piece, *EWC · strategy* (not in rev4; its headline is a draft). A = seven dated rounds (Study 04); B = the value grid first, story under it. Grid = the EWC brand guide word for word via `extract.cjs` → `personas.json` → `build.cjs`; quotes from raw.db transcripts, listed in `check.cjs`. `shoot.mjs --sources` re-shoots the guide and eastwestclub.com (needs `~/dev/ewc`) | for Divya |
| 43 | **EWC, six more ways** (Kahran, 26 Oct): the same piece as 42, six bodies, each naming the Study 15 picks it borrows: 1 the log (Rauno + increpare: every dated touchpoint, 10 Mar → 28 Aug hand-off), 2 lenses (Quicksand: People · Value · Mix · Brand tabs), 3 the web (Trousdale: personas ↔ what they use instead, clickable), 4 the record (Mindy Seu + Forme: short story, full grid + everything made, with credits), 5 the references (Archive for Space: the clubs and sites they sent beside our work), 6 in its own voice (Fathom + Lucas Pope: seven verbs in the club's brand voice). `build.cjs` writes all six from `shell.html` + `bodies/` (so they are one page outside the body) and the grid/web from `personas.json`; `shoot.mjs` renders all six and takes the pictures; `check.cjs` pins sources, the grid, the web's claim line, the log order and the club's out-words | for Divya + Kahran |

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
- **Pictures first, checks after** (Divya, 13 Oct: "why are all these images so slow to come?"). A study's page test takes ~8 minutes in software Chrome (real six-second holds, ten fonts, the cycle), and the shots only land at the end. For a new study, take its pictures with a short shoot script first, then run the full test. One headless Chrome at a time: two at once killed the server on 13 Oct. Don't open Brave tabs on the live 3D page while a test runs; they slow the software renderer and the timing checks fail.
- **Since Study 28 the desktop stage column is taller than wide, so `T.layout` reads `narrow` there** (the sign in front of the J). Anything that must know "are the columns side by side" should compare the words' column's left to the stage's right (Study 36's `wide`), not the aspect.
- The page tests' timing thresholds (idle build < 15 s, moving ≥ 1.8× faster, finest mesh < 20 s) are for software Chrome on a loaded machine; a real browser is several times faster.

## Tools

- `studies/verify.cjs`: rail, local references, `noindex`, images, provenance (`02/rev4.html` = commit `2c3e0d6`), snapshots, and each study's own `check.cjs`.
- `studies/wirecheck.cjs`: shared checks for the subpage wireframes (every link names a Study 03 page type; nav and footer match round 4).
- `studies/iterations/12/crawl.mjs`: clicks through the Study 12 prototype in headless Chrome (needs the server). Its `check.cjs` fails if the crawl report is older than the site files.
- `studies/iterations/34/`: `bake/dist.js` (chamfer + exact EDT, Felzenszwalb), `jbuilder.js` reads the mask at its own size and takes `field: 'exact'|'chamfer'`, reports `fieldMs` and `maskR`; `make-masks.mjs 1024 masks1024` draws the fine masks; `field.mjs` → `field.json` + contour pictures.
- `studies/iterations/32/`: as 31 with `?res=` passed to the worker (`S.res` scales the grid: res × (40 + 24·extent) cells across a stone's longest side).
- `studies/iterations/31/`: as 30; the words' treatment is `body[data-words]`, CSS only; every link carries a dot, a label, a second line and an arrow, and each treatment shows what it needs.
- `studies/iterations/30/`: as 29; `FALL_FROM[font]` = the share of the letter's height the fallen stones may come from (a stone's height = the mean of its vertices); each piece keeps `origin`, where it sat in the letter, which the test reads.
- `studies/iterations/29/`: as 28 with `?cells=`; `legible-fonts.json` holds 33 rows (11 fonts × 3 counts). A J has `cells` stones in all; the two smallest edge stones lie on the floor, and a stone too small to mesh is occasionally dropped (so 25 → 23 in the letter).
- `studies/iterations/28/`: as 27, 32 candidate fonts in `bake/mask.html`; the page is a two-column grid above 820px in landscape, and `fit()` bounds the J by the stage column's sides and shifts the view to the column's middle (`setViewOffset` in x as well as y).
- `studies/iterations/27/`: `make-masks.mjs` (14 fonts → `masks/`), `legible.mjs` (scores → `legible-fonts.json`), `page-test.mjs` (the cycle: hold, fall, swap, bar click, reduced motion, every font; shots per font). The hold is wall-clock (`T.wholeAt`), not summed frame time: headless Chrome runs slow and summed `dt` made ten seconds take twenty. `looks/gummy.js` exports `dress(mesh)` so stones built later get the look. The fallen pile shrinks and fades where it lies; sinking it (try 1) slid it into the headline.
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
