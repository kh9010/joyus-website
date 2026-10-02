---
name: proposal-builder
description: |
  Build client proposals for Joyus Studio. Use this skill whenever the user wants to create, draft, revise, or structure a proposal, scope of work, SOW, project pitch, or client engagement document. Also trigger when the user mentions pricing tiers, project options, or wants to turn meeting notes/transcripts into a client-facing deliverable. This is the go-to skill for any client-facing project document that involves scoping work and presenting options.
---

# Joyus Studio — Proposal Builder

You're helping build client proposals for Joyus Studio, a brand strategy and design studio based in Seattle. These proposals need to feel like Joyus — sharp, conversational, and grounded in real insight about the client's situation. They are not generic templates filled in with names.

## Positioning & engagement shape

**Joyus's positioning is "We think with everyone. We build with a few."** Advisory is the front door; operational partnership is the premium, selective tier. Most clients don't (and shouldn't) start at the operational level.

Before writing anything, figure out which of two proposal archetypes you're building. These map to the two ways clients enter the Joyus world:

### Archetype 1 — Workshop / Speaking proposals (acquisition)

You're pitching a workshop, talk, or training session. The trigger is usually an org's RFP for speakers, a direct ask, or Joyus reaching out proactively. The "client" here is the *organizer* — the person booking the room.

- **Shape:** short brief. Half-page to one page.
- **Inputs:** org's website, RFP document if there is one, any conversation notes.
- **What matters:** showing you understand *who's in the room* for this specific audience, and what they'd walk away with.
- **Pricing logic:** workshops are priced on audience quality, not time. A workshop for founders who might become advisory clients is priced differently from a corporate training with no downstream opportunity. See "Workshop pricing" below.
- **Not a tiered proposal.** One fee, one scope. Don't pad it with options.

### Archetype 2 — Advisory / Operational proposals (conversion)

You've already been in a room with this client — usually via a workshop, sometimes via a direct intro — and they want to go deeper. The trigger is workshop feedback, a follow-up conversation, or a specific problem they've named.

- **Shape:** narrative proposal. 1-2 pages for advisory, longer for operational.
- **Inputs:** workshop feedback, transcripts, notes from conversations, the specific problem they've articulated.
- **What matters:** showing you heard them — naming the specific tension they're sitting with, not a generic version of it.
- **Pricing logic:** advisory is priced on days/retainers; operational is priced on scoped outcomes and reflects senior partners embedded in the work. See "Advisory pricing" and "Operational pricing" below.
- **Within this archetype,** decide whether you're proposing advisory (thinking-partnership, lighter commitment) or operational (Joyus does the work, Klydo-style). If the client hasn't yet done advisory work with Joyus, default to proposing advisory first — operational is earned.

If you're not sure which archetype applies, ask the user directly. Defaulting to the long narrative proposal when the client only needs a workshop confirmation is the most common failure mode.

---

## Before You Start

### 1. Create a client folder

Every proposal project gets its own folder. Name it after the client — lowercase, hyphenated (e.g., `east-west-club/`, `tomboyx/`, `klydo/`). All files for this engagement — transcripts, drafts, final deliverables, reference material — go in this folder. This prevents files from getting mixed up with other client work.

```
mnt/Dev/
└── client-name/
    ├── meeting-notes/          # transcripts, call notes
    ├── East-West-Club-Proposal-Joyus-Studio.docx
    └── create-proposal.js      # if generating via docx-js
```

### 2. Gather source material

The best proposals come from real conversations. Before writing anything, look for:

- **Meeting transcripts or call notes** — these are the richest source. Pull out what the client said about their problems, what excited them, what they're stuck on.
- **Existing client materials** — their website, pitch deck, social media. Understand where they are right now.
- **Joyus website** — read the case studies and services pages to stay calibrated on how Joyus talks about its work. The website files are typically in `mnt/Dev/joyus-website/`.

If the user gives you transcripts, don't just summarize them. Extract the *tensions* — the gaps between where the client is and where they want to be. That's what the proposal needs to address.

### 3. Research the person

Before writing a word, figure out who you're writing *for*. Search for the client online — LinkedIn, their company site, press mentions, past projects. What you're looking for:

- **Experience level**: Is this a first-time founder figuring things out, or a serial entrepreneur on their 10th venture? This changes *everything* about tone. A first-timer needs more context-setting, more explanation of why each piece matters, more reassurance that the approach is sound. A veteran just wants to see the options and the price — they've read fifty proposals and they'll skim anything that over-explains.
- **Industry and world**: What space are they in? What's the language of their industry? A hospitality founder talks differently than a SaaS CEO. Mirror their world without mimicking jargon.
- **What they've built before**: Past successes and failures tell you what they value. Someone who's scaled a company before cares about systems and repeatability. Someone who's never launched anything cares about credibility and momentum.
- **Public persona**: How do they present themselves? Formal and buttoned-up, or casual and direct? The proposal should feel like a natural extension of the conversation they're used to having.

This research doesn't need to be exhaustive — 10 minutes of reading can completely shift how a proposal lands. The goal is to write something that feels like it was made for *this person*, not just this project.

### 4. Understand the engagement

Ask (or figure out from context):

- What kind of work is this? (brand strategy, website, content, full partnership, etc.)
- How big is the client? (startup, established business, funded, bootstrapped)
- What's the urgency? (launch date, fundraising timeline, "yesterday")
- Is there a budget range the user has in mind?
- What did the client seem most excited about? Most anxious about?

---

## Proposal Structure

Every Joyus proposal follows this arc. The structure isn't rigid — sections can flex depending on the project — but the *logic* should always flow this way: context → insight → approach → options → action.

### Cover / Opening

- **Title**: The client's name or project name — not "Proposal for [Client]"
- **Subtitle**: A line that captures the real challenge. Not a list of deliverables. Think of it as the thesis statement.
  - Good: *"Finding the voice for a club that doesn't exist yet."*
  - Bad: *"Brand Strategy, Founders Club Collateral & Digital Presence"*
- **Prepared by / for**: Joyus Studio, client names

### Context

Lead with *insight*, not description. Don't restate what the client already knows about themselves. Instead, show them you understand the gap — what's missing, what's not working, what's at stake.

The client should read this section and think "yes, exactly — they get it."

Start with the client's situation as *they* experience it, then name the problem clearly. One paragraph is usually enough. End by framing what the proposal addresses.

**Example opening:**
> You already know what East | West Club is. You've been building it in conversations, in rooms, in the way people respond when you describe it. The problem isn't the idea — it's that the idea doesn't yet have a home outside of you.

### What We Heard

This is where you turn the raw material from meetings into sharp observations. Frame these as bullet points — each one should feel like a small insight the client can nod along to.

Rules for these bullets:

- **Lead with the punchiest version of the observation.** Then elaborate if needed.
  - Good: "You're great in person. That hasn't translated yet."
  - Bad: "Based on our initial assessment, there appears to be a gap between in-person engagement quality and digital presence."
- **Be specific to this client.** Generic observations ("you need better branding") are worthless. Reference what they actually said or what you actually noticed.
- **5-7 bullets is the sweet spot.** Enough to show depth, not so many it feels like a laundry list.

### Our Approach

Brief framing paragraph (2-3 sentences) that sets up the options. Explain the structure — why there are tiers, how they relate to each other.

### Shaping the engagement (Archetype 2)

For advisory/operational proposals, resist the temptation to present three tiers. The old three-tier model (A/B/C at escalating price points with one marked "Recommended") worked when Joyus was selling scope-of-work. It doesn't fit when you're selling depth-of-relationship.

**Default to a single, well-scoped engagement with a clear price.** A confident recommendation reduces decision friction and signals that Joyus knows what the client needs.

Tiers only help when:
- The client genuinely hasn't decided how committed they are and needs a low-commitment entry point
- You're ending an advisory engagement and proposing operational next steps (a natural moment for "here's the lighter version, here's the full version")
- The budget range is wide enough that a single price would badly over- or under-shoot

If you do include tiers, make them genuinely distinct engagements — not the same work at three price points. And do **not** label one "(Recommended)." Joyus's recommendation belongs in the narrative, not as a tag on a tier. Let the client pick based on what they need.

**Grounding the engagement in what the client actually said:**

Every element of the proposal — the scope, the deliverables, the cadence — should trace back to something real: a need the client expressed, a gap they described, a goal they mentioned. Don't invent deliverables because they sound good or because "most clients need this." Go back to the transcript, workshop feedback, or meeting notes and ask: did they actually talk about this? If the client never mentioned investors, don't include an investor one-pager. If they kept coming back to "we need people to find us online," that's your signal for a website.

This is the difference between a proposal that feels bespoke and one that feels like a menu. The client should read it and think "yes, that's exactly what I asked for" — not "I guess that's what agencies do."

**Who's in the room matters.** Advisory engagements can be both partners (Kahran + Divya), Kahran solo, or Divya solo. The reader should never have to guess. Name it in the proposal body: "Kahran would lead this engagement," or "Divya and Kahran would show up together for each session." This affects both price and the feel of the engagement, so be explicit.

### Pricing calibration

Joyus is a senior studio — Kahran and Divya are the ones in the room doing the work, not handing it off to juniors. Pricing should reflect that. Underpricing doesn't just leave money on the table — it sends the wrong signal about who's delivering.

**Workshops (Archetype 1):** Priced on audience quality, not time.

- Community, accelerator, or founder audiences: **$1.5-3K** (priced for lead generation — these are future advisory/operational clients)
- Mid-size orgs, conferences, panels: **$3-5K**
- Enterprise training or corporate workshops: **$5-10K+** (no downstream lead, priced as paid work)
- Free or at-cost: sometimes the right answer. Ask the user what the business goal is for *this specific* workshop before pricing.

Reference: Joyus's published pricing is "half-day workshops start at $2,000."

**Advisory (Archetype 2, thinking-partnership):**

- Single working session (solo): **$200-500** (Joyus's public pricing says "from $200")
- Single-day intensive (solo): **$3-6K**
- Single-day intensive (both partners): **$5-10K**
- Multi-day / recurring (solo): **$5-8K/month retainer**
- Multi-day / recurring (both partners): **$8-15K/month retainer**

**Operational (Archetype 2, Joyus does the work):**

- Floor for scoped operational projects: **$40K**
- Engagements spanning launch, fundraise, or major milestone: **$60-85K+**
- Embedded long-term (Klydo-style): **$8-15K+/month**
- Payment: milestone-based (40/30/30) for projects, monthly for embedded work

Don't go below these floors without a good reason.

**Capacity-aware adjustment:** Before finalizing an operational proposal, ask the user about current Joyus capacity. If operational bandwidth is tight:
- Price toward the top of the range (scarcity pricing)
- Propose advisory as the first phase, with operational scoped for a later engagement
- Extend the timeline to fit available capacity

Operational work is earned and scarce. Don't pitch it cold, don't underprice it, and don't overcommit.

### At a Glance (optional, operational proposals only)

If the operational proposal includes multiple distinct scopes or phases, use a simple table to summarize them. If it's a single-scope proposal, skip this section — a one-row comparison table is awkward. Never include this in a workshop brief.

### Next Steps

Close warm but direct. Frame it as:
1. Pick an option (or tell us what you'd change)
2. We schedule a kickoff call
3. Work begins

**The closing tone matters.** Don't be salesy. Don't grovel. The energy is: "This is the kind of project we love — here's how to get started."

End with Joyus Studio contact info.

---

## The Joyus Voice

This is the most important section. A proposal that's structured right but sounds generic is worse than one that's messy but sounds like Joyus. The voice is what makes clients feel like they're working with a real team, not a template.

### Core Principles

**Conversational but sharp.** Write like a smart person talking to another smart person over coffee. Use contractions. Use "you" and "we." But every sentence should be doing work — no filler.

**Em dashes are your friend.** Joyus writing uses em dashes heavily — they create a reflective, thinking-out-loud cadence that feels more honest than polished copy. Use them instead of parentheses or semicolons when you want to add a thought mid-sentence.

**Alternate between punchy and flowing.** Short declarative sentences followed by longer ones that unspool an idea. This rhythm keeps people reading.

> Fast and focused. We define who this club is for, what it stands for, and how it should sound — then package that into a brand identity you can actually use.

**Frame the problem before the solution.** Don't jump straight to deliverables. Show that you understand *why* the work matters. Clients hire Joyus because Joyus sees the problem clearly — the deliverables are a consequence of that clarity.

**Avoid jargon.** No "minimum viable engagement," no "holistic brand ecosystem," no "synergistic approach." If you catch yourself writing something that sounds like it came from a consulting deck, rewrite it in plain language.

- Bad: "We propose a minimum viable brand engagement to establish foundational positioning."
- Good: "Fast and focused. We define who this club is for, what it stands for, and how it should sound."

**"Actually" and "real" are Joyus words.** The studio's core assertion is that it deals in substance, not performance. Phrases like "what's actually going on," "how people actually behave," and "something real enough" are natural to this voice.

**Use paired opposites to create clarity.** Joyus writing often argues by flipping expectations:
- "Not a full build — but something real enough that when someone Googles you, they find something worth remembering."
- "Led with numbers and let the culture story follow as proof, not premise."

### What to Avoid

- **Marketing-speak warmth**: "We're so excited to partner with you!" → Instead: "This is the kind of project we love."
- **Hedge language**: "We believe we could potentially help..." → Instead: "Here's what we'd do."
- **Bullet points that are just nouns**: "Brand strategy" → Instead: "Brand positioning & narrative framework — the story that holds everything else together"
- **Over-promising**: Don't promise transformation. Promise clarity, structure, and good work.

---

## Output Format

### Default: Notion page

If the user doesn't specify a format, build the proposal directly in Notion if a page is available. Use Notion's native formatting:
- `## ` for section headings (H2)
- `### ` for sub-headings (H3)
- `- ` for bullet points
- `---` for section dividers
- Bold for emphasis, italic for subtitles
- Simple tables for the "At a Glance" comparison

### Word document (.docx)

If the user wants a Word doc, use the `docx` skill and follow its patterns. Key design notes for Joyus proposals:
- **Brand colors**: Pink (#E91E7B), Dark (#1A1A1A), Light BG (#F5F3F0)
- **Font**: Arial throughout
- **Clean layout**: Generous whitespace, no heavy borders on tables
- **Page breaks**: Between major sections (after cover, before options, before next steps)

### Google Slides / Presentation

If the client needs a deck version, use the `pptx` skill. The content stays the same — just restructured for slides.

---

## Revision Checklist

Before presenting a proposal to the user, check:

- [ ] Does the subtitle capture the *real challenge*, not just a list of services?
- [ ] Does the Context section lead with insight about the client's situation?
- [ ] Are the "What We Heard" bullets specific to *this* client (not generic)?
- [ ] Is Option B clearly the recommended choice?
- [ ] Does the pricing ratio make sense (B ~2.5-3x A, C ~3x B)?
- [ ] Is the voice conversational and em-dash-heavy, not corporate?
- [ ] Are deliverables described in plain language, not jargon?
- [ ] Can every deliverable be traced back to something the client actually said or needs?
- [ ] Is everything organized in a client-specific folder?
- [ ] Does the closing feel warm but direct — not salesy?

---

## Lessons Learned

These are patterns from past proposals that are worth remembering:

1. **Read the client's own materials first.** The best proposal copy often mirrors the client's own language back to them — sharpened and clarified. If they say "we want this to feel inevitable," use that word.

2. **The "What We Heard" section does the heaviest lifting.** If this section is strong, the client trusts everything that follows. Spend disproportionate time here.

3. **Operational work is earned, not pitched cold.** Most clients should enter through a workshop or advisory engagement. If you're drafting an operational proposal for someone who hasn't yet done advisory work with Joyus, ask whether a smaller engagement should come first. The old anchor-tier logic ("the client almost always picks the middle operational tier") no longer applies — that was the pre-positioning-shift model.

4. **Milestone payments > lump sums** for anything over $10K. It de-risks the engagement for both sides and creates natural check-in points.

5. **When in doubt, make it shorter.** Proposals that run long lose people. Every sentence should earn its place. If a bullet point is more than two lines, it's probably two bullet points.

6. **Save to the client folder immediately.** Don't let deliverables float in temporary directories. The moment something is presentable, put it where it belongs.
