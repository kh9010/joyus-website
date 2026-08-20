// End-to-end through the Worker's own fetch handler, against a local site and
// a stubbed Anthropic endpoint.
//
// The Anthropic call is intercepted at global fetch rather than injected, so
// makeClaudeCaller's real request body and its tool_use parsing are both under
// test, and production carries no test-only seam.

import http from 'node:http';
import { describe, ok, eq, report } from './_harness.mjs';
import worker from '../src/worker.js';
import { buildPassingRead } from './_fixtureRead.mjs';
import { LIMITS } from '../src/store.js';

const HOME = `<!doctype html><html><body>
<header><nav>
  <a href="/">Home</a><a href="/work">Work</a><a href="/about">About</a><a href="/contact">Contact</a>
</nav></header>
<main>
  <h1>Sound that carries a room</h1>
  <p>Mara Feldt designs sound for theatre and installation work.</p>
  <p>The studio has run since 2014 out of a converted mill in Leeds.</p>
  <p>Recent work includes a score for the Vaults Festival and a commission from Site Gallery.</p>
  <p>Every project starts with a week in the room, listening to how it behaves before a single
     microphone is placed. That week decides everything that follows, and it is the part of the
     process that cannot be shortened without the result going thin and generic and forgettable.
     A theatre with a hard back wall wants a different score from a gallery with soft walls and
     visitors who wander, and the difference is audible long before anyone can name it. The work
     is mostly listening, then a small number of decisions made carefully, then a long stretch of
     building the thing those decisions imply. Studios that skip the listening make sound that
     sits on top of a room instead of belonging to it, and audiences feel that even when they
     cannot say why they felt it.</p>
  <p><a class="btn" href="/contact">Start a conversation</a></p>
</main>
<footer><a href="/privacy">Privacy</a> <a href="https://instagram.com/marafeldt">Instagram</a></footer>
</body></html>`;

const ABOUT = `<!doctype html><html><body>
<header><nav><a href="/">Home</a><a href="/work">Work</a></nav></header>
<main>
  <h1>About</h1>
  <p>Mara trained at the Royal Northern College of Music.</p>
  <p>She has taught sound design at Leeds Arts University since 2019.</p>
  <p>Her practice moves between live performance, gallery installation and radio.</p>
</main>
</body></html>`;

const site = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  if (path === '/about') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(ABOUT); return; }
  if (path === '/contact') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<h1>Contact</h1><p>Write to the studio.</p>'); return; }
  if (path === '/work') { res.writeHead(404, { 'content-type': 'text/html' }); res.end('gone'); return; }
  if (path === '/thin') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<h1>Soon</h1><p>Coming soon.</p>'); return; }
  if (path === '/dead') { res.writeHead(403, { 'content-type': 'text/html' }); res.end('no'); return; }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(HOME);
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${site.address().port}`;

// --- stub the Anthropic endpoint -------------------------------------------
const realFetch = globalThis.fetch;
let anthropicCalls = [];
let anthropicMode = 'good';
globalThis.fetch = async (url, init) => {
  const href = typeof url === 'string' ? url : url.url;
  if (!href.startsWith('https://api.anthropic.com/')) return realFetch(url, init);

  const body = JSON.parse(init.body);
  anthropicCalls.push(body);
  const userTurn = body.messages[0].content;
  const factSheet = JSON.parse(userTurn.slice(userTurn.indexOf('```json') + 7, userTurn.lastIndexOf('```')));

  if (anthropicMode === 'error') {
    return new Response('overloaded', { status: 529 });
  }
  const read = buildPassingRead(factSheet);
  if (anthropicMode === 'badThenGood' && anthropicCalls.length === 1) {
    read.one_cut.text = 'A decade of sound made across 47 rooms reaches a visitor as one adjective.';
  }
  return new Response(
    JSON.stringify({
      id: 'msg_test',
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'toolu_1', name: 'emit_read', input: read }],
      usage: { input_tokens: 14000, output_tokens: 1800 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};

// --- fake bindings ----------------------------------------------------------
function fakeEnv() {
  const map = new Map();
  return {
    READS: {
      map,
      async get(k) { return map.has(k) ? map.get(k) : null; },
      async put(k, v) { map.set(k, v); },
    },
    ANTHROPIC_API_KEY: 'sk-ant-test',
  };
}
const ctx = { waitUntil: (p) => { if (p && p.catch) p.catch(() => {}); } };

function post(body, headers = {}) {
  return new Request('https://reader.example/read', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '198.51.100.7', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /read — the happy path');
let env = fakeEnv();
anthropicCalls = [];
let res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), env, ctx);
eq(res.status, 200, 'returns 200');
let payload = await res.json();
eq(payload.read.status, 'read', 'a read comes back');
eq(payload.meta.outcome, 'ok', 'validated on the first attempt');
eq(payload.meta.attempts, 1, 'one model call');
ok(/^[a-z0-9]{8}$/.test(payload.slug), `a slug was minted (${payload.slug})`);
ok(payload.meta.estimated_cost_usd > 0, `spend was estimated ($${payload.meta.estimated_cost_usd})`);
ok(payload.meta.shape_directive.opening_shape, 'the assigned shape directive is recorded');
eq(res.headers.get('Access-Control-Allow-Origin'), '*', 'CORS is open for the front end');

describe('the request the model actually receives');
const call = anthropicCalls[0];
eq(call.model, 'claude-sonnet-5', 'model id');
eq(call.max_tokens, 16000, 'max_tokens leaves room for the whole object');
eq(call.tool_choice, { type: 'tool', name: 'emit_read' }, 'the read is forced through the tool');
eq(call.tools[0].strict, true, 'strict tool use is on');
eq(call.thinking, { type: 'adaptive' }, 'adaptive thinking, the only on-mode for Sonnet 5');
ok(!('temperature' in call), 'no temperature — Sonnet 5 rejects it');
ok(!('budget_tokens' in (call.thinking || {})), 'no budget_tokens — Sonnet 5 rejects it');
eq(call.system[0].cache_control, { type: 'ephemeral' }, 'the 39KB prompt is cached across attempts');
ok(call.system[0].text.startsWith('# JOYUS SITE READ — ANALYSIS PROMPT v4'), 'the system turn is the v4 prompt');
ok(call.messages[0].content.includes('"link_inventory"'), 'the user turn carries the fact sheet');
ok(call.messages[0].content.includes('"shape_directive"'), 'including the assigned shape directive');

describe('GET /read/:slug — the permalink');
res = await worker.fetch(new Request(`https://reader.example/read/${payload.slug}`), env, ctx);
eq(res.status, 200, 'the stored read is served');
const stored = await res.json();
eq(stored.slug, payload.slug, 'the payload knows its own slug');
eq(stored.read.one_cut.text, payload.read.one_cut.text, 'the stored read is the read that was returned');
ok(!JSON.stringify(stored).includes('mara@example.com'), 'the permalink payload carries no email address');
res = await worker.fetch(new Request('https://reader.example/read/zzzzzzzz'), env, ctx);
eq(res.status, 404, 'an unknown slug is a 404');

