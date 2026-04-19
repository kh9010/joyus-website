#!/usr/bin/env node
// Walks /podcast/, harvests title + date + duration from each episode page,
// writes podcast/archive.html — a flat listing of all ~82 episodes grouped
// by season. The S7 backlog rendered on podcast.html is a curated subset;
// this is the full index.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PODCAST_DIR = path.join(ROOT, 'podcast');
const OUT = path.join(PODCAST_DIR, 'archive.html');

function parse(html, filename) {
  // Title: <title>NN — Episode title — Thinking on Thinking — Joyus Studio</title>
  // OR: <title>Episode title — Thinking on Thinking — Joyus Studio</title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  let raw = titleMatch ? titleMatch[1] : filename;
  // strip trailing " — Thinking on Thinking — Joyus Studio" or " — Joyus Studio"
  let title = raw
    .replace(/\s*[—-]\s*Thinking on Thinking.*$/i, '')
    .replace(/\s*[—-]\s*Joyus Studio.*$/i, '')
    .trim();

  // Try to pull season/episode from "S7E13" pattern in body (set on backlog page);
  // here we approximate from filename or fall back to ''.
  let se = '';
  const seMatch = html.match(/[>\s]S(\d+)E(\d+)[<\s]/i);
  if (seMatch) se = `S${seMatch[1]}E${seMatch[2]}`;

  // Date — try to find a <span class="ep-date"> or fallback to nothing
  const dateMatch = html.match(/<(?:span|p)[^>]*class="(?:ep-date|bk-date)"[^>]*>([^<]+)<\/(?:span|p)>/);
  const date = dateMatch ? dateMatch[1].trim() : '';

  // Duration — try ep-dur / bk-dur
  const durMatch = html.match(/<(?:span|p)[^>]*class="(?:ep-dur|bk-dur)"[^>]*>([^<]+)<\/(?:span|p)>/);
  const dur = durMatch ? durMatch[1].trim() : '';

  return { title, se, date, dur, filename };
}

const files = fs.readdirSync(PODCAST_DIR).filter(f => f.endsWith('.html') && f !== 'archive.html');
const eps = files.map(f => {
  const html = fs.readFileSync(path.join(PODCAST_DIR, f), 'utf8');
  return parse(html, f);
});

