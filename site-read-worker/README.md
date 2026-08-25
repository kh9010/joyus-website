# site-read-worker — source, not pages

The backend for `/site-read/`. **Nothing in this directory is published.**
`_config.yml` at the repo root excludes it from the GitHub Pages build, because
the generated prompt modules carry both prompts verbatim and a published copy
would be readable by anyone who guessed the URL.

**The read is produced in two passes (v5.3).** Pass 1 perceives and returns a
structured outline — findings with their evidence, a claim ledger, and a
**render plan**: the exact ordered list of sentences pass 2 is allowed to write.
Pass 2 writes, from the outline and nothing else. It never sees the site, the
fact sheet, or the pages, which is why a fabricated fact is a set-membership
failure rather than a judgment call.

```
site-read-worker/
  analysis-prompt-outline.md            pass 1 — its one home
  analysis-prompt-outline-schema.json   what pass 1 returns
  analysis-prompt-writer.md             pass 2 — its one home
  analysis-prompt-writer-schema.json    the assembled read the page renders,
                                        annotated x_source: writer | graft
  worker/                               the Cloudflare Worker, verbatim
```

The four files at this level are deliberately here and not inside `worker/`:
`worker/scripts/embed-prompt.mjs` resolves them at `../` and regenerates
`worker/src/outlinePrompt.js` and `worker/src/writerPrompt.js` from them.
Editing a generated file by hand creates a second version of a prompt that wins
by accident in whichever session happens to read it.

The writer's tool schema is **derived**, not authored: the read schema filtered
to the properties marked `x_source: "writer"`. Everything marked `"graft"` is
copied out of the outline by `worker/src/assemble.js`, so the evidence cards are
byte-identical to what perception verified.

```sh
cd site-read-worker/worker
node test/run-all.mjs            # 8 suites; one needs the internet
node test/run-all.mjs --offline
npm run embed-prompt             # after editing either ../analysis-prompt-*.md
```

Deploy steps — every one of them attended — are in `worker/README.md`.

**The front end is switched off until this is deployed.** `site-read/site-read.js`
has `API_BASE = null`, and while it is null a typed URL gets an honest "the
reader isn't switched on yet" page rather than anything resembling a read. Point
`API_BASE` at the deployed worker origin to turn it on; that one line is the
switch.
