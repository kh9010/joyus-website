// ---------------------------------------------------------------------------
// SHAPE ROTATION — the opening shape and the bridge move are assigned here,
// not chosen by the model. (The cut was removed in 5.2, and its shape with it.)
//
// The writer prompt: "Left to choose, a model picks the same shape every time, and two
// practitioners who compare notes see the machine." So the pipeline rolls the
// dice and hands the model a directive it must echo back.
//
// Seeded by a hash of the URL alone — deliberately NOT time-bucketed. The
// repair retry re-sends the same directive, a permalink re-read of a stored
// result shows the same shapes, and two people reading the same report see the
// same read. Rotation across the enum space comes from the spread of URLs.
// ---------------------------------------------------------------------------

import { OPENING_SHAPES, BRIDGE_MOVES } from './types.js';

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — independent draws from one seed, so the enums are not locked
 *  together by reusing `hash % N` twice. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeForSeed(url) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** @returns {{opening_shape:string,bridge_move:string,seed:number}} */
export function computeShapeDirective(siteUrl) {
  const seed = fnv1a(normalizeForSeed(siteUrl));
  const rnd = mulberry32(seed);
  return {
    opening_shape: OPENING_SHAPES[Math.floor(rnd() * OPENING_SHAPES.length)],
    bridge_move: BRIDGE_MOVES[Math.floor(rnd() * BRIDGE_MOVES.length)],
    seed,
  };
}
