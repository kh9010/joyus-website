// Shape rotation, the KV store, the rate limiter and the spend cap — all
// offline, all deterministic.

import { describe, ok, eq, report } from './_harness.mjs';
import { computeShapeDirective } from '../src/shapeRotation.js';
import { OPENING_SHAPES, BRIDGE_MOVES } from '../src/types.js';
import { putRead, getRead, checkRateLimit, checkSpendCap, recordSpend, LIMITS, newSlug } from '../src/store.js';
import { normalizeInputUrl } from '../src/factSheet.js';
import { OUTLINE_PROMPT, OUTLINE_TOOL_SCHEMA } from '../src/outlinePrompt.js';
import { WRITER_PROMPT, WRITER_TOOL_SCHEMA, READ_SCHEMA, WRITER_EMITS } from '../src/writerPrompt.js';

describe('shape rotation is deterministic per URL and spreads across sites');
const a1 = computeShapeDirective('https://worktheory.ai');
const a2 = computeShapeDirective('https://worktheory.ai');
eq(a1, a2, 'the same URL always gets the same shapes');
eq(computeShapeDirective('https://www.worktheory.ai/'), a1, 'www and a trailing slash do not change the assignment');

const sites = [];
for (let i = 0; i < 300; i++) sites.push(computeShapeDirective(`https://site-${i}.example/`));
for (const [label, list, key] of [
  ['opening', OPENING_SHAPES, 'opening_shape'],
  ['bridge', BRIDGE_MOVES, 'bridge_move'],
]) {
  const counts = list.map((s) => sites.filter((d) => d[key] === s).length);
  ok(counts.every((c) => c > 50), `${label} shapes spread across all three (${counts.join('/')} of 300)`);
  ok(sites.every((d) => list.includes(d[key])), `${label} shape is always in the enum`);
}
const pairs = new Set(sites.map((d) => `${d.opening_shape}|${d.bridge_move}`));
eq(pairs.size, OPENING_SHAPES.length * BRIDGE_MOVES.length, `all ${OPENING_SHAPES.length * BRIDGE_MOVES.length} combinations occur — the two draws are not correlated`);
ok(sites.every((d) => !('cut_shape' in d)), 'no cut shape is assigned — the cut was removed in 5.2');

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

describe('the two embedded prompts');
ok(OUTLINE_PROMPT.startsWith('# JOYUS SITE READ — PASS 1: THE OUTLINE (PERCEPTION) v5.3'), 'the outline prompt is v5.3');
ok(WRITER_PROMPT.startsWith('# JOYUS SITE READ — PASS 2: THE WRITER (PROSE) v5.3'), 'the writer prompt is v5.3');
ok(OUTLINE_PROMPT.length > 40000, `the whole outline prompt is embedded (${OUTLINE_PROMPT.length} chars)`);
ok(WRITER_PROMPT.length > 30000, `the whole writer prompt is embedded (${WRITER_PROMPT.length} chars)`);
ok(WRITER_PROMPT.indexOf('THE ONE RULE, BEFORE ANYTHING ELSE') < 200, 'plan compliance is the FIRST instruction the writer reads');
ok(
  WRITER_PROMPT.lastIndexOf('THE ONE RULE, AGAIN') > WRITER_PROMPT.length - 4000,
  'and it is restated as the last thing before OUTPUT',
);
ok(OUTLINE_PROMPT.includes('cross-node entailment sweep'), 'the outline prompt carries the 5.3 sweep');
ok(OUTLINE_PROMPT.includes('source_span'), 'and the source-span rule');
ok(OUTLINE_PROMPT.includes('sample_captions'), 'and reads embedded-feed captions as copy');

describe('the tool schemas');
function assertSchemaClean(schema, label) {
  const text = JSON.stringify(schema);
  ok(!text.includes('$ref'), `${label}: every $ref is inlined`);
  ok(!text.includes('maxLength'), `${label}: keywords structured outputs reject are stripped`);
  ok(!text.includes('minItems'), `${label}: array constraints are stripped`);
  ok(!hasKeyAnywhere(schema, 'x_source'), `${label}: pipeline annotations never reach the endpoint`);
  ok(!hasKeyAnywhere(schema, 'definitions'), `${label}: no dead definitions block rides along`);
  ok(everyObjectSealed(schema), `${label}: every object sets additionalProperties:false`);
}
function hasKeyAnywhere(node, key) {
  if (Array.isArray(node)) return node.some((n) => hasKeyAnywhere(n, key));
  if (!node || typeof node !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(node, key)) return true;
  return Object.values(node).some((val) => hasKeyAnywhere(val, key));
}
function everyObjectSealed(node, path = '$') {
  if (Array.isArray(node)) return node.every((n, i) => everyObjectSealed(n, `${path}[${i}]`));
  if (!node || typeof node !== 'object') return true;
  if (node.properties && node.additionalProperties !== false) {
    console.log(`        unsealed object at ${path}`);
    return false;
  }
  return Object.entries(node).every(([k, val]) => everyObjectSealed(val, `${path}.${k}`));
}
assertSchemaClean(OUTLINE_TOOL_SCHEMA, 'outline schema');
assertSchemaClean(WRITER_TOOL_SCHEMA, 'writer schema');
assertSchemaClean(READ_SCHEMA, 'read schema');

ok(!JSON.stringify(READ_SCHEMA).includes('decline_incomplete'), 'the model cannot emit the pipeline-only fail-safe status');
// Structural, not textual: the prompts' own descriptions still name the cut in
// order to say it is gone, and that sentence is doing work.
ok(!READ_SCHEMA.properties.one_cut, 'there is no one_cut property left in the read schema');
ok(!OUTLINE_TOOL_SCHEMA.properties.one_cut_idea, 'and no one_cut_idea in the outline schema');
ok(OUTLINE_TOOL_SCHEMA.properties.bold_designation, 'the bold designation replaced it');
ok(OUTLINE_TOOL_SCHEMA.properties.render_plan && OUTLINE_TOOL_SCHEMA.properties.claim_ledger, 'the outline carries a render plan and a claim ledger');
ok(OUTLINE_TOOL_SCHEMA.properties.truth_check.properties.render_plan_check.properties.cross_node_entailment_swept, 'and records the 5.3 sweep');
eq(READ_SCHEMA.properties.opening.properties.shape.enum, OPENING_SHAPES, 'opening shapes match the rotation enum');
eq(READ_SCHEMA.properties.bridge.properties.move.enum, BRIDGE_MOVES, 'bridge moves match the rotation enum');

describe('the writer emits prose and nothing else');
ok(!hasKeyAnywhere(WRITER_TOOL_SCHEMA, 'exhibit'), 'no exhibit is authored by the writer — every one is grafted');
ok(!WRITER_TOOL_SCHEMA.properties.coverage, 'coverage is chrome, grafted from the outline');
ok(!WRITER_TOOL_SCHEMA.properties.lane_selection, 'lane selection is grafted too');
ok(!WRITER_TOOL_SCHEMA.properties.shape_directive_used, 'the directive is echoed by the pipeline, not the model');
ok(WRITER_TOOL_SCHEMA.properties.bridge.properties.text, 'the writer does emit the bridge text');
ok(!WRITER_TOOL_SCHEMA.properties.bridge.properties.move, 'and not its assigned move');
ok(WRITER_EMITS.includes('self_check.nothing_after_bridge'), 'the writer attests that nothing follows the bridge');
ok(WRITER_EMITS.includes('self_check.bold_only_where_planned'), 'and that bold appears only where the plan put it');

process.exit(report() > 0 ? 1 : 0);
