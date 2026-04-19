#!/usr/bin/env node
// Walks /podcast/, reads each old-template episode page, extracts the
// content (title, S/E, date, duration, tags, description, embed iframe,
// notable quotes, transcript paragraphs, listen links, prev/next nav),
// and rewrites it using the new podcast template (mirrors episode 503,
// which we hand-designed as the canonical preview).
//
// Skips: archive.html, and 503 itself (already in the new template).
//
// Run after editing the template inside this script.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PODCAST_DIR = path.join(ROOT, 'podcast');
const TEMPLATE_FILE = '503-building-and-selling-a-food-business-with-smiqql-s-dina-holzapfel.html';

// ---------- helpers ----------
function htmlDecode(s) {
  // decode common entities so we don't double-encode when re-emitting
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
function htmlEscape(s) {
  return htmlDecode(String(s))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function attrEscape(s) {
  return htmlEscape(s);
}

// ---------- extractors ----------
function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (!m) return '';
  return m[1]
    .replace(/\s*[—-]\s*Thinking on Thinking.*$/i, '')
    .replace(/\s*[—-]\s*Joyus Studio.*$/i, '')
    .trim();
}
function extractMeta(html) {
  const m = html.match(/<div class="ep-meta">([\s\S]*?)<\/div>/);
  if (!m) return { se: '', date: '', dur: '' };
  const spans = [...m[1].matchAll(/<span>([^<]+)<\/span>/g)].map(s => s[1].trim());
  // Heuristic: SnEn pattern, then date (contains comma or year), then dur (contains 'min')
  let se = '', date = '', dur = '';
  for (const s of spans) {
    if (/^S\d+E\d+/i.test(s) && !se) { se = s; }
    else if (/min/i.test(s) && !dur) { dur = s; }
    else if (!date) { date = s; }
  }
  return { se, date, dur };
}
function extractTags(html) {
  const m = html.match(/<div class="ep-tags">([\s\S]*?)<\/div>/);
  if (!m) return [];
  return [...m[1].matchAll(/<span class="ep-tag">([^<]+)<\/span>/g)].map(s => s[1].trim());
}
function extractDescriptionParas(html) {
  // ep-content > <p>...</p> ... before iframe or transcript-section
  const ec = html.match(/<div class="ep-content">([\s\S]*?)(?:<iframe|<div class="transcript-section">|<details)/);
  if (!ec) return [];
  return [...ec[1].matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map(p => p[1].trim())
    .filter(p => p && p !== '<br>' && p.replace(/<[^>]+>/g, '').trim());
}
function extractDescriptionMeta(html) {
  const m = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/);
  return m ? m[1] : '';
}
function extractIframe(html) {
  // The whole iframe tag
  const m = html.match(/<iframe[\s\S]*?<\/iframe>/);
  return m ? m[0] : '';
}
function extractIframeSrc(html) {
  const m = html.match(/<iframe[^>]*src="([^"]+)"/);
  return m ? m[1] : '';
}
function extractQuotes(html) {
  return [...html.matchAll(/<div class="ep-quote">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g)]
    .map(q => q[1].trim().replace(/^["“”]|["“”]$/g, ''));
}
function extractTranscriptParas(html) {
  const m = html.match(/<div class="transcript-content">([\s\S]*?)<\/div>\s*<\/details>/);
  if (!m) return [];
  return [...m[1].matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map(p => p[1].trim())
    .filter(p => p && p.replace(/<[^>]+>/g, '').trim());
}
function extractListenLinks(html) {
  const links = {};
  // Spotify (older Spotify-for-creators URL OR open.spotify.com)
  const sp = html.match(/href="([^"]*(?:spotify\.com|spotifycreators-web\.app|podcasters\.spotify\.com)[^"]*)"/i);
  if (sp) links.spotify = sp[1];
  const ap = html.match(/href="([^"]*podcasts\.apple\.com[^"]*)"/i);
  if (ap) links.apple = ap[1];
  return links;
}
function extractNext(html) {
  // <a href="..." class="ep-nav-next">...</a>
  const m = html.match(/<a href="([^"]+)"[^>]*class="ep-nav-next"[^>]*>([\s\S]*?)<\/a>/);
  if (!m) return null;
  const text = m[2].replace(/<[^>]+>/g, '').replace(/&rarr;|→/g, '').trim();
  return { href: m[1], label: text };
}

