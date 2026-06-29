# Pending work — joyus-website

A shared running list of outstanding work, so Divya and Kahran can collaborate without losing track.
Owners are marked per item. Status: ☐ not started · ◐ in progress · ☑ done.

_Last updated: 2026-06-03_

---

## Kahran's items (copy / writing)

These need Kahran's hand — they're copy or editorial decisions, not implementation.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Rewrite the **"Tell us…"** copy on the home page intent box | ☑ | Reworked hero (2026-06-03): lead line "tell us what you're needing", cursor-free crossfade grey prompts, resting blink caret, field wraps so long needs don't clip. |
| 5 | Rewrite the **subhead on the Work page** (`work/index.html`) | ☑ | "One body of work, cut a few different ways so more kinds of people find their way in." |
| 17 | **Write the Karuna case study** | ☐ | Current client who weighed a co-founder decision. No case study exists. Would suit Services **advise Q4** ("Do I need a co-founder, or a hire?"), which currently leans on podcast eps (prem/lena). When written, add a project + surface it there. |
| 18 | **Finish the QuizNext case study** | ☐ | Kahran's spun-off quizzing tool (acquired by Lead School); case study never finished. Services **advise Q3** ("Do I have more options than I think I do?") currently links the podcast episode instead. When written, repoint `intent-box.js` POOL `qn` → the case-study page + flip its `type` from `podcast` to `project`. |

---

## Divya's items (design / implementation)

Everything below is ours to build. Detail to be filled in as we scope each one.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2 | **Search logic re-check** — another round on the intent-box scoring/routing (`intent-box.js`) | ☑ | Full read-only audit done (agent + verified by hand). **Verdict: algorithm sound, no real bugs.** Hardening applied (lowercase term compare + stable tie-break). Coverage gaps (ux/ui, "how to price", logo, crisis/PR) still need intent→page mappings from K/D when wanted. |

### Post-launch — connect case studies everywhere (NOT a launch blocker)

