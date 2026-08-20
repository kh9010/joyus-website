// ---------------------------------------------------------------------------
// KV STORE — permalinks, per-IP rate limiting, daily spend cap.
//
// Honest limitation, stated once here rather than discovered later: Workers KV
// is eventually consistent and has no atomic increment. Two requests that land
// in the same instant can both read the same counter and both write N+1, so
// these are SOFT caps — they stop a runaway, they do not enforce an exact
// quota. Exact counting needs a Durable Object; if the spend cap ever has to be
// a hard financial guarantee rather than a brake, that is the upgrade, and it
// is a drop-in replacement for the three functions below.
// ---------------------------------------------------------------------------

const SLUG_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no l/o/0/1
const SLUG_LENGTH = 8;

export const LIMITS = {
  READS_PER_IP_PER_HOUR: 5,
  READS_PER_IP_PER_DAY: 15,
  DAILY_SPEND_USD: 25,
  READ_TTL_SECONDS: 60 * 60 * 24 * 365, // permalinks live a year
  COUNTER_TTL_SECONDS: 60 * 60 * 26,
};

export function newSlug() {
  const bytes = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
  return out;
}

function dayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function hourKey(now = new Date()) {
  return now.toISOString().slice(0, 13);
}

/** Stores the public read payload under a short slug and returns the slug. */
export async function putRead(kv, payload, options = {}) {
  let slug = options.slug || newSlug();
  if (!options.slug) {
    // One collision probe. 32^8 keys makes a second collision not worth code.
    const clash = await kv.get(`read:${slug}`);
    if (clash) slug = newSlug();
  }
  await kv.put(`read:${slug}`, JSON.stringify(payload), { expirationTtl: LIMITS.READ_TTL_SECONDS });
  return slug;
}

export async function getRead(kv, slug) {
  if (!/^[a-z0-9]{4,16}$/.test(slug || '')) return null;
  const raw = await kv.get(`read:${slug}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<{allowed:boolean, reason?:string, retryAfterSeconds?:number}>}
 */
export async function checkRateLimit(kv, ip, now = new Date()) {
  if (!ip) return { allowed: true };
  const hourK = `rl:h:${ip}:${hourKey(now)}`;
  const dayK = `rl:d:${ip}:${dayKey(now)}`;
  const [hourRaw, dayRaw] = await Promise.all([kv.get(hourK), kv.get(dayK)]);
  const hour = Number(hourRaw || 0);
  const day = Number(dayRaw || 0);

  if (hour >= LIMITS.READS_PER_IP_PER_HOUR) {
    return { allowed: false, reason: 'hourly limit reached', retryAfterSeconds: 3600 };
  }
  if (day >= LIMITS.READS_PER_IP_PER_DAY) {
    return { allowed: false, reason: 'daily limit reached', retryAfterSeconds: 86400 };
  }
  await Promise.all([
    kv.put(hourK, String(hour + 1), { expirationTtl: 3700 }),
    kv.put(dayK, String(day + 1), { expirationTtl: LIMITS.COUNTER_TTL_SECONDS }),
  ]);
  return { allowed: true };
}

export async function checkSpendCap(kv, now = new Date()) {
  const raw = await kv.get(`spend:${dayKey(now)}`);
  const spent = Number(raw || 0);
  return { allowed: spent < LIMITS.DAILY_SPEND_USD, spentUsd: spent, capUsd: LIMITS.DAILY_SPEND_USD };
}

export async function recordSpend(kv, usd, now = new Date()) {
  if (!usd || usd <= 0) return;
  const key = `spend:${dayKey(now)}`;
  const spent = Number((await kv.get(key)) || 0);
  await kv.put(key, String(Math.round((spent + usd) * 1e6) / 1e6), { expirationTtl: LIMITS.COUNTER_TTL_SECONDS });
}
