// End-to-end through the Worker's own fetch handler, against a local site and
// a stubbed Anthropic endpoint.
//
// The Anthropic call is intercepted at global fetch rather than injected, so
// makeClaudeCaller's real request body and its tool_use parsing are both under
// test, and production carries no test-only seam.

import http from 'node:http';
import { describe, ok, eq, report } from './_harness.mjs';
import worker from '../src/worker.js';
import { buildPassingOutline, buildWriterProse } from './_fixtureRead.mjs';
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
let outlineCalls = 0;
let proseCalls = 0;
globalThis.fetch = async (url, init) => {
  const href = typeof url === 'string' ? url : url.url;
  if (!href.startsWith('https://api.anthropic.com/')) return realFetch(url, init);

  const body = JSON.parse(init.body);
  anthropicCalls.push(body);
  const toolName = body.tools[0].name;
  const userTurn = body.messages[0].content;
  // Both stages fence their input the same way; which object it is depends on
  // which tool the pipeline forced.
  const firstFence = JSON.parse(userTurn.slice(userTurn.indexOf('```json') + 7, userTurn.indexOf('```', userTurn.indexOf('```json') + 7)));

  if (anthropicMode === 'error') {
    return new Response('overloaded', { status: 529 });
  }

  let output;
  if (toolName === 'emit_outline') {
    outlineCalls++;
    output = buildPassingOutline(firstFence);
  } else {
    proseCalls++;
    output = buildWriterProse();
    if (anthropicMode === 'badThenGood' && proseCalls === 1) {
      // An ungrounded number: a writer failure, which must re-run the WRITER
      // and not re-perceive the site.
      output.strongest_true_thing.text =
        'One marked button outranks all 47 of the words above it, so anyone deciding has somewhere to press.';
    }
  }

  return new Response(
    JSON.stringify({
      id: 'msg_test',
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'toolu_1', name: toolName, input: output }],
      usage: { input_tokens: toolName === 'emit_outline' ? 14000 : 1200, output_tokens: 1800 },
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
outlineCalls = 0;
proseCalls = 0;
let res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), env, ctx);
eq(res.status, 200, 'returns 200');
let payload = await res.json();
eq(payload.read.status, 'read', 'a read comes back');
eq(payload.meta.outcome, 'ok', 'validated on the first attempt');
eq(payload.meta.attempts, 2, 'two model calls — one outline, one writer');
eq(payload.meta.outline_attempts, 1, 'one outline attempt');
eq(payload.meta.writer_attempts, 1, 'one writer attempt');
eq(outlineCalls, 1, 'the outline stage ran once');
eq(proseCalls, 1, 'the writer stage ran once');
ok(/^[a-z0-9]{8}$/.test(payload.slug), `a slug was minted (${payload.slug})`);
ok(payload.meta.estimated_cost_usd > 0, `spend was estimated ($${payload.meta.estimated_cost_usd})`);
ok(payload.meta.shape_directive.opening_shape, 'the assigned shape directive is recorded');
eq(res.headers.get('Access-Control-Allow-Origin'), '*', 'CORS is open for the front end');