// Group by season; "Other" for anything we couldn't parse
const seasons = new Map();
for (const ep of eps) {
  const seasonKey = ep.se ? ep.se.match(/^S(\d+)/)[1] : 'misc';
  if (!seasons.has(seasonKey)) seasons.set(seasonKey, []);
  seasons.get(seasonKey).push(ep);
}
// Sort each season list by episode # desc (latest first); misc by title
for (const [k, list] of seasons) {
  if (k !== 'misc') {
    list.sort((a, b) => {
      const an = parseInt((a.se.match(/E(\d+)/) || [0, 0])[1], 10);
      const bn = parseInt((b.se.match(/E(\d+)/) || [0, 0])[1], 10);
      return bn - an;
    });
  } else {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
}
// Sort seasons desc; misc last
const seasonOrder = Array.from(seasons.keys())
  .filter(k => k !== 'misc')
  .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
if (seasons.has('misc')) seasonOrder.push('misc');

const total = eps.length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="The complete archive of Thinking on Thinking — every episode, grouped by season. By Joyus Studio.">
  <meta property="og:title" content="Podcast archive — Thinking on Thinking — Joyus Studio">
  <meta property="og:description" content="The complete archive of Thinking on Thinking — every episode, grouped by season.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://kh9010.github.io/joyus-website/podcast/archive.html">
  <link rel="canonical" href="https://kh9010.github.io/joyus-website/podcast/archive.html">
  <title>Podcast archive — Thinking on Thinking — Joyus Studio</title>
  <link rel="icon" href="../favicon.ico" type="image/x-icon">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FAF7F2;
      --ink: #2C3544;
      --ink-soft: #54606F;
      --ink-fade: #8892A0;
      --rule: rgba(44, 53, 68, 0.12);
      --pink: #E91E7B;
      --cyan: #4FC4CF;
      --yellow: #F2C94A;
      --sans: 'Space Grotesk', system-ui, sans-serif;
      --hand: 'Caveat', cursive;
      --x: clamp(1.5rem, 4vw, 3rem);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--sans);
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; transition: color 0.2s; }
    .dot { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
    .d-pink { background: var(--pink); }
    .d-cyan { background: var(--cyan); }
    .d-yellow { background: var(--yellow); }

    .archive-hero {
      min-height: 58vh;
      padding: clamp(6rem, 14vh, 10rem) var(--x) clamp(3rem, 6vh, 5rem);
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid var(--rule);
    }
    .archive-hero .dh1 { width: 280px; height: 280px; top: 14%; right: -4%; }
    .archive-hero .dh2 { width: 42px; height: 42px; bottom: 22%; right: 22%; }
    .archive-hero .dh3 { width: 18px; height: 18px; top: 30%; right: 30%; }

    .hero-eyebrow {
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ink);
      margin-bottom: 1.5rem;
      display: inline-flex; align-items: center; gap: 0.75rem;
      position: relative; z-index: 2;
    }
    .hero-eyebrow::before {
      content: ""; width: 12px; height: 12px;
      border-radius: 50%; background: var(--cyan);
    }
    .archive-hero h1 {
      font-weight: 700;
      font-size: clamp(3rem, 8vw, 6.5rem);
      line-height: 0.95;
      letter-spacing: -0.035em;
      color: var(--ink);
      max-width: 18ch;
      position: relative; z-index: 2;
    }
    .archive-hero h1 em { font-style: normal; color: var(--pink); }
    .hero-meta {
      font-size: 0.85rem;
      letter-spacing: 0.1em;
      color: var(--ink-fade);
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--rule);
      max-width: 52ch;
      position: relative; z-index: 2;
    }
    .hero-meta span + span::before { content: " · "; padding: 0 0.15em; }

    .archive-body {
      max-width: 920px;
      margin: 0 auto;
      padding: clamp(3rem, 6vh, 5rem) var(--x) 4rem;
    }
    .season-block { margin-bottom: 4rem; }
    .season-head {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      padding-bottom: 0.85rem;
      margin-bottom: 1.25rem;
      border-bottom: 2px solid var(--ink);
    }
    .season-name {
      font-family: var(--font-serif, 'Space Grotesk');
      font-weight: 700;
      font-size: 1.6rem;
      letter-spacing: -0.01em;
    }
    .season-count {
      font-family: var(--hand);
      font-size: 1.3rem;
      color: var(--pink);
      transform: rotate(-2deg);
    }
    .ep-list { list-style: none; padding: 0; margin: 0; }
    .ep-row {
      display: grid;
      grid-template-columns: 5rem 1fr auto;
      gap: 1rem 1.5rem;
      align-items: baseline;
      padding: 1rem 0;
      border-top: 1px solid var(--rule);
      transition: background 0.15s;
    }
    .ep-row:first-child { border-top: 0; }
    .ep-row:hover { background: rgba(233, 30, 123, 0.04); }
    .ep-row .ep-se {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--ink-fade);
      text-transform: uppercase;
    }
    .ep-row .ep-title { color: var(--ink); font-weight: 500; }
    .ep-row:hover .ep-title { color: var(--pink); }
    .ep-row .ep-side {
      font-size: 0.85rem;
      color: var(--ink-fade);
      letter-spacing: 0.04em;
      text-align: right;
      white-space: nowrap;
    }
    .ep-row .ep-side span + span::before { content: " · "; }

    @media (max-width: 640px) {
      .ep-row { grid-template-columns: 4rem 1fr; }
      .ep-row .ep-side { grid-column: 2; text-align: left; }
    }
  </style>
</head>
<body>

<!--BEGIN:NAV-->
<!--END:NAV-->

  <header class="archive-hero">
    <span class="dot dh1 d-cyan"></span>
    <span class="dot dh2 d-pink"></span>
    <span class="dot dh3 d-yellow"></span>
    <span class="hero-eyebrow">podcast</span>
    <h1>The complete <em>archive</em></h1>
    <p class="hero-meta">
      <span>${total} episodes</span><span>${seasonOrder.filter(s => s !== 'misc').length} seasons</span><span>since 2018</span>
    </p>
  </header>

  <main class="archive-body">
${seasonOrder.map(s => {
  const list = seasons.get(s);
  const heading = s === 'misc' ? 'From the shelf' : `Season ${s}`;
  return `    <section class="season-block">
      <header class="season-head">
        <h2 class="season-name">${heading}</h2>
        <span class="season-count">${list.length} episodes</span>
      </header>
      <ul class="ep-list">
${list.map(ep => `        <li><a class="ep-row" href="${ep.filename}">
          <span class="ep-se">${ep.se || '—'}</span>
          <span class="ep-title">${ep.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>
          <span class="ep-side">${[ep.date, ep.dur].filter(Boolean).join(' · ') || ''}</span>
        </a></li>`).join('\n')}
      </ul>
    </section>`;
}).join('\n')}
  </main>

<!--BEGIN:FOOT-->
<!--END:FOOT-->

</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`wrote ${OUT}  (${total} episodes, ${seasonOrder.length} seasons)`);
