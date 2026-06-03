# Pending work — joyus-website

A shared running list of outstanding work, so Divya and Kahran can collaborate without losing track.
Owners are marked per item. Status: ☐ not started · ◐ in progress · ☑ done.

_Last updated: 2026-06-03_

---

## Kahran's items (copy / writing)

These need Kahran's hand — they're copy or editorial decisions, not implementation.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Rewrite the **"Tell us…"** copy on the home page intent box | ☐ | The typewriter / placeholder prompt copy on `index.html`. |
| 5 | Rewrite the **subhead on the Work page** (`work/index.html`) | ☐ | |
| 17 | **Write the Karuna case study** | ☐ | Current client who weighed a co-founder decision. No case study exists. Would suit Services **advise Q4** ("Do I need a co-founder, or a hire?"), which currently leans on podcast eps (prem/lena). When written, add a project + surface it there. |
| 18 | **Finish the QuizNext case study** | ☐ | Kahran's spun-off quizzing tool (acquired by Lead School); case study never finished. Services **advise Q3** ("Do I have more options than I think I do?") currently links the podcast episode instead. When written, repoint `intent-box.js` POOL `qn` → the case-study page + flip its `type` from `podcast` to `project`. |

---

## Divya's items (design / implementation)

Everything below is ours to build. Detail to be filled in as we scope each one.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2 | **Search logic re-check** — another round on the intent-box scoring/routing (`intent-box.js`) | ☑ | Full read-only audit done (agent + verified by hand). **Verdict: algorithm sound, no real bugs.** Hardening applied (lowercase term compare + stable tie-break). Coverage gaps (ux/ui, "how to price", logo, crisis/PR) still need intent→page mappings from K/D when wanted. |

### ⛔ Blocked on Kahran — connect case studies everywhere

**8 case studies** (Klydo, Tatsam, Pratham USA, XTDB, Gliitch, ConveGenius, TomboyX, Secret Senses) — reachable via **21 intent rows** (2–3 search phrasings each) in `intent-box.js` — currently route to `coming-soon.html`, **not** their live `work/*.html` pages. **Per Divya (2026-06-03): leave as-is** — Kahran needs to review each case study and mark it done first. **Once he does, wire them up everywhere** (intent-box `coming-soon.html` → real `work/<slug>.html`, and surface case studies across the site, e.g. the About marquee which is currently just Rachna Nivas + Agemo). Tracking so this isn't forgotten.
| 3 | **Link audit** — find missing / broken / stale links across the codebase | ☑ | Found & fixed: dead `shape-echo.js` (deleted file) still loaded by 3 pages (thesis-workshop, klydo-cut-design, klydo-cut-strategy) → removed. Rest were false positives. Reusable checker at `scripts/link-audit.mjs`. External links not network-verified. |
| 4 | **Footer edits** (`_partials/foot.html` → `sync-chrome.js`) | ☑ | Removed the email from the "say hi · hello@joyus.studio" link → now just "say hi". Synced to 156 pages + fixed the podcast episode template. |
| 6 | **Bottom-of-page rework** — the closing section pattern across pages | ☐ | Relates to 9, 11. |
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

## Notes

- Branch discipline: Divya works on `designmayNN` branches; Kahran/Claude sessions use `kahran-<date>-<task>`. Don't cross-commit.
- This list is the source of truth across Claude sessions — update statuses here as items land.
