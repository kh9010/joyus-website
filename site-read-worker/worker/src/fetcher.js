// ---------------------------------------------------------------------------
// FETCHER — one URL, an escalating chain of browser-shaped identities, a hard
// byte cap and an ENFORCED redirect cap.
//
// The chain leads with a full desktop-Chrome fingerprint rather than a bare
// request: a request with no User-Agent at all is the profile most WAFs wall
// first, so leading with it wastes the attempt that matters most. We only
// escalate when a response is a block (401/403/406/429/451/503/999) or the
// attempt errors outright — a 404 or a 500 is a real answer, not a block, and
// is reported as-is.
//
// The Googlebot profile at the end is a legitimate, honest fallback (it is
// what WebFetch itself falls back to), not an attempt to look like a human.
// ---------------------------------------------------------------------------

export const CONFIG = {
  MAX_PAGES: 6,
  MAX_BYTES_PER_PAGE: 1_500_000,
  MAX_TOTAL_BYTES: 6_000_000,
  FETCH_TIMEOUT_MS: 12_000,
  REDIRECT_CAP: 5,
  THIN_WORD_FLOOR: 150,
};

export const BLOCK_STATUSES = new Set([401, 403, 406, 429, 451, 503, 999]);

export const UA_CHAIN = [
  {
    name: 'chrome-desktop',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  },
  {
    name: 'safari-desktop',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  {
    name: 'googlebot',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      Accept: 'text/html,application/xhtml+xml',
    },
  },
];

async function readCapped(res, capBytes) {
  if (!res.body) {
    const text = await res.text();
    const bytes = new TextEncoder().encode(text);
    if (bytes.length <= capBytes) return { text, truncated: false };
    return { text: new TextDecoder().decode(bytes.slice(0, capBytes)), truncated: true };
  }
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (received > capBytes) {
      const allowed = capBytes - (received - value.length);
      if (allowed > 0) chunks.push(value.slice(0, allowed));
      truncated = true;
      try { await reader.cancel(); } catch { /* already closed */ }
      break;
    }
    chunks.push(value);
  }
  const total = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of chunks) { total.set(c, off); off += c.length; }
  return { text: new TextDecoder('utf-8', { fatal: false }).decode(total), truncated };
}

/** One profile, following redirects by hand so REDIRECT_CAP is a real limit
 *  rather than a constant that documents a guarantee nothing enforces. */
async function attemptWithProfile(url, profile) {
  let current = url;
  for (let hop = 0; hop <= CONFIG.REDIRECT_CAP; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current, { headers: profile.headers, redirect: 'manual', signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { res, finalUrl: current };
      let next;
      try {
        next = new URL(loc, current).toString();
      } catch {
        return { res, finalUrl: current };
      }
      if (hop === CONFIG.REDIRECT_CAP) {
        return { blockedByRedirectCap: true, finalUrl: current, hops: hop + 1 };
      }
      current = next;
      continue;
    }
    return { res, finalUrl: res.url || current };
  }
  return { blockedByRedirectCap: true, finalUrl: current, hops: CONFIG.REDIRECT_CAP + 1 };
}

/**
 * Fetches one URL through the profile chain.
 * @returns {Promise<{ok:boolean,url:string,finalUrl?:string,status?:number,html?:string,truncated?:boolean,reason?:string,attempts:object[]}>}
 */
export async function fetchOne(url) {
  const attempts = [];
  for (const profile of UA_CHAIN) {
    const started = Date.now();
    try {
      const out = await attemptWithProfile(url, profile);
      if (out.blockedByRedirectCap) {
        attempts.push({ profile: profile.name, error: `redirect cap (${CONFIG.REDIRECT_CAP}) exceeded`, ms: Date.now() - started });
        return { ok: false, url, reason: 'too many redirects', attempts };
      }
      const res = out.res;
      const blocked = BLOCK_STATUSES.has(res.status);
      attempts.push({ profile: profile.name, status: res.status, blocked, ms: Date.now() - started });
      if (blocked) continue;

      const contentType = res.headers.get('content-type') || '';
      if (contentType && !/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
        return { ok: false, url, finalUrl: out.finalUrl, reason: `non-html content-type: ${contentType}`, attempts };
      }
      if (res.status >= 400) {
        return { ok: false, url, finalUrl: out.finalUrl, reason: `HTTP ${res.status}`, attempts };
      }
      const body = await readCapped(res, CONFIG.MAX_BYTES_PER_PAGE);
      if (!body.text.trim()) {
        return { ok: false, url, finalUrl: out.finalUrl, reason: 'empty response body', attempts };
      }
      return {
        ok: true,
        url,
        finalUrl: out.finalUrl,
        status: res.status,
        html: body.text,
        truncated: body.truncated,
        attempts,
      };
    } catch (err) {
      attempts.push({
        profile: profile.name,
        error: String(err && err.message ? err.message : err),
        ms: Date.now() - started,
      });
    }
  }
  return { ok: false, url, reason: 'no readable response after every fetch profile', attempts };
}

export function sameSite(a, b) {
  try {
    return new URL(a).hostname.replace(/^www\./, '') === new URL(b).hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}