describe('the repair loop, end to end');
env = fakeEnv();
anthropicCalls = [];
anthropicMode = 'badThenGood';
res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), env, ctx);
payload = await res.json();
eq(payload.meta.outcome, 'ok_after_repair', 'a failing read is repaired, not shipped');
eq(anthropicCalls.length, 2, 'exactly one retry');
ok(/number_not_grounded/.test(anthropicCalls[1].messages[0].content), 'the retry names the violation');

describe('the fail-safe, end to end');
env = fakeEnv();
anthropicCalls = [];
anthropicMode = 'error';
res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), env, ctx);
payload = await res.json();
eq(res.status, 200, 'a model outage is still a 200 to the visitor');
eq(payload.meta.outcome, 'fail_safe', 'the outcome is recorded honestly');
eq(payload.read.status, 'decline_incomplete', 'the honest decline is what ships');
ok(!/API|529|error|failed/i.test(JSON.stringify(payload.read)), 'the visitor is never shown the machinery');
anthropicMode = 'good';

describe('pre-model gates cost nothing');
env = fakeEnv();
anthropicCalls = [];
res = await worker.fetch(post({ url: `${base}/thin`, email: 'mara@example.com' }), env, ctx);
payload = await res.json();
eq(payload.read.status, 'decline_thin', 'a thin site declines');
eq(anthropicCalls.length, 0, 'without a model call');
ok(payload.slug, 'and still gets a permalink');

env = fakeEnv();
res = await worker.fetch(post({ url: `${base}/dead`, email: 'mara@example.com' }), env, ctx);
payload = await res.json();
eq(payload.read.status, 'decline_unfetchable', 'an unreachable site declines');
eq(anthropicCalls.length, 0, 'without a model call');
ok(!/403|forbidden|blocked|firewall/i.test(JSON.stringify(payload.read.decline)), 'and never diagnoses the block to the owner');

describe('input validation and limits');
env = fakeEnv();
res = await worker.fetch(post({ url: base }), env, ctx);
eq(res.status, 400, 'a missing email is rejected');
res = await worker.fetch(post({ url: base, email: 'not-an-email' }), env, ctx);
eq(res.status, 400, 'a malformed email is rejected');
res = await worker.fetch(post({ email: 'mara@example.com' }), env, ctx);
eq(res.status, 400, 'a missing url is rejected');
res = await worker.fetch(post({ url: 'javascript:alert(1)', email: 'mara@example.com' }), env, ctx);
eq(res.status, 400, 'a javascript: url is rejected');
res = await worker.fetch(
  new Request('https://reader.example/read', { method: 'POST', body: 'not json', headers: { 'CF-Connecting-IP': '1.2.3.4' } }),
  env,
  ctx,
);
eq(res.status, 400, 'a non-JSON body is rejected');

env = fakeEnv();
let last;
for (let i = 0; i < LIMITS.READS_PER_IP_PER_HOUR + 1; i++) {
  last = await worker.fetch(post({ url: `${base}/thin`, email: 'mara@example.com' }), env, ctx);
}
eq(last.status, 429, 'the per-IP rate limit returns 429');
ok(last.headers.get('Retry-After'), 'with a Retry-After header');

describe('misconfiguration is reported, not swallowed');
res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), { READS: null }, ctx);
eq(res.status, 500, 'a missing KV binding is a 500 with a clear message');
res = await worker.fetch(new Request('https://reader.example/'), fakeEnv(), ctx);
eq(res.status, 200, 'GET / documents the endpoints');
res = await worker.fetch(new Request('https://reader.example/read', { method: 'OPTIONS' }), fakeEnv(), ctx);
eq(res.status, 204, 'CORS preflight is answered');

globalThis.fetch = realFetch;
site.close();
process.exit(report() > 0 ? 1 : 0);
