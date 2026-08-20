// ---------------------------------------------------------------------------
// CLOUDFLARE WORKER — the whole surface.
//
//   POST /read        { url, email }  -> runs the read, stores it, returns it
//   GET  /read/:slug                  -> the stored read, as JSON (permalink)
//   GET  /                            -> usage
//
// Order of operations, and why:
//   1. validate input            — never spend anything on a malformed request
//   2. per-IP rate limit         — before the fetch, which is the slow part
//   3. daily spend cap           — before the model call, which is the costly part
//   4. fetch + extract           — deterministic, no model involved
//   5. pre-model gate            — unfetchable and thin are answers we already
//                                  have; paying a model to reach them is waste
//   6. model + validate + repair — the only step that can fail expensively
//   7. store under a slug        — every outcome gets a permalink, declines too
//
// Bindings: READS (KV namespace), ANTHROPIC_API_KEY (secret).
// ---------------------------------------------------------------------------

import { buildFactSheet, normalizeInputUrl } from './factSheet.js';
import { makeClaudeCaller, estimateCostUsd } from './model.js';
import { runWithRepair } from './repairLoop.js';
import { checkRateLimit, checkSpendCap, recordSpend, putRead, getRead, newSlug } from './store.js';
import { logSubmission } from './submissionLog.js';
import { SCHEMA_VERSION } from './types.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extraHeaders },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Declines the pipeline produces itself, without a model call. Both are held
 *  to v4's 40-70 word decline rule and asserted in test/test-validator.mjs.
 *  The unfetchable one deliberately diagnoses nothing: v4 forbids status codes,
 *  firewalls or "your site is blocking us" — the reader is a dancer or a coach,
 *  not whoever configured their host. */
function buildGateDecline(gate, siteUrl) {
  const decline =
    gate === 'decline_unfetchable'
      ? {
          observation:
            'Nothing came back from that address on this attempt, so there is no page here to read yet.',
          redirect:
            'Try it once more in a few minutes, or paste the full address of the one page you most want looked at, and it will run against that page instead.',
          exhibit: null,
        }
      : {
          observation:
            'What came back is a single screen of links and images, with no sentences anyone wrote about the work itself.',
          redirect:
            'Two paragraphs in your own words, published on the page rather than pointed to from it, would carry a first-time visitor further than the buttons do.',
          exhibit: null,
        };
  return {
    schema_version: SCHEMA_VERSION,
    site_url: siteUrl,
    status: gate,
    shape_directive_used: null,
    decline,
    self_check: { gated_before_model: true },
  };
}

function publicPayload(slug, siteUrl, read, meta) {
  return {
    slug,
    site_url: siteUrl,
    created_at: new Date().toISOString(),
    read,
    meta,
  };
}

async function handleRead(request, env, ctx) {
  if (!env.READS) return json({ error: 'server misconfigured: KV binding READS is missing' }, 500);
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'server misconfigured: ANTHROPIC_API_KEY is missing' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'body must be JSON: { "url": "...", "email": "..." }' }, 400);
  }

  const siteUrl = normalizeInputUrl(body && body.url);
  if (!siteUrl) return json({ error: 'missing or unusable url' }, 400);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!EMAIL_RE.test(email)) return json({ error: 'a valid email is required' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  const limit = await checkRateLimit(env.READS, ip);
  if (!limit.allowed) {
    return json({ error: `rate limited: ${limit.reason}` }, 429, {
      'Retry-After': String(limit.retryAfterSeconds || 3600),
    });
  }

  const spend = await checkSpendCap(env.READS);
  if (!spend.allowed) {
    return json(
      { error: 'this tool has reached its budget for today; it resets at midnight UTC', spent_usd: spend.spentUsd },
      503,
      { 'Retry-After': '3600' },
    );
  }

  const { factSheet, gate, gateSignals, diagnostics } = await buildFactSheet(siteUrl);

  let read;
  let meta;
  if (gate === 'decline_unfetchable' || gate === 'decline_thin') {
    read = buildGateDecline(gate, siteUrl);
    meta = { attempts: 0, outcome: 'gated_before_model', gate, gate_signals: gateSignals, fetch_record: factSheet.fetch_record };
  } else {
    const callModel = makeClaudeCaller(env.ANTHROPIC_API_KEY, { model: env.MODEL });
    const result = await runWithRepair(factSheet, callModel);
    const cost = result.usages.reduce((n, u) => n + estimateCostUsd(u), 0);
    ctx.waitUntil(recordSpend(env.READS, cost));

    read = result.output;
    meta = {
      attempts: result.attempts,
      outcome: result.status,
      gate,
      gate_signals: gateSignals,
      shape_directive: factSheet.shape_directive,
      fetch_record: factSheet.fetch_record,
      estimated_cost_usd: Math.round(cost * 10000) / 10000,
    };
    if (result.status === 'fail_safe') {
      // Never shown to the visitor; this is the operator's copy of why.
      console.log(
        '[fail-safe]',
        JSON.stringify({ site_url: siteUrl, violations: result.finalViolations, diagnostics: result.internalDiagnostics.map((d) => ({ attempt: d.attempt, codes: d.violations.map((x) => x.code) })) }),
      );
    }
  }

  const slug = newSlug();
  const payload = publicPayload(slug, siteUrl, read, meta);
  await putRead(env.READS, payload, { slug });
  ctx.waitUntil(
    logSubmission(env, {
      slug,
      url: siteUrl,
      email,
      status: read.status,
      attempts: meta.attempts,
      gate,
      created_at: payload.created_at,
    }),
  );

  if (env.DEBUG === 'true') payload.debug = { fetch_diagnostics: diagnostics };
  return json(payload, 200);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (request.method === 'POST' && url.pathname === '/read') {
      try {
        return await handleRead(request, env, ctx);
      } catch (err) {
        console.log('[unhandled]', String((err && err.stack) || err));
        return json({ error: 'the read could not be completed; try again in a few minutes' }, 500);
      }
    }

    if (request.method === 'GET' && url.pathname.startsWith('/read/')) {
      const slug = url.pathname.slice('/read/'.length).replace(/\/$/, '');
      if (!env.READS) return json({ error: 'server misconfigured: KV binding READS is missing' }, 500);
      const stored = await getRead(env.READS, slug);
      if (!stored) return json({ error: 'no read stored under that link' }, 404);
      return json(stored, 200, { 'Cache-Control': 'public, max-age=300' });
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return json({
        service: 'joyus site-read',
        schema_version: SCHEMA_VERSION,
        endpoints: {
          'POST /read': '{ "url": "https://example.com", "email": "you@example.com" }',
          'GET /read/:slug': 'the stored read as JSON',
        },
      });
    }

    return json({ error: 'not found' }, 404);
  },
};