// ---------- template ----------
function buildPage(d) {
  const title = htmlEscape(d.title);
  const og = htmlEscape(d.descMeta || d.title);
  const url = `https://kh9010.github.io/joyus-website/podcast/${d.filename}`;
  const seBlock = d.se ? ` <span class="se">· ${htmlEscape(d.se)}</span>` : '';
  const tagsHtml = d.tags.length
    ? `<span class="ep-tags">${d.tags.map(t => `<span class="ep-tag">${htmlEscape(t)}</span>`).join('')}</span>`
    : '';
  const metaSpans = [d.date, d.dur].filter(Boolean).map(s => `<span>${htmlEscape(s)}</span>`).join('');

  const descHtml = d.descParas.length
    ? d.descParas.map(p => `      <p>${p}</p>`).join('\n')
    : '      <p>—</p>';

  // Player block: prefer the original iframe (carries the apple-podcasts embed), fallback to nothing
  const playerHtml = d.iframeSrc
    ? `    <iframe
      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
      height="175"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      src="${attrEscape(d.iframeSrc)}"
      loading="lazy"
      title="Podcast player">
    </iframe>`
    : '';

  const listenHtml = (d.listen.spotify || d.listen.apple)
    ? `    <div class="ep-listen">
      <span class="ep-listen-label">listen elsewhere</span>
      ${d.listen.spotify ? `<a href="${attrEscape(d.listen.spotify)}" target="_blank" rel="noopener">Spotify →</a>` : ''}
      ${d.listen.apple ? `<a href="${attrEscape(d.listen.apple)}" target="_blank" rel="noopener">Apple Podcasts →</a>` : ''}
    </div>`
    : '';

  const playerSection = (playerHtml || listenHtml)
    ? `\n  <section class="ep-player">\n${playerHtml}\n${listenHtml}\n  </section>`
    : '';

  const quotesHtml = d.quotes.length
    ? `\n  <section class="ep-quotes">
    <span class="ep-quotes-label">notable moments</span>
    <div class="ep-quote-grid">
${d.quotes.map(q => `      <blockquote class="ep-quote"><p>${q}</p></blockquote>`).join('\n')}
    </div>
  </section>`
    : '';

  const transcriptHtml = d.transcriptParas.length
    ? `\n  <details class="ep-transcript">
    <summary>Read full transcript</summary>
    <div class="ep-transcript-content">
${d.transcriptParas.map(p => `      <p>${p}</p>`).join('\n')}
    </div>
  </details>`
    : '';

  const nextHtml = d.next
    ? `<a class="next" href="${attrEscape(d.next.href)}">
      <span class="label">Newer</span>
      ${htmlEscape(d.next.label)} →
    </a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${og}">
  <meta property="og:title" content="${title} — Thinking on Thinking">
  <meta property="og:description" content="${og}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://kh9010.github.io/joyus-website/images/podcast-cover.jpg">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="${url}">
  <title>${title} — Thinking on Thinking — Joyus Studio</title>
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
      --sans: 'Space Grotesk', system-ui, -apple-system, sans-serif;
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
    .ep-hero {
      min-height: 56vh;
      padding: clamp(6rem, 14vh, 10rem) var(--x) clamp(3rem, 6vh, 5rem);
      display: flex; flex-direction: column; justify-content: center;
      position: relative; overflow: hidden;
      border-bottom: 1px solid var(--rule);
    }
    .ep-hero .dh1 { width: 280px; height: 280px; top: 12%; right: -4%; }
    .ep-hero .dh2 { width: 42px; height: 42px; bottom: 22%; right: 22%; }
    .ep-hero .dh3 { width: 18px; height: 18px; top: 30%; right: 30%; }
    .ep-hero .dh4 { width: 28px; height: 28px; top: 60%; left: 8%; }
    .ep-hero-inner { max-width: 880px; margin: 0 auto; width: 100%; position: relative; z-index: 2; }
    .ep-eyebrow {
      font-size: 0.85rem; font-weight: 600; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--ink); margin-bottom: 1.5rem;
      display: inline-flex; align-items: center; gap: 0.75rem;
    }
    .ep-eyebrow::before { content: ""; width: 12px; height: 12px; border-radius: 50%; background: var(--cyan); }
    .ep-eyebrow .se { color: var(--pink); font-weight: 700; letter-spacing: 0.15em; margin-left: 0.4rem; }
    .ep-hero h1 {
      font-weight: 700; font-size: clamp(2.2rem, 5vw, 3.6rem);
      line-height: 1.05; letter-spacing: -0.025em; color: var(--ink);
      margin-bottom: 1.5rem;
    }
    .ep-meta {
      font-size: 0.85rem; letter-spacing: 0.1em; color: var(--ink-fade);
      padding-top: 1rem; border-top: 1px solid var(--rule);
      display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; align-items: baseline;
    }
    .ep-meta span + span::before { content: " · "; color: var(--ink-fade); padding: 0 0.15em; }
    .ep-tags { display: inline-flex; gap: 0.4rem; margin-left: auto; }
    .ep-tag {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;
      padding: 0.3rem 0.7rem; border-radius: 999px;
      background: rgba(233, 30, 123, 0.1); color: var(--pink); font-weight: 500;
    }
    .ep-player { max-width: 880px; margin: 0 auto; padding: clamp(2rem, 4vh, 3rem) var(--x) 0; }
    .ep-player iframe {
      width: 100%; border: 0; border-radius: 12px; background: transparent;
      box-shadow: 0 6px 28px rgba(44, 53, 68, 0.08);
    }
    .ep-listen {
      margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem 2rem;
      align-items: center; font-family: var(--hand); font-size: 1.15rem; color: var(--ink-soft);
    }
    .ep-listen-label::after { content: "↓"; margin-left: 0.4rem; color: var(--pink); font-family: var(--sans); }
    .ep-listen a {
      font-family: var(--sans); font-size: 0.95rem; font-weight: 500; color: var(--ink);
      padding: 0.5rem 1rem; border: 1.5px solid var(--ink); border-radius: 999px;
      transition: background 0.2s, color 0.2s;
    }
    .ep-listen a:hover { background: var(--ink); color: #fff; }
    .ep-body { max-width: 720px; margin: 0 auto; padding: clamp(3rem, 6vh, 5rem) var(--x) clamp(2rem, 4vh, 3rem); }
    .ep-summary p { font-size: 1.1rem; line-height: 1.75; color: var(--ink); margin-bottom: 1.1rem; }
    .ep-summary p:last-child { margin-bottom: 0; }
    .ep-summary a { color: var(--pink); border-bottom: 1px solid currentColor; padding-bottom: 1px; }
    .ep-summary a:hover { color: var(--ink); border-bottom-color: var(--ink); }
    .ep-quotes { max-width: 880px; margin: 0 auto; padding: clamp(2rem, 4vh, 3rem) var(--x); }
    .ep-quotes-label {
      font-family: var(--hand); font-size: 1.4rem; color: var(--pink);
      margin-bottom: 1.5rem; transform: rotate(-1.5deg); display: inline-block;
    }
    .ep-quote-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .ep-quote {
      background: #fff; border: 1px solid var(--rule); border-left: 3px solid var(--pink);
      border-radius: 0 10px 10px 0; padding: 1.5rem 1.75rem;
      font-size: 1.05rem; line-height: 1.45; color: var(--ink);
      box-shadow: 0 2px 8px rgba(44, 53, 68, 0.04); position: relative;
    }
    .ep-quote::before {
      content: "\\201C"; position: absolute; top: 0.4rem; left: 1rem;
      font-family: 'Caveat', cursive; font-size: 3rem; color: var(--pink);
      opacity: 0.18; line-height: 1;
    }
    .ep-quote p { margin: 0; font-style: italic; padding-left: 0.75rem; }
    .ep-quote:nth-child(2n) { border-left-color: var(--cyan); }
    .ep-quote:nth-child(2n)::before { color: var(--cyan); }
    .ep-quote:nth-child(3n) { border-left-color: var(--yellow); }
    .ep-quote:nth-child(3n)::before { color: var(--yellow); opacity: 0.45; }
    .ep-transcript { max-width: 720px; margin: 0 auto; padding: clamp(2rem, 4vh, 3rem) var(--x); }
    .ep-transcript summary {
      cursor: pointer; font-family: var(--sans); font-size: 0.85rem; font-weight: 600;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft);
      padding: 1rem 0; border-top: 1px solid var(--ink);
      display: flex; justify-content: space-between; align-items: center;
      list-style: none; user-select: none;
    }
    .ep-transcript summary::-webkit-details-marker { display: none; }
    .ep-transcript summary::after {
      content: "+"; font-size: 1.4rem; color: var(--pink);
      transition: transform 0.25s; font-weight: 400; line-height: 1;
    }
    .ep-transcript[open] summary::after { transform: rotate(45deg); }
    .ep-transcript summary:hover { color: var(--ink); }
    .ep-transcript-content { max-height: 600px; overflow-y: auto; padding: 1.5rem 0; -webkit-overflow-scrolling: touch; }
    .ep-transcript-content p { font-size: 0.95rem; line-height: 1.75; color: var(--ink-soft); margin-bottom: 1rem; }
    .ep-nav-bar {
      max-width: 880px; margin: 0 auto; padding: clamp(2rem, 4vh, 3rem) var(--x);
      display: flex; justify-content: space-between; gap: 2rem;
      border-top: 1px solid var(--rule); flex-wrap: wrap;
    }
    .ep-nav-bar a { font-family: var(--sans); font-size: 0.95rem; color: var(--ink); max-width: 45%; }
    .ep-nav-bar a:hover { color: var(--pink); }
    .ep-nav-bar .label {
      display: block; font-size: 0.72rem; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--ink-fade);
      margin-bottom: 0.3rem; font-weight: 500;
    }
    .ep-nav-bar .next { text-align: right; margin-left: auto; }
    .closing {
      padding: clamp(4rem, 10vh, 7rem) var(--x) clamp(3rem, 6vh, 5rem);
      position: relative; overflow: hidden;
      border-top: 2px solid var(--ink); margin-top: 3rem;
    }
    .closing .dx1 { width: 26px; height: 26px; top: 30%; right: 18%; }
    .closing .dx2 { width: 14px; height: 14px; top: 52%; right: 28%; }
    .closing .dx3 { width: 60px; height: 60px; bottom: 20%; right: 10%; }
    .closing-label {
      font-size: 0.78rem; font-weight: 500; letter-spacing: 0.22em;
      text-transform: uppercase; color: var(--ink-soft); margin-bottom: 1.25rem;
      display: inline-flex; align-items: center; gap: 0.75rem; position: relative; z-index: 2;
    }
    .closing-label::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--yellow); }
    .closing h3 {
      font-weight: 600; font-size: clamp(1.5rem, 3.5vw, 2.4rem);
      letter-spacing: -0.02em; line-height: 1.2; max-width: 720px;
      position: relative; z-index: 2;
    }
    .closing h3 em { font-style: normal; color: var(--pink); }
    .closing h3 a { border-bottom: 3px solid var(--pink); padding-bottom: 2px; color: var(--pink); }
    .closing h3 a:hover { color: var(--ink); border-bottom-color: var(--ink); }
    .closing .hint { display: block; font-size: 0.9rem; color: var(--ink-fade); margin-top: 1.25rem; position: relative; z-index: 2; }
    /* Mobile fixes */
    @media (max-width: 720px) {
      .ep-hero { min-height: auto; padding-bottom: 2.5rem; }
      .ep-hero h1 { font-size: clamp(1.7rem, 6vw, 2.4rem); }
      .ep-meta .ep-tags { margin-left: 0; }
      .ep-quote::before { opacity: 0.3; }
      .ep-transcript-content { max-height: none; overflow-y: visible; }
      .ep-nav-bar { flex-direction: column; gap: 1.25rem; }
      .ep-nav-bar a { max-width: 100%; }
      .ep-nav-bar .next { text-align: left; margin-left: 0; }
      .ep-listen a { padding: 0.7rem 1.1rem; }
      .closing .dx1, .closing .dx2 { display: none; }
    }
  </style>
</head>
<body>

<!--BEGIN:NAV-->
<!--END:NAV-->

  <header class="ep-hero">
    <span class="dot dh1 d-cyan"></span>
    <span class="dot dh2 d-pink"></span>
    <span class="dot dh3 d-yellow"></span>
    <span class="dot dh4 d-yellow"></span>
    <div class="ep-hero-inner">
      <span class="ep-eyebrow">thinking on thinking${seBlock}</span>
      <h1>${title}</h1>
      <p class="ep-meta">
        ${metaSpans}
        ${tagsHtml}
      </p>
    </div>
  </header>${playerSection}

  <article class="ep-body">
    <div class="ep-summary">
${descHtml}
    </div>
  </article>${quotesHtml}${transcriptHtml}

  <nav class="ep-nav-bar" aria-label="Episode navigation">
    <a href="../podcast.html">
      <span class="label">Back to</span>
      All episodes
    </a>
    ${nextHtml}
  </nav>

  <section class="closing">
    <span class="dot dx1 d-pink"></span>
    <span class="dot dx2 d-cyan"></span>
    <span class="dot dx3 d-yellow"></span>
    <span class="closing-label">your move</span>
    <h3>Heard something that got you thinking? <em><a href="mailto:hello@joyus.studio">Be our friends.</a></em></h3>
    <span class="hint">hello@joyus.studio · we read everything</span>
  </section>

<!--BEGIN:FOOT-->
<!--END:FOOT-->

</body>
</html>
`;
}

// ---------- main ----------
const files = fs.readdirSync(PODCAST_DIR)
  .filter(f => f.endsWith('.html') && f !== 'archive.html' && f !== TEMPLATE_FILE);

let success = 0, skipped = 0, errors = [];
for (const f of files) {
  try {
    const filepath = path.join(PODCAST_DIR, f);
    const orig = fs.readFileSync(filepath, 'utf8');
    const data = {
      filename: f,
      title: extractTitle(orig),
      descMeta: extractDescriptionMeta(orig),
      descParas: extractDescriptionParas(orig),
      iframeSrc: extractIframeSrc(orig),
      quotes: extractQuotes(orig),
      transcriptParas: extractTranscriptParas(orig),
      listen: extractListenLinks(orig),
      next: extractNext(orig),
      tags: extractTags(orig),
      ...extractMeta(orig),
    };
    if (!data.title) { skipped++; continue; }
    const html = buildPage(data);
    fs.writeFileSync(filepath, html);
    success++;
  } catch (e) {
    errors.push(`${f}: ${e.message}`);
  }
}
console.log(`rebuilt ${success}, skipped ${skipped}, errors ${errors.length}`);
if (errors.length) {
  console.log('\nErrors:');
  for (const e of errors) console.log('  ' + e);
}