describe('the two requests the model actually receives');
const outlineCall = anthropicCalls[0];
const proseCall = anthropicCalls[1];
eq(outlineCall.model, 'claude-sonnet-5', 'model id');
eq(outlineCall.max_tokens, 16000, 'the outline gets room for the whole object');
eq(proseCall.max_tokens, 4000, 'the writer gets room for 250-400 words and a thin wrapper');
eq(outlineCall.tool_choice, { type: 'tool', name: 'emit_outline' }, 'pass 1 is forced through emit_outline');
eq(proseCall.tool_choice, { type: 'tool', name: 'emit_prose' }, 'pass 2 through emit_prose');
eq(outlineCall.tools[0].strict, true, 'strict tool use is on');
eq(proseCall.tools[0].strict, true, 'on both calls');
eq(outlineCall.thinking, { type: 'adaptive' }, 'adaptive thinking, the only on-mode for Sonnet 5');
ok(!('temperature' in outlineCall), 'no temperature — Sonnet 5 rejects it');
ok(!('budget_tokens' in (outlineCall.thinking || {})), 'no budget_tokens — Sonnet 5 rejects it');
eq(outlineCall.system[0].cache_control, { type: 'ephemeral' }, 'the outline prompt is cached across every read');
eq(proseCall.system[0].cache_control, { type: 'ephemeral' }, 'and the writer prompt across its attempts');
ok(outlineCall.system[0].text.startsWith('# JOYUS SITE READ — PASS 1'), 'the first system turn is the outline prompt');
ok(proseCall.system[0].text.startsWith('# JOYUS SITE READ — PASS 2'), 'the second is the writer prompt');
ok(outlineCall.messages[0].content.includes('"link_inventory"'), 'the outline turn carries the fact sheet');
ok(!outlineCall.messages[0].content.includes('"shape_directive"'), 'and NOT the shape directive, which is assigned to the writer');

describe('the writer is walled off from the site');
ok(!proseCall.messages[0].content.includes('"link_inventory"'), 'THE WRITER TURN CARRIES NO FACT SHEET');
ok(!proseCall.messages[0].content.includes('"fetch_record"'), 'no fetch record either');
ok(proseCall.messages[0].content.includes('"render_plan"'), 'it carries the outline and its render plan');
ok(proseCall.messages[0].content.includes('"opening_shape"'), 'and the assigned shape directive');
ok(!proseCall.messages[0].content.includes('"negative_claims"'), "and NOT pass 1's bookkeeping — truth_check never reaches the writer");
ok(!proseCall.messages[0].content.includes('"truth_check"'), 'the writer is handed the writer view of the outline');

describe('GET /read/:slug — the permalink');
res = await worker.fetch(new Request(`https://reader.example/read/${payload.slug}`), env, ctx);
eq(res.status, 200, 'the stored read is served');
const stored = await res.json();
eq(stored.slug, payload.slug, 'the payload knows its own slug');
eq(stored.read.bridge.text, payload.read.bridge.text, 'the stored read is the read that was returned');
ok(!('one_cut' in stored.read), 'and it carries no one_cut');
ok(!JSON.stringify(stored).includes('mara@example.com'), 'the permalink payload carries no email address');
res = await worker.fetch(new Request('https://reader.example/read/zzzzzzzz'), env, ctx);
eq(res.status, 404, 'an unknown slug is a 404');

describe('the repair loop, end to end');
env = fakeEnv();
anthropicCalls = [];
outlineCalls = 0;
proseCalls = 0;
anthropicMode = 'badThenGood';
res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), env, ctx);
payload = await res.json();
eq(payload.meta.outcome, 'ok_after_repair', 'failing prose is repaired, not shipped');
eq(proseCalls, 2, 'exactly one writer retry');
eq(outlineCalls, 1, 'and PASS 1 WAS NOT RE-RUN — a prose repair may only change words');
ok(/number_not_grounded/.test(anthropicCalls[2].messages[0].content), 'the retry names the violation');
ok(/outline is unchanged/.test(anthropicCalls[2].messages[0].content), 'and tells the writer its material has not moved');

describe('the fail-safe, end to end');
env = fakeEnv();
anthropicCalls = [];
outlineCalls = 0;
proseCalls = 0;
anthropicMode = 'error';
res = await worker.fetch(post({ url: base, email: 'mara@example.com' }), env, ctx);
payload = await res.json();
eq(res.status, 200, 'a model outage is still a 200 to the visitor');
eq(payload.meta.outcome, 'fail_safe', 'the outcome is recorded honestly');
eq(payload.read.status, 'decline_incomplete', 'the honest decline is what ships');
eq(proseCalls, 0, 'and the writer never ran, because the outline never came back');
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
