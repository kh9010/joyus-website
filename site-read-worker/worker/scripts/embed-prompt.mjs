// Regenerates src/outlinePrompt.js and src/writerPrompt.js from the four v5.3
// source files.
//
//   node scripts/embed-prompt.mjs
//
// Each prompt has exactly one home — ../analysis-prompt-outline.md and
// ../analysis-prompt-writer.md — and this script is the only thing that copies
// them. Hand-editing the generated modules creates a second version of a prompt
// that will win by accident in whichever session happens to read it.
//
// It emits three schemas:
//
//   OUTLINE_TOOL_SCHEMA  the outline schema, $refs inlined, unsupported JSON
//                        Schema keywords stripped.
//   READ_SCHEMA          the full read schema, same treatment. The pipeline's
//                        target shape; nothing is ever sent to the model as it.
//   WRITER_TOOL_SCHEMA   DERIVED from READ_SCHEMA by keeping only the
//                        properties annotated `"x_source": "writer"`. The writer
//                        emits prose fields and nothing else; every other field
//                        is grafted from the outline by src/assemble.js.
//
// The derivation is asserted against the schema's own `x_writer_emits` array —
// the same list in flat form. A mismatch means the annotation and the list have
// drifted apart, which is exactly what the list exists to catch.
//
// The stripped limits (maxLength/minItems/pattern/…) are not lost: the
// validators enforce the ones that matter, after the model emits, which is
// where the prompts say they belong.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = join(root, '..');

const OUTLINE_PROMPT_PATH = join(source, 'analysis-prompt-outline.md');
const OUTLINE_SCHEMA_PATH = join(source, 'analysis-prompt-outline-schema.json');
const WRITER_PROMPT_PATH = join(source, 'analysis-prompt-writer.md');
const WRITER_SCHEMA_PATH = join(source, 'analysis-prompt-writer-schema.json');

export const PROMPT_VERSION = 'v5.3';

const UNSUPPORTED = new Set([
  'maxLength', 'minLength', 'pattern', 'minimum', 'maximum',
  'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'minItems', 'maxItems', 'uniqueItems', 'default', 'examples',
  '$schema', 'title',
  // Pipeline annotations, not JSON Schema. They drive the graft and the writer
  // derivation; leaving them in the payload risks the structured-outputs
  // endpoint rejecting an unknown keyword.
  'x_source', 'x_writer_emits',
]);

function sanitize(node, defs, seen = 0) {
  if (seen > 40) throw new Error('schema nesting too deep — recursive $ref?');
  if (Array.isArray(node)) return node.map((n) => sanitize(n, defs, seen + 1));
  if (node === null || typeof node !== 'object') return node;

  if (typeof node.$ref === 'string') {
    const path = node.$ref.replace(/^#\//, '').split('/');
    let target = { definitions: defs };
    for (const seg of path) target = target[seg];
    if (!target) throw new Error(`unresolvable $ref ${node.$ref}`);
    const merged = { ...target, ...node };
    delete merged.$ref;
    return sanitize(merged, defs, seen + 1);
  }

  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (UNSUPPORTED.has(k)) continue;
    out[k] = sanitize(v, defs, seen + 1);
  }
  // Structured outputs require additionalProperties:false on every object.
  if (out.type === 'object' || (Array.isArray(out.type) && out.type.includes('object')) || out.properties) {
    out.additionalProperties = false;
  }
  return out;
}

function inline(schema) {
  const defs = schema.definitions || {};
  const flat = sanitize({ ...schema, definitions: undefined }, defs);
  delete flat.definitions;
  return flat;
}

// --- writer derivation ------------------------------------------------------
// Walk the ANNOTATED schema (x_source intact) and keep only the writer's own
// properties, collecting their flat dotted paths as we go so the result can be
// checked against x_writer_emits.

function deriveWriter(node, defs, path, emitted, seen = 0) {
  if (seen > 40) throw new Error('schema nesting too deep — recursive $ref?');
  if (node === null || typeof node !== 'object') return node;

  if (typeof node.$ref === 'string') {
    const segs = node.$ref.replace(/^#\//, '').split('/');
    let target = { definitions: defs };
    for (const seg of segs) target = target[seg];
    if (!target) throw new Error(`unresolvable $ref ${node.$ref}`);
    const merged = { ...target, ...node };
    delete merged.$ref;
    return deriveWriter(merged, defs, path, emitted, seen + 1);
  }

  // allOf/anyOf wrappers. The read schema uses `allOf: [$ref]` to attach a
  // per-dimension description to a shared definition, and `anyOf: [$ref, null]`
  // to make one nullable. Walk the members; a member with nothing writer-owned
  // in it contributes nothing.
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (!Array.isArray(node[key])) continue;
    const before = emitted.length;
    const kept = node[key]
      .map((m) => deriveWriter(m, defs, path, emitted, seen + 1))
      .filter((m) => m !== null && m !== undefined);
    if (emitted.length === before || kept.length === 0) return null;
    const merged = {};
    for (const m of kept) {
      for (const [k, val] of Object.entries(m)) {
        if (k === 'properties') merged.properties = { ...(merged.properties || {}), ...val };
        else if (k === 'required') merged.required = [...new Set([...(merged.required || []), ...val])];
        else if (merged[k] === undefined) merged[k] = val;
      }
    }
    if (node.description && !merged.description) merged.description = node.description;
    return merged;
  }

  const out = {};
  for (const [k, val] of Object.entries(node)) {
    if (k === 'properties' || k === 'items' || k === 'required') continue;
    out[k] = val;
  }

  if (node.items) {
    const kept = deriveWriter(node.items, defs, `${path}[]`, emitted, seen + 1);
    if (kept === null) return null;
    out.items = kept;
    return out;
  }

  if (node.properties) {
    const props = {};
    for (const [key, val] of Object.entries(node.properties)) {
      const childPath = path ? `${path}.${key}` : key;
      const resolved = val && typeof val.$ref === 'string' ? { ...defs[val.$ref.split('/').pop()], ...val } : val;
      const src = (val && val.x_source) || (resolved && resolved.x_source);
      if (src === 'graft') continue;
      if (src === 'writer') {
        emitted.push(childPath);
        props[key] = deriveWriter(val, defs, childPath, [], seen + 1);
        continue;
      }
      // Unannotated container: keep it only if something writer-owned survives
      // inside it. This is what drops `strongest_true_thing` when the writer has
      // nothing to say there, and keeps it when it has `text`.
      const before = emitted.length;
      const kept = deriveWriter(val, defs, childPath, emitted, seen + 1);
      if (kept !== null && emitted.length > before) props[key] = kept;
    }
    if (Object.keys(props).length === 0) return null;
    out.properties = props;
    if (Array.isArray(node.required)) {
      const req = node.required.filter((r) => Object.prototype.hasOwnProperty.call(props, r));
      if (req.length) out.required = req;
    }
    out.additionalProperties = false;
    return out;
  }

  return out;
}

