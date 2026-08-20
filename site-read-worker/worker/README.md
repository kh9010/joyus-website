# Joyus site-read — Cloudflare Worker

A visitor drops a URL and an email. The worker fetches the site, computes a
deterministic fact sheet from it, hands that to Claude with the v4 analysis
prompt, checks what comes back against ~45 mechanical rules, retries once with
the specific failures named, and stores the result under a short slug.

Nothing about the read is left to the model that code can settle: every count,
every placement claim and every quote is resolved before the model sees it, and
re-checked after.

## Endpoints

```
POST /read        { "url": "example.com", "email": "you@example.com" }
                  -> 200 { slug, site_url, created_at, read, meta }

GET  /read/:slug  -> 200 the same payload (permalink, cached 5 min)
GET  /            -> usage
```

`read` is the v4 output object (`v4-output-schema.json`). `meta` carries the
outcome (`ok` · `ok_after_repair` · `fail_safe` · `gated_before_model`), the
attempt count, the assigned shape directive, the fetch record and the estimated
cost. The stored payload never contains the email address.

## Modules

| File | What it owns |
|---|---|
| `src/html.js` | Tokenizer + entity decoding. The only parser. |
| `src/extractor.js` | One page → verbatim text, ordered `blocks[]`, links. |
| `src/fetcher.js` | Escalating fetch chain, byte cap, enforced redirect cap. |
| `src/factSheet.js` | Crawl per the fetch contract, build `link_inventory` (doors, dropdown parents, CTAs, socials, click distance), assemble v4's fact sheet, run the pre-model gates. |
| `src/shapeRotation.js` | URL-seeded assignment of opening / cut / bridge shape. |
| `src/analysisPrompt.js` | **Generated.** The v4 prompt verbatim + the flattened tool schema. |
| `src/promptAssembler.js` | The two turns sent to the model. |
| `src/model.js` | Messages API call, structured output through a strict tool. |
| `src/validator.js` | Every deterministic check, and the repair note. |
| `src/repairLoop.js` | Call → validate → one retry → fail-safe. |
| `src/store.js` | KV: permalinks, per-IP limits, daily spend cap. |
| `src/submissionLog.js` | **Stub.** Firestore write, with the shape settled and a TODO. |
| `src/worker.js` | Routes, ordering, CORS. |

The prompt has one home: `../v4-analysis-prompt.md`. `npm run embed-prompt`
regenerates `src/analysisPrompt.js` from it and from `../v4-output-schema.json`.
Never hand-edit the generated file — a second copy of the prompt is a second
version of it, and whichever one a session happens to read wins by accident.

## Attended deploy

Nothing below runs on its own. Each step is a decision.

**1. Authenticate.**

```sh
npm install -g wrangler        # or: npx wrangler@latest <command>
wrangler login                 # opens a browser; pick the right Cloudflare account
wrangler whoami                # confirm the account before anything else
```

**2. Create the KV namespace** and paste the id into `wrangler.toml`. The
placeholder in there will not deploy.

```sh
wrangler kv namespace create READS
# -> id = "0123456789abcdef0123456789abcdef"   ← paste into [[kv_namespaces]].id
```

One namespace holds three things: `read:<slug>` payloads, `rl:*` rate-limit
counters, and `spend:<date>`.

**3. Set the API key** as a secret. It never goes in `wrangler.toml`.

```sh
wrangler secret put ANTHROPIC_API_KEY
# paste the key at the prompt
```

**4. Dry-run locally**, against the real KV namespace:

```sh
wrangler dev --remote
curl -s localhost:8787/read -H 'content-type: application/json' \
  -d '{"url":"worktheory.ai","email":"you@example.com"}' | jq '.meta, .read.status'
```

That is a real model call and real money. Watch `meta.estimated_cost_usd`.

**5. Deploy.**

```sh
wrangler deploy
```

**6. Smoke-test the deployed worker**, including the permalink:

```sh
SLUG=$(curl -s https://joyus-site-read.<subdomain>.workers.dev/read \
  -H 'content-type: application/json' \
  -d '{"url":"worktheory.ai","email":"you@example.com"}' | jq -r .slug)
curl -s https://joyus-site-read.<subdomain>.workers.dev/read/$SLUG | jq .read.status
```

**Before pointing the site at it**, decide two numbers in `src/store.js`:
`READS_PER_IP_PER_HOUR` (5) and `DAILY_SPEND_USD` (25). A read costs roughly
$0.05–0.15 at Sonnet 5 rates, so the daily cap is about 150–450 reads.

## Tests

```sh
node test/run-all.mjs             # everything (one suite needs the internet)
node test/run-all.mjs --offline   # skip the live-site suite
```

