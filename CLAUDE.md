# Joyus Studio Website — Claude Code Instructions

## Before deploying (run before the last commit of the day)

Spin up these 6 agents in parallel for a final pass:

### 1. UX Agent
Check: dead ends, missing CTAs, broken hover states, mobile issues, navigation consistency, accessibility (aria-labels, skip-to-content, focus-visible). Fix directly.

### 2. Grammar Agent
Check: typos, double hyphens → em dashes, Oxford commas, inconsistent punctuation, incorrect names (Kahran Singh, Divya Tak — always correct). Do NOT touch podcast transcripts. Fix directly.

### 3. Product Marketing Agent
Check: value prop clarity on services + AI workshops, trust signals visible, CTAs on every page, content-to-service bridge on hub pages. Fix directly.

### 4. SEO Agent
Check: every page has title, meta description (150-160 chars), og tags, canonical URL, twitter:card. JSON-LD on hubs (CollectionPage), blog posts (Article), case studies (CreativeWork), podcast (PodcastSeries), services (Service). Sitemap includes all pages. One h1 per page. Fix directly.

### 5. QA Agent
Check programmatically: all internal links resolve, every page has shape-echo.js (except index.html), consistent nav + footer + footer-themes + footer-contact on all pages. No console.log debug statements. Sitemap complete. Fix directly.

### 6. Analytics Agent
Check: Firebase config consistent across home.html, index.html, shape-echo.js. Measurement ID is G-K7PDLTYWF6 (NOT G-H63H3KD6WQ). No debug console.logs in production. Firestore collection names consistent (intents, shapes, shape_visits). Fix directly.

## Shape detection
- 3 shapes + 1 easter egg: circle, triangle, rectangle, square
- Detection is stroke-based (counts straight line segments in the drawing)
- 2-3 segments → triangle, 4-6 → rectangle/square, 7+ → circle
- Circle → about.html, Triangle → comics/gossip.html, Square (easter egg) → podcast/504-creating-comics-together episode, Rectangle → home.html

## Content architecture
- Hub pages are editorial pieces with inline content cards (not separate sections)
- Blog posts in /thinking/ are drawn from podcast transcripts — Kahran and Divya's real words
- Podcast episode pages in /podcast/ have embedded players (Spotify for 13, Apple for 69) + transcripts
- Comics in /comics/ — Friend comic + Gossip (Plant, Phone, Zine assets still pending from Divya)

## Design system
- Fonts: DM Serif Display (headings), DM Sans (body), Caveat (accents/handwritten)
- Colors: --pink #E91E7B, --cyan #4FC4CF, --warm-gray #F5F3F0, --black #111214
- Hub accent colors: story=pink, building=cyan, behavior=#D4A843, play=#5BBD72, creative=#E8734A
- Editorial pages: gradient hero fading to white, 640-680px body, inline-card for content refs, pull-quote for big moments
- Grid/listing pages (work, podcast, comics): centered hero, card grids below
- Services: two-column capability sections with case study images

## Comics credits
- Kahran writes storylines + pencil sketches, Divya illustrates
- The zine is all Divya's work

## Firebase
- Project: joyus-studio
- Collections: intents (home.html intent box), shapes (splash page drawings), shape_visits (page visits by shape type)
- experimentalAutoDetectLongPolling enabled on all Firestore instances (fixes GitHub Pages CORS)

## What NOT to do
- Do NOT add Google Analytics tag G-H63H3KD6WQ (that's Kahran's personal site)
- Do NOT edit podcast transcripts (they're auto-generated from speech, meant to sound conversational)
- Do NOT center-align editorial page heroes (hubs, blog posts, services are left-aligned)
- Do NOT use more than 3-4 shape classifications (accuracy drops fast with freehand drawing)
- Canonical URLs currently point to kh9010.github.io — update when moving to joyus.studio domain
