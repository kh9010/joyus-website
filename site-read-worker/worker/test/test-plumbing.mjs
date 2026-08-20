// Shape rotation, the KV store, the rate limiter and the spend cap — all
// offline, all deterministic.

import { describe, ok, eq, report } from './_harness.mjs';
import { computeShapeDirective } from '../src/shapeRotation.js';
import { OPENING_SHAPES, CUT_SHAPES, BRIDGE_MOVES } from '../src/types.js';
import { putRead, getRead, checkRateLimit, checkSpendCap, recordSpend, LIMITS, newSlug } from '../src/store.js';
import { normalizeInputUrl } from '../src/factSheet.js';
import { TOOL_INPUT_SCHEMA, ANALYSIS_PROMPT } from '../src/analysisPrompt.js';

describe('shape rotation is deterministic per URL and spreads across sites');
const a1 = computeShapeDirective('https://worktheory.ai');
const a2 = computeShapeDirective('https://worktheory.ai');
eq(a1, a2, 'the same URL always gets the same shapes');
eq(computeShapeDirective('https://www.worktheory.ai/'), a1, 'www and a trailing slash do not change the assignment');

const sites = [];
for (let i = 0; i < 300; i++) sites.push(computeShapeDirective(`https://site-${i}.example/`));
for (const [label, list, key] of [
  ['opening', OPENING_SHAPES, 'opening_shape'],
  ['cut', CUT_SHAPES, 'cut_shape'],
  ['bridge', BRIDGE_MOVES, 'bridge_move'],
]) {
  const counts = list.map((s) => sites.filter((d) => d[key] === s).length);
  ok(counts.every((c) => c > 50), `${label} shapes spread across all three (${counts.join('/')} of 300)`);
  ok(sites.every((d) => list.includes(d[key])), `${label} shape is always in the enum`);
}
const triples = new Set(sites.map((d) => `${d.opening_shape}|${d.cut_shape}|${d.bridge_move}`));
eq(triples.size, 27, 'all 27 combinations occur — the three draws are not correlated');

describe('url normalization');
eq(normalizeInputUrl('worktheory.ai'), 'https://worktheory.ai/', 'a bare hostname gets https');
eq(normalizeInputUrl('  https://example.com/x  '), 'https://example.com/x', 'whitespace trimmed');
eq(normalizeInputUrl('javascript:alert(1)'), null, 'a javascript: url is refused');
eq(normalizeInputUrl('not a url'), null, 'a hostname with no dot is refused');
eq(normalizeInputUrl(''), null, 'an empty string is refused');
eq(normalizeInputUrl(null), null, 'a missing url is refused');

describe('KV store: permalinks');
function fakeKV() {
  const map = new Map();
  return {
    map,
    async get(k) { return map.has(k) ? map.get(k) : null; },
    async put(k, v) { map.set(k, v); },
  };
}
const kv = fakeKV();
const slug = newSlug();
ok(/^[a-z0-9]{8}$/.test(slug), `slug is 8 url-safe characters (${slug})`);
await putRead(kv, { slug, site_url: 'https://example.com/', read: { status: 'read' } }, { slug });
const stored = await getRead(kv, slug);
eq(stored.site_url, 'https://example.com/', 'a stored read round-trips');
eq(await getRead(kv, 'nope1234'), null, 'an unknown slug returns null');
eq(await getRead(kv, '../../etc/passwd'), null, 'a path-shaped slug is refused before touching KV');

describe('rate limiting');
const rlKv = fakeKV();
let allowed = 0;
for (let i = 0; i < LIMITS.READS_PER_IP_PER_HOUR + 3; i++) {
  const r = await checkRateLimit(rlKv, '203.0.113.9');
  if (r.allowed) allowed++;
}
eq(allowed, LIMITS.READS_PER_IP_PER_HOUR, `the hourly cap stops at ${LIMITS.READS_PER_IP_PER_HOUR}`);
const other = await checkRateLimit(rlKv, '203.0.113.10');
ok(other.allowed, 'a different address is unaffected');

describe('daily spend cap');
const spendKv = fakeKV();
ok((await checkSpendCap(spendKv)).allowed, 'spending starts allowed');
await recordSpend(spendKv, LIMITS.DAILY_SPEND_USD - 0.01);
ok((await checkSpendCap(spendKv)).allowed, 'just under the cap is still allowed');
await recordSpend(spendKv, 0.02);
ok(!(await checkSpendCap(spendKv)).allowed, 'crossing the cap stops further reads');

describe('the embedded prompt and tool schema');
ok(ANALYSIS_PROMPT.startsWith('# JOYUS SITE READ — ANALYSIS PROMPT v4'), 'the embedded prompt is v4');
ok(ANALYSIS_PROMPT.length > 35000, `the whole prompt is embedded (${ANALYSIS_PROMPT.length} chars)`);
const schemaText = JSON.stringify(TOOL_INPUT_SCHEMA);
ok(!schemaText.includes('$ref'), 'every $ref is inlined for the tool schema');
ok(!schemaText.includes('maxLength'), 'keywords structured outputs reject are stripped');
ok(!schemaText.includes('minItems'), 'array constraints are stripped');
ok(!schemaText.includes('decline_incomplete'), 'the model cannot emit the pipeline-only fail-safe status');
function everyObjectSealed(node, path = '$') {
  if (Array.isArray(node)) return node.every((n, i) => everyObjectSealed(n, `${path}[${i}]`));
  if (!node || typeof node !== 'object') return true;
  if (node.properties && node.additionalProperties !== false) {
    console.log(`        unsealed object at ${path}`);
    return false;
  }
  return Object.entries(node).every(([k, val]) => everyObjectSealed(val, `${path}.${k}`));
}
ok(everyObjectSealed(TOOL_INPUT_SCHEMA), 'every object in the tool schema sets additionalProperties:false');
eq(TOOL_INPUT_SCHEMA.properties.status.enum, ['read', 'decline_product_company', 'decline_thin', 'decline_unfetchable'], 'status enum matches v4');
eq(TOOL_INPUT_SCHEMA.properties.one_cut.properties.shape.enum, CUT_SHAPES, 'cut shapes match the rotation enum');
eq(TOOL_INPUT_SCHEMA.properties.opening.properties.shape.enum, OPENING_SHAPES, 'opening shapes match the rotation enum');
eq(TOOL_INPUT_SCHEMA.properties.bridge.properties.move.enum, BRIDGE_MOVES, 'bridge moves match the rotation enum');

process.exit(report() > 0 ? 1 : 0);