No install, no build step — the suites import `src/` directly.

| Suite | Covers |
|---|---|
| `test-extractor.mjs` | Hidden content, inline markup, entities, empty labels, fragment menus, galleries, embeds, block order, malformed HTML. |
| `test-fetcher.mjs` | 403/503 escalation, no escalation on a 404, redirect cap, byte cap, content type. Local server. |
| `test-validator.mjs` | Every check, each with a mutation that trips it, plus the repair loop and the fail-safe. |
| `test-plumbing.mjs` | Shape rotation distribution, URL normalization, KV store, rate limit, spend cap, generated tool schema. |
| `test-worker.mjs` | Both routes end to end, with the Anthropic endpoint stubbed at `fetch` so the real request body is under test. |
| `test-real-sites.mjs` | Fetch + extract + fact sheet against four live sites. |

`npm run typecheck` runs `tsc --checkJs` over the JSDoc annotations. It is
optional and TypeScript is not a dependency; the code runs without it.

## Why it is shaped this way

Two candidate pipelines were built and judged. The extractor core here is the
minimal one — it was right at the root about the things that are expensive to
get wrong (whole headings rather than first text nodes, hidden-content
exclusion, footer-beats-nav placement). Grafted onto it from the structured one:
the validator's stricter checks, the verbatim prompt embed with a regenerator,
the module split, and a real model call.

The judged defects are all fixed, and each has a test:

- The Workers-only HTMLRewriter branch is **deleted**. It was the code that ran
  in production and the one path nothing could test.
- Block boundaries now separate, so `You run the business.You do the work.`
  cannot happen. Inline markup still stays glued.
- Full entity table, and attribute values are decoded too — an undecoded
  `&amp;` in an href is a URL that resolves somewhere else.
- Anchors with no visible label are dropped; alt text and `aria-label` can
  supply one.
- Fragment menus stay distinct, so a one-page site keeps all four of its doors.
- Number grounding no longer reads the model's own `self_check` — laundering
  your own count through a self-report is not grounding.
- The banned-string sweep is word-boundary, so `research`, `March` and
  `Melanie` no longer trip the bans on `arc` and `lane`.
- `REDIRECT_CAP` is enforced rather than declared.
- `wrangler.toml` exists.

Two extra defects turned up while testing against the live sites and are fixed
here: `<br>` was splitting a heading in two (which halved worktheory.ai's
computed first-screen headline), and a row of linked Instagram posts was being
reported as thirteen social links.

## Known limitations

Stated plainly, because a limitation you find later costs more than one you read
first.

- **No layout engine, and no external CSS.** Anything hidden by a rule in a
  linked stylesheet is invisible to us. josephlogan.com's h1 carries a
  duplicated word from a CSS-hidden sizer span, so its computed headline reads
  `Something is changing with work.work.` Confirmed unfixable without fetching
  and applying the site's CSS. Inline `display:none`, `hidden`, `aria-hidden`
  and the common `sr-only` class names are all handled.
- **KV counters are soft caps.** Workers KV is eventually consistent and has no
  atomic increment, so concurrent requests can both read the same counter. These
  stop a runaway; they are not an exact quota. A Durable Object is the drop-in
  upgrade if the spend cap ever has to be a financial guarantee.
- **The submission log writes nothing yet.** `src/submissionLog.js` carries the
  document shape and the implementation sketch.
- **The banned-word list is strict by design.** v4 bans some ordinary words in
  rendered prose (`covered`, `finding`, `separately`, `rhythm`). A false
  positive costs one repair round, which is the cheaper failure than letting an
  audit-flavoured word through — but if reads start failing on one specific
  word, that word is the first place to look.
- **Duplicated menus.** Squarespace renders the same nav two or three times for
  responsive layouts; the model sees the menu repeated in the page text. Door
  counts are deduped by destination, so the numbers stay right.
- **`decline_product_company` is the model's call**, per STEP 0. The pipeline's
  own heuristic only appears in `meta.gate_signals`.
- **`decline_incomplete` is pipeline-only.** It is the fail-safe's status and is
  deliberately absent from the model's tool schema, so it can only ever come
  from `repairLoop.js`. Any front end rendering `read.status` needs a branch for
  it.

## Why raw fetch, not `@anthropic-ai/sdk`

The SDK is the better default in a project that already has a package tree. This
worker has no dependencies and no build step, which is what lets `wrangler
deploy` ship `src/` as-is and lets the whole test suite run on a clean checkout
with nothing installed. The model call is thirty lines against a documented
endpoint. If a package tree arrives here for other reasons, `src/model.js` is
the only file that changes.
