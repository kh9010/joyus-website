# site-read-worker — source, not pages

The backend for `/site-read/`. **Nothing in this directory is published.**
`_config.yml` at the repo root excludes it from the GitHub Pages build, because
`worker/src/analysisPrompt.js` carries the analysis prompt verbatim and a
published copy would be readable by anyone who guessed the URL.

```
site-read-worker/
  v4-analysis-prompt.md     the prompt — its one home
  v4-output-schema.json     the output contract the page renders
  worker/                   the Cloudflare Worker, verbatim
```

The two files at this level are deliberately here and not inside `worker/`:
`worker/scripts/embed-prompt.mjs` resolves them at `../` and regenerates
`worker/src/analysisPrompt.js` from them. Editing the generated file by hand
creates a second version of the prompt that wins by accident in whichever
session happens to read it.

```sh
cd site-read-worker/worker
node test/run-all.mjs            # 52 tests; one suite needs the internet
node test/run-all.mjs --offline
npm run embed-prompt             # after editing ../v4-analysis-prompt.md
```

Deploy steps — every one of them attended — are in `worker/README.md`.

**The front end is switched off until this is deployed.** `site-read/site-read.js`
has `API_BASE = null`, and while it is null a typed URL gets an honest "the
reader isn't switched on yet" page rather than anything resembling a read. Point
`API_BASE` at the deployed worker origin to turn it on; that one line is the
switch.
