// ---------------------------------------------------------------------------
// MODEL CALL — Anthropic Messages API, structured output via a strict tool.
//
// Each stage's output comes back as a `tool_use` block whose `input` is already
// the right shape: `strict: true` plus a forced `tool_choice` means the API
// validates the shape before we ever see it, so the validators only have to
// argue about content.
//
// v5 makes the tool per-call rather than per-module: the same caller runs the
// outline stage and the writer stage, with different names, schemas and token
// budgets. Everything else here — the refusal branch, the text-block fallback,
// the cache breakpoint, the cost estimate — is shared by both. A text block is still parsed as a fallback, because a refusal or a
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

export const MODEL = 'claude-sonnet-5';
export const MAX_TOKENS = 16000;

// The outline is the big object — findings, ledger, plan, truth pass. The
// writer emits 250-400 words of prose plus a thin wrapper.
export const OUTLINE_MAX_TOKENS = 16000;
export const WRITER_MAX_TOKENS = 4000;

export const OUTLINE_CALL = {
  toolName: 'emit_outline',
  description: 'Emit the structured outline. Claims only, no rendered prose.',
  maxTokens: OUTLINE_MAX_TOKENS,
};
export const WRITER_CALL = {
  toolName: 'emit_prose',
  description: 'Emit the rendered prose. Every field here is text the reader will see.',
  maxTokens: WRITER_MAX_TOKENS,
};

// Standard Sonnet 5 rates, $/MTok. Used only to estimate spend against the
// daily cap — deliberately the standard rate, not the promotional one, so the
// cap errs toward stopping early.
const PRICE_IN = 3.0;
const PRICE_OUT = 15.0;
const PRICE_CACHE_READ = 0.3;

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
 * @returns {(system:string,user:string,call:{toolName:string,description:string,schema:object,maxTokens?:number})
 *   =>Promise<{output:object|null,raw:string,parseError:string|null,usage:object|null,stopReason:string|null}>}
 */
export function makeClaudeCaller(apiKey, options = {}) {
  const model = options.model || MODEL;
  const fetchImpl = options.fetchImpl || fetch;

  return async function callModel(system, user, call) {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: call.maxTokens || MAX_TOKENS,
        // Each system prompt is byte-identical across its own attempts, and the
        // outline prompt is byte-identical across every read, so the breakpoint
        // earns more here than it did with one call.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        tools: [
          {
            name: call.toolName,
            description: call.description,
            strict: true,
            input_schema: call.schema,
          },
        ],
        tool_choice: { type: 'tool', name: call.toolName },
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

    const toolBlock = (data.content || []).find((b) => b.type === 'tool_use' && b.name === call.toolName);
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