**8 case studies** (Klydo, Tatsam, Pratham USA, XTDB, Gliitch, ConveGenius, TomboyX, Secret Senses) — reachable via **21 intent rows** in `intent-box.js` — route to `coming-soon.html`, not their live `work/*.html` pages. **Per Kahran (2026-06-03): fine to go live without these wired — he'll review the case studies after launch.** Once he reviews & marks each ready, wire them up everywhere: intent-box `coming-soon.html` → real `work/<slug>.html`; the **Services verb examples** in `services.html` point at the same coming-soon pages (repoint those too); and surface case studies across the site, e.g. the About marquee (currently just Rachna Nivas + Agemo).
| 3 | **Link audit** — find missing / broken / stale links across the codebase | ☑ | Found & fixed: dead `shape-echo.js` (deleted file) still loaded by 3 pages (thesis-workshop, klydo-cut-design, klydo-cut-strategy) → removed. Rest were false positives. Reusable checker at `scripts/link-audit.mjs`. External links not network-verified. |
| 4 | **Footer edits** (`_partials/foot.html` → `sync-chrome.js`) | ☑ | Removed the email from the "say hi · hello@joyus.studio" link → now just "say hi". Synced to 156 pages + fixed the podcast episode template. |
| 6 | **Rework the bottom of the home page — the "pulling" line** (`index.html`) | ☑ | Replaced the bottom-right "pulling on you" note with a browse path: "or start with what we do · who we are" → services / about (fades out while the suggestions dropdown is open). Done in the 2026-06-03 hero rework. |
| 7 | **Question design** — adjust the design of the individual / specific questions | ☑ | Services advise panel jumped vertically on hover. Real cause: the right-hand `.related` panel used `min-height`, so a tall related-card cluster (cards get random vertical stagger via JS) grew the grid row and re-stretched the questions column. Fix: `.related` now a **fixed** `height` (reserved stage stays on the right only) + `.questions { align-self: start }`. Also switched the hover indent from `padding-left` to `transform` so long questions don't re-wrap. |
| 8 | **Bottom spacing** on the Services page (`services.html`) | ☑ | Gap above the closing was too big (`.verbs` bottom padding + `.closing` top padding stacked to ~13rem). Cut `.verbs` bottom padding to `clamp(1.5rem, 3vh, 2.5rem)`. Shared `.closing` rule untouched. |
| 9 | **Remove eyebrow** in the ending section | ☑ | Removed the `your move` closing eyebrow site-wide (93 files: 8 main pages + 85 podcast episodes + episode template). Orphaned `.closing-label` CSS rules left in place (harmless). |
| 10 | **Remove the divider** in the headline on the Podcast page (`podcast.html`) | ☑ | Removed the hairline (`border-top`) above the hero meta line. |
| 11 | **Remove eyebrow** in the end section on the Podcast page (`podcast.html`) | ☑ | Removed the `your move` closing label. |
| 12 | **Rework the "How we work" section on About** (`about.html`) — too simplistic, doesn't capture the depth/sense | ☑ | Old chips/diptych A/B + hover-hidden sentences scrapped. Rebuilt as **alternating big lines**: large colored stance-word as a label + Kahran's **full sentence kept verbatim** as the always-visible hero, with only the leading "instead of …," clause muted (not struck/split/hidden). Rows alternate left/right. Removed the TEMP toggle markup + JS. (Kahran's copy is unchanged — an earlier pass split the sentences; reverted.) |
| 13 | **Remove unavailable projects** on the About page (`about.html`) | ☑ | Deleted all 8 `is-coming-soon` cards from the selected-work marquee. Only Rachna Nivas + Agemo remain (live links). **Note:** band is now thin — could wire up klydo/tatsam/pratham/xtdb/gliitch/convegenius as real links later (their case studies exist). `is-coming-soon` CSS left orphaned (harmless). |
| 14 | **Comics index page design** (`comics/index.html`) | ☑ | Index was already the reference (standard hero). Kept its hero + "browse more" outro; it's the consistency target the readers now match. |
| 15 | **Comics subpage design** (`comics/*.html` reader) | ☑ | All 5 readers: converted `.comic-hero` → site-standard hero (eyebrow "off the clock" + h1 + sub + credits meta, copy verbatim); removed the `.print-cta` print form and the "~ end ~" block. Bottom = back/next nav → footer. (Orphan print-cta JS/CSS + Firebase CDN tags left for later cleanup.) |
| 16 | **"Say hi" page cleanup** (`say-hi.html`) | ☑ | Removed "No pitch required.", the "Hit send…" note, and the ways-list ornaments (bullet dots, arrows, divider lines) — links are now plain & directly clickable. Kept the eyebrow dot-marks on "drop us a line" / "other ways to find us" (only the sub bullets were removed). |

---

## Follow-ups added mid-session (2026-06-03)

| Item | Status | Notes |
|------|--------|-------|
| Say-hi headline alignment | ☑ | Hero was vertically centered (`justify-content: center`, `56vh`); set to `flex-start` + `60vh` to match About/Services/Workshops. |
| Say-hi headline→section spacing | ☑ | Trimmed hero `min-height` (60vh→44vh) + bottom padding so the contact section starts closer. Headline top position unchanged. |
| Remove closing hint site-wide | ☑ | Stripped `hello@joyus.studio · we read everything` from 96 closing sections (the "tell us" CTA covers it). Concept-page variants + looking.html JS left alone. |
| About headline→section spacing | ☑ | Trimmed About hero `min-height`/bottom padding + `.values` top padding. |
| About selected-work scroller | ☑ | After #13 it was 2 items but still an infinite marquee. Now a static **aligned card row** (`.sw-cards`) in the same 1200px column as the "A few we're proud of" heading — wraps on narrow screens, no scroller. (Marquee engine JS now unused on About — left in place, flagged for cleanup.) |
| Comics index bottom | ☑ | Replaced the invented `.comics-outro` ("Want more?" + browse pills) with the site-standard `.closing` block ("Want more? Be our friends." → say-hi). |
| Say-hi email sub | ☑ | Removed "· we read everything" from the Email row → just `hello@joyus.studio`. (The thank-you confirmation message still says it; left as-is.) |
| Header→first-element spacing | ☑ | = the **headline→first-section gap** (clarified). Standardized every hero to About's: `min-height: 50vh` + bottom padding `clamp(1.5rem, 3vh, 2.5rem)` + `justify-content: flex-start`. Brought services/workshops/podcast/work-index down from 60vh + big bottom pad; comics index + 5 readers from centered → top-anchored 50vh. (say-hi left at 44vh — already tight + approved.) Also aligned comics hero **top** padding to `14vh/10rem` earlier (consistency bonus). |
| Search hardening | ☑ | `intent-box.js`: lowercase each `term` before comparison (fixes the latent case bug — "don't leave buggy code"); added a stable tie-breaker (score desc, then CONTENT_MAP order) for reproducible ranking. Syntax-checked. |
| Comics consistency | ☑ | Header + footer already uniform (partials). Converted all 5 readers' `.comic-hero` → site-standard hero (eyebrow "off the clock" + h1 + sub + credits meta). Removed the `.print-cta` print form + "~ end ~" block; reader bottom = back/next nav → footer. Index kept (it was the reference). Orphan print-cta JS (firebase, guarded) + CSS left for later cleanup. |

## Longer-term (post-launch, no rush)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 19 | **Domain cutover to `joyus.studio`** | ☑ | LIVE 2026-06-04 — `https://joyus.studio` serves the GitHub Pages site over HTTPS; old `kh9010.github.io` URL 301-redirects. DNS (in Squarespace): apex A → GitHub IPs (185.199.108–111.153), `www` CNAME → `kh9010.github.io`; Google Workspace MX left intact. All absolute URLs swept to joyus.studio + `CNAME` file added. **Remaining manual (Kahran):** (a) GitHub repo → Settings → Pages → tick **Enforce HTTPS**; (b) cancel the Squarespace **website** plan — keep the domain, DNS & Google email; (c) optional: raise the new records' TTL back to 1–4 hrs once stable. |
| 20 | **Migrate the remaining WIP pages** to the new design system | ☐ | Still on the old/unstyled system (wearing the yellow WIP banner): the 6 hubs, 15 `thinking/*` essays, `ai-workshops.html`, `services-old.html`, `404.html`. Migrate one at a time; swap nav/footer to the partial markers and run `scripts/sync-chrome.js`. |
| 21 | **Proper social share image (`og:image`)** — _for Divya_ | ☐ | Right now `og:image` is just the logo (`images/logo.webp`), which renders small/letterboxed on the 1200×630 share card (iMessage/Slack/LinkedIn/X). Design a real 1200×630 card: paper bg (`#FAF7F2`), logo + "Joyus Studio" wordmark + the new tagline **"Stories, Strategy, Serious Play"**, a few accent dots. Then point `og:image` (in `index.html` `<head>`) at the new asset. (Context: Kahran refreshed the homepage Google title/desc on 2026-06-29 — new title is "Joyus Studio — Stories, Strategy, Serious Play"; this is the matching share-card upgrade.) |

---

## Notes

- Branch discipline: Divya works on `designmayNN` branches; Kahran/Claude sessions use `kahran-<date>-<task>`. Don't cross-commit.
- **This file is the single source of truth for outstanding work** — across Divya, Kahran, and Claude sessions. Update statuses here as items land. (Claude: don't keep a parallel pending list in memory.)
