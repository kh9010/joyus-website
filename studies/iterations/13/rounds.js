// Every dated round the studies have found so far, with its source. Issue 01 is
// assembled from this by quarter, not written by hand: "the interesting things
// we have been up to" (Divya's brief) are the rounds added that quarter.
// Klydo: Study 04 (the 120-day wall, day 1 = 10 Sep 2025). Metro Museum: Study 05 (git log).
globalThis.ROUNDS = [
  { piece: 'Klydo · branding', to: 'piece', title: 'Logo exploration', date: '2025-09-24' },
  { piece: 'Klydo · branding', to: 'piece', title: 'Type + colour system', date: '2025-09-26' },
  { piece: 'Klydo · branding', to: 'piece', title: 'Brand voice card', date: '2025-09-28' },
  { piece: 'Klydo · branding', to: 'piece', title: 'Launch screen', date: '2025-10-19' },
  { piece: 'Klydo · branding', to: 'piece', title: 'Brand system v2', date: '2025-11-26' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'A look-dev sandbox', date: '2026-07-10' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'The catalogue', date: '2026-07-11' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'The whole archive', date: '2026-07-13' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'A level editor', date: '2026-07-18' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'Paint first', date: '2026-07-27' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'Levels reach the game', date: '2026-07-30' },
  { piece: 'Metro Museum of the Forgotten', to: 'experiment', title: 'Towards Steam', date: '2026-09-30' },
];
// quarter "2026-Q3" -> the rounds dated inside it
globalThis.inQuarter = (q) => {
  const [y, n] = [+q.slice(0, 4), +q.slice(6)];
  const from = `${y}-${String((n - 1) * 3 + 1).padStart(2, '0')}-01`, to = `${y}-${String(n * 3 + 1).padStart(2, '0')}-01`;
  return globalThis.ROUNDS.filter(r => r.date >= from && (n === 4 ? r.date < `${y + 1}-01-01` : r.date < to));
};
if (typeof module !== 'undefined') module.exports = { ROUNDS: globalThis.ROUNDS, inQuarter: globalThis.inQuarter };