function stripAnnotations(node, defs) {
  return sanitize(node, defs);
}

// --- build ------------------------------------------------------------------

const outlineMd = readFileSync(OUTLINE_PROMPT_PATH, 'utf8');
const writerMd = readFileSync(WRITER_PROMPT_PATH, 'utf8');
const outlineSchema = JSON.parse(readFileSync(OUTLINE_SCHEMA_PATH, 'utf8'));
const readSchema = JSON.parse(readFileSync(WRITER_SCHEMA_PATH, 'utf8'));

const outlineFlat = inline(outlineSchema);
const readFlat = inline(readSchema);

const emitted = [];
const writerDerived = deriveWriter(readSchema, readSchema.definitions || {}, '', emitted);
if (!writerDerived) throw new Error('writer derivation produced nothing — is x_source missing from the read schema?');
const writerFlat = stripAnnotations(writerDerived, readSchema.definitions || {});
// The derivation copies top-level keys through; `definitions` among them is a
// block of dead shapes nothing in the derived schema references any more.
delete writerFlat.definitions;

// The assertion the annotation list exists for.
const declared = [...(readSchema.x_writer_emits || [])].sort();
const derived = [...new Set(emitted)].sort();
const missing = declared.filter((k) => !derived.includes(k));
const extra = derived.filter((k) => !declared.includes(k));
if (missing.length || extra.length) {
  throw new Error(
    'x_writer_emits has drifted from the x_source annotations.\n' +
      (missing.length ? `  declared but not derived: ${missing.join(', ')}\n` : '') +
      (extra.length ? `  derived but not declared: ${extra.join(', ')}\n` : ''),
  );
}

const outlineBanner =
  '// AUTO-GENERATED by scripts/embed-prompt.mjs from ../analysis-prompt-outline.md\n' +
  '// + ../analysis-prompt-outline-schema.json. Do not hand-edit: re-run the script.\n';
const writerBanner =
  '// AUTO-GENERATED by scripts/embed-prompt.mjs from ../analysis-prompt-writer.md\n' +
  '// + ../analysis-prompt-writer-schema.json. Do not hand-edit: re-run the script.\n' +
  '//\n' +
  '// WRITER_TOOL_SCHEMA is DERIVED: the read schema filtered to `x_source: "writer"`.\n' +
  '// READ_SCHEMA is the whole assembled shape, for the validator and for reference.\n';

writeFileSync(
  join(root, 'src', 'outlinePrompt.js'),
  `${outlineBanner}\nexport const OUTLINE_PROMPT = ${JSON.stringify(outlineMd)};\n\n` +
    `export const PROMPT_VERSION = ${JSON.stringify(PROMPT_VERSION)};\n\n` +
    `export const OUTLINE_TOOL_SCHEMA = ${JSON.stringify(outlineFlat, null, 2)};\n`,
);

writeFileSync(
  join(root, 'src', 'writerPrompt.js'),
  `${writerBanner}\nexport const WRITER_PROMPT = ${JSON.stringify(writerMd)};\n\n` +
    `export const PROMPT_VERSION = ${JSON.stringify(PROMPT_VERSION)};\n\n` +
    `export const WRITER_EMITS = ${JSON.stringify(readSchema.x_writer_emits || [], null, 2)};\n\n` +
    `export const WRITER_TOOL_SCHEMA = ${JSON.stringify(writerFlat, null, 2)};\n\n` +
    `export const READ_SCHEMA = ${JSON.stringify(readFlat, null, 2)};\n`,
);

console.log(
  `wrote src/outlinePrompt.js — prompt ${outlineMd.length} chars, schema ${JSON.stringify(outlineFlat).length} chars\n` +
    `wrote src/writerPrompt.js  — prompt ${writerMd.length} chars, writer schema ${JSON.stringify(writerFlat).length} chars, ` +
    `read schema ${JSON.stringify(readFlat).length} chars\n` +
    `writer emits ${emitted.length} fields; matches x_writer_emits`,
);
