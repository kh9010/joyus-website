# podcast auto-updater (`podcast-sync.mjs`)

Pulls the **Thinking on Thinking** RSS feed and scaffolds everything a new
episode needs on the site — so publishing an episode becomes "run one command,
review the diff, commit." There is no hosted API, so the human step is *running
it* once in a while (ideally inside a Claude Code session, where the drafting
pass can run too).

## What it touches

For each episode on the feed that isn't on the site yet:

| Touchpoint | Filled from |
|---|---|
| `podcast/<slug>.html` (new episode page) | template + feed + Apple trackId |
| `podcast.html` featured block | newest episode |
| `podcast.html` backlog `<li>` (prepended) | feed |
| `podcast.html` archive counts (`N episodes`, `N-episode archive`) | bumped |
| `sitemap.xml` `<url>` | new slug |
| previous-newest episode nav-bar | gets a `Newer →` link to the new one |
| `podcast/<slug>.meta.json` + `intent-box.js` search rows | **only when you supply drafts with `intents`** |

It **never runs git.** It leaves a clean working tree for you to review and commit.

## Data sources (both verified live)

- **RSS** `https://anchor.fm/s/ab690c0c/podcast/rss` → title, show-notes, date, duration, season/episode, mp3, Spotify link.
- **Apple lookup** `itunes.apple.com/lookup?id=1636574012&entity=podcastEpisode` → per-episode `trackId` for the player embed, matched to the RSS `guid` (Apple's `episodeGuid` == RSS `guid`).

If the Apple lookup fails, the player falls back to the Spotify show embed.

## First run

```sh
node scripts/podcast-sync.mjs
```

With no `podcast/.sync-state.json` present, this **adopts all current feed
episodes as "seen"** (they're already on the site) and writes the state file.
Reports `0 new`. Commit `podcast/.sync-state.json` so the baseline travels.

## When a new episode publishes

The full-auto flow (run inside a Claude Code session so the drafting agent can run):

```sh
# 1. find what's new + dump it for the drafting agent
node scripts/podcast-sync.mjs --scan          # → scripts/.podcast-sync-pending.json

# 2. draft the voice copy + search intents
#    (dispatch an agent with scripts/podcast-sync-draft-prompt.txt
#     → it writes scripts/.podcast-sync-drafts.json)

# 3. apply: build page(s), patch podcast.html + sitemap, write sidecars, bake search
node scripts/podcast-sync.mjs --drafts scripts/.podcast-sync-drafts.json
```

**No drafting agent handy?** Just run `node scripts/podcast-sync.mjs`. It still
ships a complete page using the raw show-notes blurb — rougher (no voice excerpt,
no pull-quotes, no theme tag, not in homepage search), but live. Add the polish
later by re-running with `--drafts`.

## Flags

| Flag | Effect |
|---|---|
| *(none)* | scan + apply (writes files) |
| `--dry` | report + print sample artifacts, no writes |
| `--scan` | write `.podcast-sync-pending.json` for the drafting agent, no site writes |
| `--drafts <file>` | apply using drafted voice copy + intents |
| `--preview` | force the newest feed item as "new" and print artifacts (no writes) — for testing |
| `--no-bake` | skip the `intent-box.js` search bake |
| `--sync-chrome` | also re-run `sync-chrome.js` — **only** if you changed `_partials/*` (see gotcha) |

## Transcripts

The RSS feed carries show-notes, **not** the spoken transcript. New pages ship
with a placeholder transcript line. When you paste a real transcript into the
page's `<div class="ep-transcript-content">`, the existing
`podcast-meta-extract.mjs` hash check notices the change and re-queues that
episode for richer search metadata — no extra wiring.

## Gotchas

- **Don't pass `--sync-chrome` unless you edited the partials.** The episode
  template already embeds the current nav/foot, so new pages are correct without
  it. `sync-chrome.js` rewrites *every* marker page and, on this CRLF repo, that
  shows up as ~100 line-ending-only "changes" — noise you don't want in the commit.
  If the partials *did* change, either run with `--sync-chrome` and commit only
  the real pages, or regenerate the template (below).
- **Slugs** for new episodes are derived `lowercase-hyphenated` from the title
  (`&`→`and`, apostrophes dropped). Some historical filenames were truncated by
  Anchor; new ones won't be. Collisions auto-suffix `-2`.
- **Season/episode** numbers come from the feed (`itunes:season`/`episode`); a
  few old items lack them. If missing, the tool continues the current featured
  numbering (`curEp + 1`, same season).

## Regenerating the page template

`scripts/podcast-episode.template.html` is a tokenized copy of a real episode
page (head + per-page `<style>` + nav/foot + body skeleton, with `{{TOKENS}}`).
If the episode-page design changes, re-tokenize from a current good page: copy
its content regions and re-insert the tokens (`{{TITLE_PLAIN}}`, `{{DATE}}`,
`{{DUR}}`, `{{EYEBROW_SE}}`, `{{TAGS}}`, `{{PLAYER_IFRAME}}`, `{{SPOTIFY_EP_URL}}`,
`{{SUMMARY_HTML}}`, `{{QUOTES_SECTION}}`, `{{TRANSCRIPT_HTML}}`, `{{NEWER_NAV}}`,
`{{SLUG}}`, `{{DESC}}`). Keep all 13 tokens present.

## Relationship to the older `podcast-meta-*` pipeline

`podcast-meta-extract.mjs` / `podcast-meta-bake.mjs` still own **search metadata
from transcripts** for episodes already on the site. `podcast-sync.mjs` is the
front half — getting a brand-new episode *onto* the site. They share the sidecar
format (`podcast/<slug>.meta.json`) and the same `intent-box.js` bake target, so
they compose cleanly: sync writes a sidecar from drafts now; extract re-queues it
for a richer pass once a real transcript lands.
