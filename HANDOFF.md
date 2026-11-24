# Handoff: joyus-website (joyus.studio)
Last updated: 2026-11-13. Written from the repo as it stands on `main`; `CLAUDE.md` is the detailed manual and wins on any conflict.

## Current goal
Keep joyus.studio as the coming-soon page while the full site is rebuilt. The page was designed as numbered studies on a separate branch. The rebuild itself has no visible plan in this repo: unknown.

## Where things stand
- Live: one static page (`index.html`, mirrored by `404.html`) on GitHub Pages from `main`, custom domain via `CNAME`. Merge to `main` = live in a minute or two.
- The old site (case studies, podcast pages, essays, comics) was removed 2026-10-13 (PR #15). Last full-site commit: `5247822`.
- `motion-jigsaw/privacy/` is referenced from app store listings. Never move, rename or delete it (rule in `CLAUDE.md`).
- Studies live on branch `divya-oct06-coming-soon` under `studies/`, not on `main`. That branch has its own `studies/HANDOFF.md`; read it for design decisions.
- Other `.md` docs at root (`PENDING-WORK.md`, `WEBSITE-DIRECTION.md`, positioning notes) describe the old site or the rebuild. `PENDING-WORK.md` is dated 2026-06-03 and says so in its banner. Treat as history.

## Rules visible in the repo
- Work on a personal branch (`divya-<mmmDD>-<task>` or `kahran-<mmmDD>-<task>`); never commit to `main` directly.
- Merge on the remote via PR (`gh pr create -B main`, `gh pr merge --merge --delete-branch`); never merge locally.
- Confirm before merging anything outward-facing.
- Use the analytics property named in `CLAUDE.md`; it warns off two others.
- Founder names and transcript wording are used as written, never "fixed" (`CLAUDE.md`).

## Workspace state
- Static; no build, no package.json. Serve the root over HTTP (`python -m http.server 8000`); `file://` breaks the worker.
- Page assets in `cs/` (worker, stone builder, font masks). `cs/bake/solid-geometry.js` is a verbatim copy; never edit.
- `styles.css`, `_partials/`, `scripts/` are kept for the rebuild; the scripts target pages now in history.
- Shipping a newer study: step-by-step in `CLAUDE.md` ("Updating the live page").

## Verification
No checker on `main`. The studies branch has `studies/verify.cjs`. Manual check after a deploy: `/`, `/404.html`, `/motion-jigsaw/privacy/` and every `/cs/` asset load without console errors.

## Open questions
- What replaces the coming-soon page, and when: unknown.
- Whether the old-site scripts and docs should be archived: unknown.
