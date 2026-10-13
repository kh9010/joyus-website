# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

_Rewritten 13 October 2026, when joyus.studio became the coming-soon page. The old site's pages are gone from `main` (see "The old site")._

## What is live

Pure static site on GitHub Pages from `main` (root) at **https://joyus.studio** (`CNAME`). Whatever lands on `main` is live within a minute or two. No build step, no framework, no package.json.

The site is one page, the **coming-soon page**: a J of gummy stones built live in a worker, cycling ten fonts; the words beside it; a road-works sign under them.

- `index.html` — the page. `404.html` — the same page (with `noindex`, no canonical), so every unknown address shows it. GitHub Pages returns a real 404 status for those.
- `cs/` — its assets: `site.js` (the sign), `jbuilder.js` (the worker that meshes the stones), `looks/gummy.js`, `bake/solid-geometry.js` (copied verbatim from joyus/brand-lab; never edit), `bake/dist.js` (distance transforms), `masks1024/` (the ten fonts' J, drawn at 1024px), `og.png`.
- `motion-jigsaw/privacy/` — **never delete, move, rename, redirect or break this page or its `assets/`.** Its URL is in the Google Play and App Store listings and in the game (`PRIVACY_URL`). Edit its content on a `divya-*` branch; keep the URL and its `noindex`. A store listing with a dead privacy URL is removed from the store.
- `sitemap.xml` lists `/` only. `robots.txt` allows everything. `favicon.ico`, `apple-touch-icon.png`.
- Kept for the rebuild, not served as pages: `styles.css` (the design tokens, see below), `_partials/` + `scripts/sync-chrome.js` (nav/footer sync for marker-bearing pages), the other `scripts/` (podcast metadata, redirects: they target pages that are now in history), the `.md` docs, the two PDFs.

Three.js loads from jsdelivr (`three@0.169.0`, import map in the page). Fonts from Google Fonts. No Firebase on the live page (the old intent box's Firestore collections are dormant).

### Analytics

GA4 `G-74FZR7YY60` ("website joyus.studio", property 427004605) is in the `<head>` of `index.html` and `404.html`. **Do not use `G-K7PDLTYWF6`** (an inert Firebase-created property) or **`G-H63H3KD6WQ`** (Kahran's personal site).

## The old site

Everything else (case studies, ~80 podcast episode pages, 15 essays, comics, hubs, services, concepts, redirect stubs, images, the intent-box homepage) was removed from `main` on 13 October 2026 (commit `baff974`, PR #15) so that joyus.studio is the sign and nothing else. It is all in git history: the last commit with the full site is `5247822`. The old URLs now 404 to the coming-soon page.

The founders are **Kahran Singh** and **Divya Tak** (spelling matters). Podcast transcripts and Kahran's copy, when they come back, are used whole: never "fix" transcript grammar or split his sentences.

## The homepage studies (where the page is designed)

The page is designed as numbered **studies** on the branch **`divya-oct06-coming-soon`**, in `studies/` (not on `main`): `node studies/server.cjs` → http://localhost:8794/studies/ (a rail of `studies/iterations/NN`, newest first). **Read `studies/HANDOFF.md` first** on that branch: what each study decided, what is open, the rules.

- **Snapshot rule:** never edit an old study beyond a copy fix; a new idea is a new study. **`node studies/verify.cjs` before every commit** there.
- **Pictures first, checks after:** a study's `page-test.mjs` takes ~8 minutes in software Chrome; take its pictures with its `shoot.mjs` first. One headless Chrome at a time (two killed the server). Don't open Brave on the live 3D page while a test runs.
- Study images: cropped to the subject, at most three to a row, every one a link to the full file (`study.css` `.zoom`).
- Headless Chrome runs on SwiftShader (CPU): they never touch Divya's GPU.

## Updating the live page

The live page is Study 40 (+ 41) with the study-only font bar removed. To ship a newer study:

1. On the studies branch: finish the study, `shoot.mjs`, `page-test.mjs`, `verify.cjs`, commit.
2. `git fetch origin && git checkout -b divya-<mmmDD>-<task> origin/main`.
3. Pull the study's folder out of the branch (`git archive divya-oct06-coming-soon studies/iterations/NN | tar -x -C <tmp>`), copy `site.js`, `jbuilder.js`, `looks/gummy.js`, `bake/solid-geometry.js`, `bake/dist.js`, `masks1024/*.png` into `cs/`.
4. Turn `coming-soon.html` into `index.html` and `404.html`: drop the `<nav class="study">`, its CSS and `noindex`; add the description, og, canonical (index only; the 404 gets `noindex` and no canonical), icons and the GA4 snippet; point the imports, the worker and the inline early-worker script at `/cs/…` (absolute, so the 404 works at any depth); keep the privacy page untouched. The transform used on 13 Oct is in the session scratchpad (`golive.py`); redo it by hand if it's gone.
5. Serve the root over HTTP (`python -m http.server 8000`, not `file://`: the worker and the masks need a server) and check `/`, `/404.html`, `/motion-jigsaw/privacy/` and every `/cs/` asset answer and build with no console errors.
6. Commit, push the branch, `gh pr create -B main`, and merge on GitHub (`gh pr merge --merge --delete-branch`). Confirm on https://joyus.studio after Pages rebuilds (hard refresh).

## Design system

`styles.css` is the token source for the rebuild; the coming-soon page carries its own copy of the tokens inline. Tokens: `--bg #FFFFFF` (the page is white, not the old paper), `--ink #2C3544`, `--ink-soft #54606F`, `--ink-fade #8892A0`, `--pink #E91E7B`, `--cyan #4FC4CF`, `--yellow #F2C94A`; Space Grotesk everywhere. The stones' palette (`cs/jbuilder.js`): `#f25aa3`, `#7d55d4`, `#2fc0d8`, `#f5c63c`. No serif. See `DESIGN-LANGUAGE.md` for the 2026-05-20 audit of the old system.

## Positioning

"We think with everyone. We build with a few." Advisory is the front door; operational/production work is the premium tier. See `notion-pass1-storytelling.md` and `WEBSITE-DIRECTION.md`.

## Claude Code setup

- `.claude/skills/proposal-builder/SKILL.md` — project-local skill for client proposals (proposal / SOW / scope-of-work requests).
- `.claude/agents/joyus-*.md` — the site-rebuild agent team (PM, architect, dev, testers); `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `.claude/settings.local.json`. Default to the lightest model that fits.
- `.claude/scheduled_tasks.lock` — runtime artifact, ignore.

## Branch discipline

**Always work on a personal/task-named branch. Never commit directly to main. Don't merge without being told.**

- Divya's branches are `divya-<mmmDD>-<task>` and the older `designmayNN`; Kahran's sessions use `kahran-<mmmDD>-<task>`. The date is essential: parallel sessions on the same day must not collide. Don't commit on someone else's branch.
- Create fresh off the remote: `git fetch origin && git checkout -b <name> origin/main`.
- **Verify with `git branch --show-current` before every commit**; the session on this machine has silently shifted branches between turns.
- **Merge on the remote, never locally:** push the branch, `gh pr create -B main`, `gh pr merge --merge --delete-branch`. Then delete the local branch. Never `git merge` into local `main` and push.
- Merging to `main` deploys to joyus.studio within a minute or two: confirm with the person before merging anything outward-facing.

## Gotchas

- **`experimentalAutoDetectLongPolling`** must stay on any Firestore init that comes back (CORS on GitHub Pages breaks without it).
- **Canonical URLs are `https://joyus.studio/…`**; if a page comes back, use that for its canonical, `og:url` and JSON-LD.
- New public pages need a `sitemap.xml` entry; `404.html` must use root-absolute links because it renders at the failed URL.
- Don't pass regexes through `node -e '…'` or Python heredocs in bash; the backslashes get eaten. Write the script to a file.
