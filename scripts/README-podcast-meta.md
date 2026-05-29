# podcast metadata workflow

Generates a structured sidecar JSON for every podcast episode, then bakes
the autocomplete entries into `index.html`. Designed to handle new episodes
as you record them.

## Files

- `podcast-meta-extract.mjs` — scans `podcast/*.html`, pulls transcript +
  title, writes "needs-meta" chunk files to `/tmp/` for parallel agent runs.
  Skips episodes whose sidecar already matches the current transcript hash.
- `podcast-meta-prompt.txt` — the agent prompt template. Fill in
  `{CHUNK_NUM}` and dispatch one agent per chunk.
- `podcast-meta-bake.mjs` — reads every `podcast/*.meta.json`, flattens
  `intents` into CONTENT_MAP rows, splices into `index.html`.

## Sidecar shape (`podcast/<slug>.meta.json`)

```json
{
  "slug": "preeti-suri-tips-for-women-founders-and-balancing-health-work",
  "url": "podcast/preeti-suri-...html",
  "title": "Preeti Suri: Tips for Women Founders and Balancing Health & Work",
  "summary": "Preeti talks with Kahran about leaving a banking career late to start Adventure Tripper, balancing motherhood with founding a startup, and the financial cushion that made the leap possible.",
  "topics": ["women founders", "burnout", "balancing motherhood", "career pivots", "fundraising", "parenting"],
  "people": ["Preeti Suri", "Kahran Singh"],
  "places": ["Seattle", "Hyderabad", "INSEAD"],
  "intents": [
    {
      "display": "to hear a woman founder talk about burnout and balance",
      "terms": ["burnout", "woman", "founder", "balance", "health", "work-life", "preeti"],
      "dest": "Preeti Suri"
    },
    {
      "display": "to hear about parenting while running a startup",
      "terms": ["parent", "mother", "mom", "kid", "child", "family", "startup", "balance"],
      "dest": "Preeti Suri"
    }
  ],
  "transcript_hash": "abc123…",
  "generated_at": "2026-05-28T15:30:00Z",
  "generator": "claude-opus-4-7"
}
```

## Workflow — first-time / bulk regen

1. `node scripts/podcast-meta-extract.mjs` — writes chunk files to `/tmp/`
2. Dispatch one Claude Code agent per chunk file using the prompt template
   (`scripts/podcast-meta-prompt.txt`), each producing N sidecar files
3. `node scripts/podcast-meta-bake.mjs` — splices into `index.html`

## Workflow — new episode

1. Drop the new episode HTML into `podcast/` as usual
2. `node scripts/podcast-meta-extract.mjs` — detects the missing sidecar,
   writes a single-episode chunk file
3. Dispatch one agent with the prompt template
4. `node scripts/podcast-meta-bake.mjs` — appends the new intents

## Workflow — edited transcript

The extract script hashes the transcript text. If you edit the transcript
in the HTML, the hash changes and the sidecar gets queued for regeneration
on the next run. To force regen of all sidecars:

```sh
node scripts/podcast-meta-extract.mjs --force
```

## Hand-edit a sidecar

Sidecars are checked-in JSON files, edit freely. The bake step picks up
your changes on the next run. If you want a sidecar to survive transcript
edits, leave it as-is and the hash mismatch only triggers a re-queue, not
an overwrite — the agent decides whether to keep your version or overwrite
it (current default: overwrite).

## CI sanity check

```sh
node scripts/podcast-meta-bake.mjs --check
```

Exits 1 if `index.html` is stale relative to the current sidecars.
