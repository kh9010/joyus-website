// ---------------------------------------------------------------------------
// MODEL CALL — Anthropic Messages API, structured output via a strict tool.
//
// The read comes back as a `tool_use` block whose `input` is already the v4
// object: `strict: true` plus a forced `tool_choice` means the API validates
// the shape before we ever see it, so the validator only has to argue about
// content. A text block is still parsed as a fallback, because a refusal or a
// max_tokens truncation can leave us without a tool_use block and we would
// rather record that as a violation than throw.
//
// Written against the Messages API directly rather than through
// @anthropic-ai/sdk on purpose: this worker has no dependencies and no build
// step, which is what lets `wrangler deploy` ship it as-is and `node test/*`
// import it with nothing installed. The SDK is the better default in a project
// that already has a package tree — see README, "Why raw fetch".
//
// Model notes (Sonnet 5): thinking is adaptive, `budget_tokens` is rejected,
// and `temperature`/`top_p` are rejected — none of them appear below.
// ---------------------------------------------------------------------------

import { TOOL_INPUT_SCHEMA } from './analysisPrompt.js';

export const MODEL = 'claude-sonnet-5';
export const MAX_TOKENS = 16000;

// Standard Sonnet 5 rates, $/MTok. Used only to estimate spend against the
// daily cap — deliberately the standard rate, not the promotional one, so the
// cap errs toward stopping early.
const PRICE_IN = 3.0;
const PRICE_OUT = 15.0;
const PRICE_CACHE_READ = 0.3;

const TOOL_NAME = 'emit_read';

export function estimateCostUsd(usage) {
  if (!usage) return 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  return (
    ((input + cacheWrite * 1.25) * PRICE_IN + cacheRead * PRICE_CACHE_READ + output * PRICE_OUT) / 1_000_000
  );
}

function stripFence(raw) {
  return String(raw || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

/**
 * @returns {(system:string,user:string)=>Promise<{output:object|null,raw:string,parseError:string|null,usage:object|null,stopReason:string|null}>}
 */
export function makeClaudeCaller(apiKey, options = {}) {
  const model = options.model || MODEL;
  const fetchImpl = options.fetchImpl || fetch;

  return async function callModel(system, user) {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        // The 39KB analysis prompt is byte-identical on every request and on
        // both repair attempts, so it is worth a cache breakpoint.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        tools: [
          {
            name: TOOL_NAME,
            description:
              'Emit the finished read as structured data. This is the only way to return a result; do not write the JSON as prose.',
            strict: true,
            input_schema: TOOL_INPUT_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: TOOL_NAME },
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 600)}`);
    }

    const data = await res.json();
    const usage = data.usage || null;
    const stopReason = data.stop_reason || null;

    // A refusal or a truncation returns 200 with no tool_use block; treat it as
    // a failed attempt, not an exception, so the repair loop can record it.
    if (stopReason === 'refusal') {
      return { output: null, raw: '', parseError: 'model declined the request (stop_reason: refusal)', usage, stopReason };
    }

    const toolBlock = (data.content || []).find((b) => b.type === 'tool_use' && b.name === TOOL_NAME);
    if (toolBlock) {
      return { output: toolBlock.input, raw: JSON.stringify(toolBlock.input), parseError: null, usage, stopReason };
    }

    const textBlock = (data.content || []).find((b) => b.type === 'text' && b.text);
    if (!textBlock) {
      return {
        output: null,
        raw: '',
        parseError: `no tool_use and no text block in the response (stop_reason: ${stopReason})`,
        usage,
        stopReason,
      };
    }
    try {
      return { output: JSON.parse(stripFence(textBlock.text)), raw: textBlock.text, parseError: null, usage, stopReason };
    } catch (err) {
      return { output: null, raw: textBlock.text, parseError: String((err && err.message) || err), usage, stopReason };
    }
  };
}
