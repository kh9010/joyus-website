// Containment — the writer's prose measured against the outline it was given.
//
// The writer does not have the site. Its user turn is the outline and nothing
// else, and THAT ABSENCE is what stops it fabricating. Everything here is the
// backstop that proves the absence held, and it is a set-membership test rather
// than a judgment, which is why it can be trusted.
//
// The test that earns its keep is the first one: one invented proper noun, one
// violation, named.

import { describe, ok, eq, report } from './_harness.mjs';
import { buildFixtureFactSheet } from './_fixtureSite.mjs';
import { buildPassingOutline, buildWriterProse } from './_fixtureRead.mjs';
import { assembleRead } from '../src/assemble.js';
import { checkContainment } from '../src/containment.js';
import { writerView } from '../src/promptAssembler.js';

const fs = buildFixtureFactSheet();
const clone = (o) => structuredClone(o);
// The writer's world: the outline minus pass-1's bookkeeping. Containment is
// measured against exactly this, because it is exactly what the writer saw.
const outline = writerView(buildPassingOutline(fs));

function read(mutateProse) {
  const prose = clone(buildWriterProse());
  if (mutateProse) mutateProse(prose);
  return assembleRead(outline, prose, fs.shape_directive, fs.site_url);
}
const codesFor = (mutateProse) => checkContainment(read(mutateProse), outline).map((v) => v.code);

describe('prose that stays inside the outline passes');
const clean = checkContainment(read(), outline);
eq(clean, [], 'the hand-written prose introduces nothing', JSON.stringify(clean));

function trips(label, expectedCode, fn) {
  const got = codesFor(fn);
  ok(got.includes(expectedCode), `${label} -> ${expectedCode}`, `got: ${got.join(', ') || '(none)'}`);
}

describe('one invented proper noun, one violation');
const invented = checkContainment(
  read((p) => {
    p.bridge.text =
      'What nobody can do here is hear you, and until a second of the Vaults Festival score plays in Sheffield it stays a name.';
  }),
  outline,
);
eq(invented.length, 1, 'exactly one violation', JSON.stringify(invented.map((v) => v.code)));
eq(invented[0].code, 'prose_introduces_proper_noun', 'and it is the containment failure');
ok(/Sheffield/.test(invented[0].message), 'the message names the offending token so the writer can find it');

trips('a city added to a venue', 'prose_introduces_proper_noun', (p) => {
  p.skim_read.delivered_vs_handheld.observation =
    'The Vaults Festival score and the Site Gallery commission in Rotherham are told to whoever lands here, and neither one plays.';
});
ok(
  !codesFor((p) => {
    p.opening.text = 'Your front door hands whoever lands there a claim about quality. It never names a thing you would be hired to make.';
  }).includes('prose_introduces_proper_noun'),
  'a sentence-initial capital is grammar, not an invented name',
);

describe('numbers are copied, never inferred');
trips('a number the outline never states', 'prose_introduces_number', (p) => {
  p.strongest_true_thing.text = 'One marked button outranks all 47 of the words above it, so anyone deciding has somewhere to press.';
});
trips('a spelled-out count with nothing behind it', 'prose_introduces_number', (p) => {
  p.gap.what_a_stranger_gets = 'Somebody who never gets you into a room comes away holding seventeen sentences and a menu.';
});
ok(
  !codesFor((p) => {
    p.gap.what_you_have = "You've run the studio since 2014 out of a converted mill in Leeds. You trained at the Royal Northern College of Music.";
  }).includes('prose_introduces_number'),
  'a year the outline carries is fine',
);

describe('only an exhibit quote may sit inside quotation marks');
trips('a quoted string the outline does not quote', 'prose_quote_not_in_outline', (p) => {
  p.opening.text = 'Your front door hands whoever lands there "a quality of listening", and never names a thing you would build.';
});
ok(
  !codesFor((p) => {
    p.opening.text = 'Your front door opens on "Sound that carries a room", and never names a thing you would be hired to make.';
  }).includes('prose_quote_not_in_outline'),
  'an exhibit quote reproduced exactly is fine',
);

describe('every plan entry rendered once, in plan order');
trips('a finding rendered twice', 'finding_rendered_twice', (p) => {
  p.lane_verdicts.push({ ...clone(p.lane_verdicts[1]), bold_line: null });
});
trips('a finding the plan lists and the read drops', 'finding_not_rendered', (p) => {
  p.lane_verdicts.pop();
});
trips('the findings reordered', 'finding_order_changed', (p) => {
  const [a, b, c] = p.lane_verdicts;
  p.lane_verdicts = [b, a, c];
});

describe('bold appears exactly where the plan put it, and nowhere else');
trips('an unplanned bold restatement beside a finding', 'bold_line_not_planned', (p) => {
  p.lane_verdicts[1].bold_line = 'Your story lands third, under a line about sound.';
});
trips('the designated bold line missing', 'planned_bold_line_missing', (p) => {
  p.lane_verdicts[0].bold_line = null;
});
trips('bold markup smuggled into a sentence', 'inline_bold_markup', (p) => {
  p.lane_verdicts[1].evidence = 'A decade in a converted mill is **the strongest sentence you have**, and it lands third on the page.';
});

describe('nothing follows the bridge');
trips('a kicker after the bridge', 'content_after_bridge', (p) => {
  p.bridge.text = `${p.bridge.text} That is the whole of it.`;
  p.bridge.concrete_anchor = 'the About page';
});
ok(
  codesFor((p) => {
    p.bridge.text = `${p.bridge.text} That is the whole of it.`;
    p.bridge.concrete_anchor = 'the About page';
  }).includes('anchor_not_a_candidate') === false,
  'the About page is a real candidate, so only the trailing line is flagged',
);

describe('the anchor came from the candidate list');
trips('an anchor the outline never offered', 'anchor_not_a_candidate', (p) => {
  p.bridge.text = 'What nobody can do here is hear you, and until the converted mill is on the page it stays a name.';
  p.bridge.concrete_anchor = 'the converted mill';
});

describe('the bridge names a change, not a state');
trips('a bridge that is a finding in other words', 'bridge_restates_finding', (p) => {
  p.lane_verdicts[1].evidence =
    'A decade in a converted mill is the strongest sentence you have written down anywhere, and it lands third on the page, underneath a line about sound.';
  p.bridge.text =
    'A decade inside a converted mill is the strongest sentence written down anywhere here, landing third on the page underneath a line about sound, the Vaults Festival included.';
  p.bridge.concrete_anchor = 'the Vaults Festival';
});

describe('the graft refuses material the outline does not carry');
let threw = null;
try {
  assembleRead(outline, (() => { const p = clone(buildWriterProse()); p.lane_verdicts[0].finding_id = 'f9'; return p; })(), fs.shape_directive, fs.site_url);
} catch (err) {
  threw = String(err.message);
}
ok(threw && /f9/.test(threw), 'an unknown finding_id throws rather than grafting silently', String(threw));

process.exit(report() > 0 ? 1 : 0);
