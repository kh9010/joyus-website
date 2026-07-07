/*! intent-box.js — shared intent autocomplete for the Joyus homepage (index.html)
 *  and the looking.html near-miss page.
 *
 *  Owns CONTENT_MAP, the fuzzy scorer, the looser IDF near-miss pass, and the
 *  Enter-to-route behavior. Load AFTER the Firebase compat SDKs, then call
 *  initIntentBox() once the page has #intentInput, #intentSuggestions and a
 *  .hero-fill form in the DOM:
 *
 *      initIntentBox({ page: 'index', prompts: [ ... ] });  // homepage + typewriter
 *      initIntentBox({ page: 'looking', placeholder: '…' }); // looking.html, static
 *
 *  ⚠ The podcast rows in CONTENT_MAP are BAKED by
 *  scripts/podcast-meta-bake.mjs — it splices between the
 *  "a conversation worth listening to" umbrella row and the "// Comics" marker.
 *  Do not hand-edit that span; edit the podcast/*.meta.json sidecars and re-bake.
 */
(function (global) {
  'use strict';

  // ── Firebase: log what people type into the intent box (best-effort). ──
  // experimentalAutoDetectLongPolling works around CORS on GitHub Pages —
  // do not remove. All writes are silent on failure; the UI never blocks.
  var intentDb = null;
  try {
    firebase.initializeApp({
      apiKey: "AIzaSyAE4YqmNENXay7sS55JOJT4Ql9u73g8Xgk",
      authDomain: "joyus-studio.firebaseapp.com",
      projectId: "joyus-studio",
      storageBucket: "joyus-studio.firebasestorage.app",
      messagingSenderId: "654710924238",
      appId: "1:654710924238:web:c300c98f31d2f620b3c19f",
      measurementId: "G-K7PDLTYWF6"
    });
    intentDb = firebase.firestore();
    intentDb.settings({ experimentalAutoDetectLongPolling: true, merge: true });
  } catch (e) { intentDb = null; }

  function logIntent(text, matched, page) {
    if (!intentDb) return;
    try {
      intentDb.collection('intents').add({
        text: String(text).slice(0, 280),
        matched: matched,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        page: page || 'index'
      });
    } catch (e) { /* silent */ }
  }

    // ── Content map for fuzzy matching ──
    const CONTENT_MAP = [
      // TomboyX — pitch deck, fundraising, investor storytelling
      { display: "help with a pitch deck", terms: ["pitch", "deck", "investor", "presentation", "slides"], url: "coming-soon.html", dest: "TomboyX" },
      { display: "help with fundraising", terms: ["fundrais", "raising", "raise", "capital", "series", "round", "money", "venture", "vc"], url: "coming-soon.html", dest: "TomboyX" },
      { display: "an investor presentation that works", terms: ["investor", "pitch", "presentation", "convince", "fund"], url: "coming-soon.html", dest: "TomboyX" },

      // Klydo — fashion, ecommerce, GTM, product launch, startup growth
      { display: "to launch a product from zero", terms: ["launch", "product launch", "go to market", "gtm", "market entry", "zero"], url: "coming-soon.html", dest: "Klydo" },
      { display: "a fashion or ecommerce brand", terms: ["fashion", "ecommerce", "e-commerce", "clothing", "apparel", "retail", "shop", "store", "dtc", "d2c", "direct to consumer"], url: "coming-soon.html", dest: "Klydo" },
      { display: "to grow fast from zero", terms: ["growth", "grow", "scale", "traction", "early stage", "zero to", "0 to", "startup growth"], url: "coming-soon.html", dest: "Klydo" },

      // Tatsam — brand, visual identity, mental health
      { display: "a brand that feels like me", terms: ["brand", "branding", "brand identity", "brand story", "brand build", "visual identity", "identity"], url: "coming-soon.html", dest: "Tatsam" },
      { display: "to build a visual language", terms: ["visual language", "visual system", "design system", "illustration", "look and feel"], url: "coming-soon.html", dest: "Tatsam" },
      { display: "help with a mental health product", terms: ["mental health", "mental wellness", "wellness", "therapy", "wellbeing", "well-being", "mindful", "stigma", "safe space"], url: "coming-soon.html", dest: "Tatsam" },

      // PrathamUSA — nonprofit, donor journey
      { display: "to improve our donor experience", terms: ["donor", "donation", "nonprofit", "non-profit", "ngo", "charity", "giving", "philanthrop"], url: "coming-soon.html", dest: "PrathamUSA" },
      { display: "help with a nonprofit", terms: ["nonprofit", "non-profit", "ngo", "social enterprise", "social impact", "mission-driven", "impact"], url: "coming-soon.html", dest: "PrathamUSA" },
      { display: "to fix our user journey", terms: ["journey", "user journey", "customer journey", "experience map", "touchpoint", "flow", "funnel"], url: "coming-soon.html", dest: "PrathamUSA" },

      // ConveGenius — gamification, EdTech
      { display: "gamification for my product", terms: ["game", "gamif", "gamification", "interactive", "engage", "retention", "habit", "reward", "badge", "streak", "points"], url: "coming-soon.html", dest: "ConveGenius" },
      { display: "to make learning more engaging", terms: ["edtech", "education", "learning", "student", "classroom", "school", "teach"], url: "coming-soon.html", dest: "ConveGenius" },
      { display: "behavioral design for engagement", terms: ["behavior", "behavioural", "behavioral", "nudge", "habit", "retention", "engagement"], url: "coming-soon.html", dest: "ConveGenius" },

      // Secret Senses — packaging, illustration
      { display: "packaging design", terms: ["packaging", "package", "label", "cpg", "consumer goods", "shelf", "unboxing"], url: "coming-soon.html", dest: "Secret Senses" },
      { display: "hand-drawn illustration for my brand", terms: ["illustrat", "watercolor", "hand-drawn", "hand drawn", "artwork", "art direction"], url: "coming-soon.html", dest: "Secret Senses" },

      // XTDB — rebrand, developer tools
      { display: "to rebrand my company", terms: ["rebrand", "rename", "new name", "brand refresh", "brand overhaul", "repositioning"], url: "coming-soon.html", dest: "XTDB" },
      { display: "brand for a developer product", terms: ["developer", "dev tool", "saas", "b2b", "enterprise", "technical", "database", "api", "sdk", "open source"], url: "coming-soon.html", dest: "XTDB" },
      { display: "brand guidelines", terms: ["brand guideline", "style guide", "brand book", "brand system", "design guideline", "media guide"], url: "coming-soon.html", dest: "XTDB" },

      // Agemo — AI, developer tools, product strategy
      { display: "help with an AI product", terms: ["ai", "artificial intelligence", "llm", "generative", "prompt", "machine learning", "ml", "gpt", "chatbot", "copilot"], url: "work/agemo.html", dest: "Agemo" },
      { display: "product strategy and research", terms: ["product strategy", "user research", "discovery", "product direction", "product market fit", "pmf", "research"], url: "work/agemo.html", dest: "Agemo" },

      // Gliitch — brand identity from scratch
      { display: "a brand identity from scratch", terms: ["identity", "logo", "brand from scratch", "new brand", "brand creation", "moodboard", "mood board", "typography", "color palette"], url: "coming-soon.html", dest: "Gliitch" },

      // Rachna Nivas — content strategy, performance
      { display: "a content strategy", terms: ["content strategy", "content", "social media", "instagram", "personal brand", "creator", "influencer", "audience building"], url: "work/rachna-nivas.html", dest: "Rachna Nivas" },
      { display: "to find my creative voice", terms: ["creative voice", "voice", "authentic", "artistic", "artist", "performer", "dancer", "musician", "creative"], url: "work/rachna-nivas.html", dest: "Rachna Nivas" },

      // Services / Workshops
      { display: "to redesign my website", terms: ["website", "web design", "redesign", "site", "landing page", "homepage", "web"], url: "services.html", dest: "services" },
      { display: "a workshop for my team", terms: ["workshop", "sprint", "offsite", "team session", "team building", "unstuck", "facilitat"], url: "workshops.html", dest: "workshops" },
      { display: "an AI workshop for my team", terms: ["ai workshop", "ai training", "ai integration", "llm workshop", "claude", "chatgpt workshop", "ai workflow"], url: "workshops.html", dest: "workshops" },
      { display: "to understand pricing", terms: ["pricing", "price", "cost", "how much", "rates", "budget", "afford", "fee", "investment", "quote"], url: "services.html", dest: "services" },
      { display: "coaching or prep sessions", terms: ["coaching", "coach", "prep", "prepare", "narrative", "sharpen", "refine"], url: "services.html", dest: "services" },
      { display: "product design and UX", terms: ["product design", "ux", "user experience", "ui", "interface", "usability", "prototype", "wireframe"], url: "services.html", dest: "services" },
      { display: "to just think with someone", terms: ["think", "thinking", "advisory", "advise", "advice", "second opinion", "sounding board"], url: "services.html", dest: "advisory" },

      // About / team
      { display: "to learn about your team", terms: ["who are you", "about", "team", "founders", "meet", "people behind", "kahran", "divya", "background"], url: "about.html", dest: "about" },
      { display: "to tell a better story", terms: ["story", "storytelling", "narrative", "message", "messaging", "communicate", "communication", "copywriting", "copy"], url: "about.html", dest: "about" },

      // Podcast — index + episodes
      { display: "a conversation worth listening to", terms: ["podcast", "thinking on thinking", "listen", "episode", "spotify", "apple podcast", "conversation"], url: "podcast.html", dest: "the podcast" },
      { display: "to hear a founder talk about selling the food business she built with her life partner", terms: ["dina", "holzapfel", "smiqql", "cookie", "flaky salt", "sell", "exit", "acquisition", "life partner", "couple", "cofound", "zurich", "switzerland", "food business", "bakery"], url: "https://joyus.studio/podcast/503-building-and-selling-a-food-business-with-smiqql-s-dina-holzapfel.html", dest: "dina holzapfel" },
      { display: "to hear someone reinvent her career from engineer to psychologist", terms: ["reinvent", "career pivot", "engineer", "petroleum", "environmental", "oil rig", "iraq", "venture capital", "psycholog", "neuroscience", "phd", "masters", "german american", "identity"], url: "https://joyus.studio/podcast/503-building-and-selling-a-food-business-with-smiqql-s-dina-holzapfel.html", dest: "career reinvention" },
      { display: "to learn what criteria a repeat founder uses before starting another company", terms: ["criteria", "next venture", "outsource", "scalable", "ritual", "consumable", "boring business", "wellness", "ad test", "validate", "chatgpt", "novelty", "reassurance"], url: "https://joyus.studio/podcast/503-building-and-selling-a-food-business-with-smiqql-s-dina-holzapfel.html", dest: "founder criteria" },
      { display: "to hear two collaborators figure out how to make comics together", terms: ["comic", "comics", "co-create", "collaborat", "illustration", "writing", "sprint", "creative", "making", "zine", "duo", "partner"], url: "podcast/504-creating-comics-together-with-kahran-and-divya.html", dest: "comics together" },
      { display: "to think about staying a maker instead of scaling like an entrepreneur", terms: ["creator", "entrepreneur", "scale", "scaling", "founder", "studio", "small team", "execution", "vision", "miyazaki", "ghibli", "vc", "growth"], url: "podcast/504-creating-comics-together-with-kahran-and-divya.html", dest: "creator vs founder" },
      { display: "to hear sibling founders build a mental-health brand in india", terms: ["rockethealth", "rocket health", "abhineet", "ritika", "siblings", "mental health", "therapy", "psychiatry", "india", "healthcare", "gen z", "millennials", "stigma", "founders", "brand"], url: "podcast/505-building-healthcare-in-india-with-rockethealth-s-abhineet-and-ritika.html", dest: "rockethealth" },
      { display: "to hear a 67-year-old founder rethink what success was worth", terms: ["pradeep", "success", "retirement", "aging", "purpose", "microsoft", "harvard", "ego", "mortal", "finite", "founder", "career", "ambition", "legacy"], url: "https://joyus.studio/podcast/after-success-with-pradeep-singh-success-part-3.html", dest: "pradeep singh" },
      { display: "to hear a father regret missing his kids when they were small", terms: ["parent", "kids", "children", "regret", "present", "father", "fatherhood", "family", "grandkids", "work life balance", "70 hour weeks"], url: "https://joyus.studio/podcast/after-success-with-pradeep-singh-success-part-3.html", dest: "parenting regret" },
      { display: "to hear a deck and a brand torn apart slide by slide", terms: ["almora", "ayurveda", "ayurvedic", "skincare", "beauty", "brand", "luxury", "deck", "pitch", "investor", "ravi", "himalaya", "copy", "logo", "imagery"], url: "podcast/almora-crafting-desire-in-business.html", dest: "almora deck review" },
      { display: "to think about emotional connection vs cognitive load in brand copy", terms: ["emotion", "desire", "connection", "copy", "narrative", "cognitive", "load", "brand", "messaging", "engagement", "trust", "premium"], url: "podcast/almora-crafting-desire-in-business.html", dest: "brand emotion" },
      { display: "to think about alternatives to capitalism and what value really means", terms: ["capitalism", "alternatives", "nomaan", "value", "money", "society", "free market", "agency", "collective", "individual", "wealth", "science", "public sector", "philosophy", "politics"], url: "podcast/alternatives-to-capitalism-with-nomaan-x.html", dest: "capitalism" },
      { display: "to hear a young Sri Lankan founder build a creative agency outside the silicon valley default", terms: ["anuki", "sri lanka", "lines", "agency", "digital", "creative", "marketing", "founder", "colombo", "young leader", "comms", "strategy"], url: "https://joyus.studio/podcast/anuki-premachandra-planting-the-seeds-for-understanding.html", dest: "anuki premachandra" },
      { display: "to hear an advocacy campaign drop the sanitary pad tax", terms: ["period", "menstrual", "sanitary", "pad", "tax", "advocacy", "campaign", "policy", "women", "ngo", "development", "social sector", "behavior change"], url: "https://joyus.studio/podcast/anuki-premachandra-planting-the-seeds-for-understanding.html", dest: "period advocacy" },
      { display: "to hear a game designer talk about making learning fun for kids", terms: ["anurati", "games", "game design", "learning", "education", "children", "kids", "pedal studio", "unesco", "narrative", "madhubani", "venba", "florence", "indie"], url: "podcast/anurati-srivastva-on-games-and-game-design-with-divya.html", dest: "anurati srivastva" },
      { display: "to think about authenticity, trust and grace at work and with yourself", terms: ["authenticity", "grace", "trust", "relationships", "queer", "social media", "voice", "context", "feedback", "kindness", "apathy", "vulnerability", "self", "interviewing", "performance"], url: "podcast/authenticity-grace-trust-in-work-and-with-yourself.html", dest: "authenticity" },
      { display: "to hear a founder-ceo talk through perfectionism, energy and never feeling prepared", terms: ["ambika", "armoire", "founder", "ceo", "perfection", "energy", "extrovert", "burnout", "brand", "clothing rental", "small business", "values"], url: "https://joyus.studio/podcast/balancing-energy-expectations-and-perfectionism-with-ambika-singh-founder-and-ce.html", dest: "ambika singh" },
      { display: "to hear a founder admit she's not a good full-time parent", terms: ["parent", "mother", "kids", "maternity", "working mom", "balance", "family", "children", "motherhood", "boys", "time", "guilt"], url: "https://joyus.studio/podcast/balancing-energy-expectations-and-perfectionism-with-ambika-singh-founder-and-ce.html", dest: "founder mom" },
      { display: "to hear a couple talk about building a travel business together", terms: ["travel", "influencer", "couple", "partner", "instagram", "searat", "rashmee", "anant", "content", "creator", "cringe", "instinct", "manifest", "spouse"], url: "podcast/being-co-travel-influencers-with-divya-the-searats.html", dest: "the searats" },
      { display: "to think about trusting instinct over strategy in building a life", terms: ["instinct", "strategy", "intuition", "luck", "manifest", "career", "follow", "flow", "decisions", "creative", "non-strategic"], url: "podcast/being-co-travel-influencers-with-divya-the-searats.html", dest: "instinct vs strategy" },
      { display: "to hear a founder explain building genai for visual storytelling", terms: ["dashtoon", "soumyadeep", "genai", "ai", "comics", "visual", "storytelling", "fine-tun", "diffusion", "comfyui", "pytorch", "computer vision", "style", "consistency", "ai model"], url: "podcast/building-genai-for-visual-storytelling-with-divya-dashtoon-co-founder-soumyadeep.html", dest: "dashtoon" },
      { display: "to think about externalizing motivation so creative work feels lighter", terms: ["motivation", "muse", "creative", "process", "inspiration", "embodied", "internal", "block", "unblock", "art", "fulfilment", "muse"], url: "https://joyus.studio/podcast/building-the-motivation-for-success-part-8.html", dest: "creative motivation" },
      { display: "to hear an atheist sit with funeral rituals and grief", terms: ["ritual", "grief", "death", "funeral", "hindu", "atheist", "religion", "family", "spirituality", "loss"], url: "https://joyus.studio/podcast/building-the-motivation-for-success-part-8.html", dest: "rituals and grief" },
      { display: "to hear two artists who caravanned across africa making art", terms: ["africa", "caravan", "shikhant", "shivi", "cape town", "cairo", "documentary", "film", "comic", "artist", "travel", "journey", "churma"], url: "podcast/caravaning-across-africa-with-divya-artists-shikhant-and-shivi.html", dest: "african caravan" },
      { display: "to think about teaching art and film to kids in underserved schools", terms: ["teach", "workshop", "kids", "children", "ngo", "underprivileged", "schools", "film", "art", "education", "girls", "teen", "youth"], url: "podcast/caravaning-across-africa-with-divya-artists-shikhant-and-shivi.html", dest: "teaching kids art" },
      { display: "to watch a brand website get torn down for storytelling", terms: ["cranberry", "cranberry.fit", "femtech", "pms", "menstrual", "website", "teardown", "storytelling", "b2c", "branding", "homepage", "design", "ux", "aditi", "health"], url: "podcast/cranberry-fit-diving-into-storytelling.html", dest: "cranberry.fit" },
      { display: "to hear the team behind 1000xresist talk about making the game", terms: ["remy", "siu", "1000xresist", "sunset visitor", "game", "indie", "narrative", "design", "writing", "creative director", "devised", "theatre"], url: "https://joyus.studio/podcast/creating-a-successful-game-in-1000xresist-with-remy-siu-of-sunset-visitor-succes.html", dest: "remy siu" },
      { display: "to think about what it costs to make experimental art outside the standard pipeline", terms: ["performing", "arts", "grant", "admin", "burnout", "infrastructure", "freelance", "process", "vancouver", "canada", "experimental"], url: "https://joyus.studio/podcast/creating-a-successful-game-in-1000xresist-with-remy-siu-of-sunset-visitor-succes.html", dest: "arts process" },
      { display: "to think about whether making is a solitary or collaborative act", terms: ["creative", "process", "collaboration", "solo", "solitude", "co-create", "partner", "pair", "make", "making", "creator", "craft"], url: "podcast/creating-game-design-with-kahran-divya.html", dest: "creating together" },
      { display: "to hear what games teach that classrooms can't", terms: ["game", "games", "design", "learning", "failure", "resilience", "respawn", "narrative", "play", "education", "medium"], url: "podcast/creating-game-design-with-kahran-divya.html", dest: "games as teachers" },
      { display: "to question what success actually means and feels like", terms: ["success", "expectations", "contentment", "motivation", "growth", "achievement", "envy", "fulfilment", "burnout", "ambition", "mastery", "autonomy", "career", "intrinsic", "meaning"], url: "podcast/expectations-definitions-of-success-part-2.html", dest: "success" },
      { display: "to think about compensation beyond the paycheck when weighing a job", terms: ["compensation", "salary", "negotiation", "job", "career", "decision", "tradeoff", "hobby", "sabbatical", "lifestyle", "value", "fair pay"], url: "https://joyus.studio/podcast/how-to-find-fair-compensation-with-kahran-divya.html", dest: "fair compensation" },
      { display: "to think about how to make a hard task feel easier to start", terms: ["hard", "easier", "difficult", "start", "begin", "resistance", "block", "reframe", "skill", "learning", "habit", "practice", "easy", "ramp"], url: "podcast/how-to-make-hard-things-easier-with-kahran-divya.html", dest: "make it easier" },
      { display: "to think about self-teaching vs structured tutoring", terms: ["learn", "learning", "tutor", "teacher", "self-taught", "structured", "course", "class", "language", "japanese", "korean", "homework", "guided"], url: "podcast/how-to-make-hard-things-easier-with-kahran-divya.html", dest: "how we learn" },
      { display: "to hear cofounders work through ambivalence about a long-running project", terms: ["continuing", "project", "ambivalence", "burnout", "creative", "play", "optimism", "disappointment", "cofounders", "process", "long-term", "motivation", "podcasting", "craft", "anniversary"], url: "podcast/kahran-divya-on-continuing-projects.html", dest: "continuing-projects" },
      { display: "to think through identity and success after meeting two indian creators", terms: ["samhita", "meghana", "identity", "success", "creative", "writer", "founder", "mother tongue", "kannada", "hindi", "rituals", "reflection"], url: "https://joyus.studio/podcast/kahran-divya-on-the-learnings-from-meghana-srinivas-samhita-arni.html", dest: "samhita meghana" },
      { display: "to hear a poet talk about the winding path to becoming an artist", terms: ["poet", "poetry", "katieann", "vogel", "artist", "ocean", "nature", "fulfillment", "art", "unblock", "path", "career", "creative", "limerick"], url: "podcast/katieann-vogel-on-unblocking-yourself-finding-fulfillment-creating-art-with-kahr.html", dest: "katieann vogel" },
      { display: "to think about treating obsessions as art projects instead of identity loops", terms: ["identity", "obsession", "fixation", "art", "experiment", "project", "self", "morality", "consistency", "shame", "hypocris"], url: "podcast/katieann-vogel-on-unblocking-yourself-finding-fulfillment-creating-art-with-kahr.html", dest: "identity vs art" },
      { display: "to watch a hardtech investor deck get torn down live", terms: ["machphy", "investor", "deck", "pitch", "fundrais", "hardtech", "deeptech", "cooling", "thermal", "energy", "storage", "physics", "review", "slides", "feedback"], url: "podcast/machphy-cool-glide-to-funding.html", dest: "machphy" },
      { display: "to hear a founder talk about building a workplace sexual harassment platform", terms: ["meghana", "trustin", "sexual harassment", "posh", "workplace", "safety", "founder", "legal", "women", "tribe", "ritual", "justice"], url: "https://joyus.studio/podcast/meghana-srinivas-on-rituals-feeling-safe-and-finding-your-tribe.html", dest: "meghana srinivas" },
      { display: "to think about love, partnership and not making one person be everything", terms: ["love", "partner", "relationship", "bell hooks", "feminism", "marriage", "single", "dating", "ecosystem", "support", "tribe"], url: "https://joyus.studio/podcast/meghana-srinivas-on-rituals-feeling-safe-and-finding-your-tribe.html", dest: "love and partnership" },
      { display: "to hear cofounders talk about staying aligned through fights and acquisitions", terms: ["cofounder", "co-founder", "founder", "humanly", "prem", "andrew", "acquisition", "alignment", "decisions", "partner", "team", "merge", "scale"], url: "podcast/navigating-changing-dynamics-relationships-with-kahran-and-prem-andrew-co-founde.html", dest: "humanly cofounders" },
      { display: "to think about how a founder's role has to evolve as the company grows", terms: ["scale", "scaling", "0 to 1", "1 to 10", "series a", "role", "evolve", "step back", "growth", "hire", "delegate", "ceo", "function"], url: "podcast/navigating-changing-dynamics-relationships-with-kahran-and-prem-andrew-co-founde.html", dest: "founder role shift" },
      { display: "to hear a woman founder talk fundraising bias and building anyway", terms: ["preeti", "suri", "adventuretripr", "women", "female", "founders", "fundrais", "vc", "angel", "investor", "bias", "travel startup", "f-bomb", "brown girl angels"], url: "podcast/preeti-suri-tips-for-women-founders-and-balancing-health-work.html", dest: "women founders" },
      { display: "to hear a founder mom balance parenting, burnout and her startup", terms: ["parent", "kids", "son", "mom", "mother", "burnout", "health", "surgery", "shingles", "balance", "guilt", "family", "boundaries", "downtime", "discipline"], url: "podcast/preeti-suri-tips-for-women-founders-and-balancing-health-work.html", dest: "parenting + startup" },
      { display: "to hear a designer talk about becoming a creative coder", terms: ["computational mama", "creative coding", "p5", "design", "code", "developer", "career change", "museum", "exhibition", "moniker", "identity", "tinker"], url: "https://joyus.studio/podcast/revisiting-402-careers-creativity-with-computational-mama.html", dest: "computational mama" },
      { display: "to think about how the space you live in shapes what you actually do", terms: ["space", "home", "interior", "design", "behavior", "behaviour", "habit", "ambient", "experiential", "domestic", "house", "room", "aesthetic", "functional"], url: "podcast/revisiting-episode-16-thinking-on-designing-spaces-and-changing-your-mind.html", dest: "designing spaces" },
      { display: "to hear someone change their mind about a design problem live", terms: ["change", "mind", "reframe", "resistance", "heuristic", "framework", "perspective", "shift", "rethink", "open"], url: "podcast/revisiting-episode-16-thinking-on-designing-spaces-and-changing-your-mind.html", dest: "changing your mind" },
      { display: "to hear how llms actually change the way you think and work", terms: ["llm", "llms", "chatgpt", "gpt", "genai", "generative ai", "ai", "translation", "poetry", "creativity", "research", "language", "etymology", "tools", "thinking"], url: "podcast/revisiting-episode-29-thinking-on-llms-and-genai.html", dest: "llms + genai" },
      { display: "to hear an early take on how ai would commoditize skilled work", terms: ["ai", "future of work", "gpt", "dall-e", "stable diffusion", "labor", "commoditize", "automation", "illustrator", "copy", "mechanical turk", "wikipedia"], url: "https://joyus.studio/podcast/revisiting-episode-8-thinking-on-ai-the-future-of-work-and-the-commoditization-o.html", dest: "ai future of work" },
      { display: "to hear a founder talk about what success actually feels like after seven years", terms: ["lena", "chaihorsky", "alva10", "success", "satisfaction", "founder", "entrepreneur", "journey", "achievement", "joy", "growth", "fulfillment"], url: "podcast/satisfaction-with-success-with-kahran-alva10-s-co-founder-lena-chaihorsky.html", dest: "lena chaihorsky" },
      { display: "to think about being a working parent as a superpower", terms: ["parent", "parenting", "mother", "motherhood", "kids", "children", "work", "working", "balance", "family", "marriage", "wife", "husband"], url: "podcast/satisfaction-with-success-with-kahran-alva10-s-co-founder-lena-chaihorsky.html", dest: "working parent" },
      { display: "to think about writing as craft across games, comics and prose", terms: ["writing", "craft", "narrative", "story", "games", "comics", "manga", "communication", "expression", "fantasy", "mfa", "player", "second person", "art", "rereading"], url: "podcast/spilling-some-tea-on-writing-as-communication-and-art.html", dest: "writing" },
      { display: "to think about why the right work isn't reaching the right audience", terms: ["story", "telling", "audience", "reach", "authenticity", "distribution", "marketing", "instagram", "social", "niche", "community", "podcast"], url: "https://joyus.studio/podcast/story-vs-telling-part-1.html", dest: "story vs telling 1" },
      { display: "to think about the gap between having a story and telling it well", terms: ["story", "storytelling", "telling", "narrative", "audience", "communicat", "messaging", "brand", "voice", "marketing", "share", "express"], url: "podcast/story-vs-telling-part-2.html", dest: "story vs telling" },
      { display: "to hear an artist talk about a multidisciplinary practice that resists summary", terms: ["multidisciplinary", "practice", "artist", "facet", "compress", "identity", "vfx", "designer", "creator", "many things", "projection"], url: "podcast/story-vs-telling-part-2.html", dest: "multifaceted self" },
      { display: "to workshop introducing yourself when your work spans many disciplines", terms: ["story", "telling", "positioning", "introduction", "identity", "multi-disciplinary", "artist", "audience", "personal brand", "self-description", "narrative", "discovery", "residency", "workshop"], url: "podcast/story-vs-telling-part-3.html", dest: "story vs telling" },
      { display: "to learn how to introduce yourself with the why between the beats", terms: ["intro", "introduce", "elevator pitch", "story", "telling", "why", "career", "narrative", "self introduction", "meeting", "presentation"], url: "https://joyus.studio/podcast/story-vs-telling-part-4.html", dest: "story vs telling 4" },
      { display: "to think about quality years vs maximizing how long you live", terms: ["success", "longevity", "bryan johnson", "quality years", "lifespan", "authentic", "achieve", "achievement", "fulfillment", "meaning", "finite", "mortality"], url: "podcast/success-through-achieving-vs-authenticity-success-part-5.html", dest: "success part 5" },
      { display: "to hear stories about grandparents who built something lasting", terms: ["grandfather", "rehman", "itc", "hotels", "legacy", "family", "elder", "story", "memoir", "ancestor", "career"], url: "podcast/success-through-achieving-vs-authenticity-success-part-5.html", dest: "ssh rehman" },
      { display: "to question what success means and how the goalposts keep moving", terms: ["success", "confounded", "fulfilment", "agency", "growth", "culture", "gender", "ambition", "definitions", "goalposts", "freedom", "joy", "self-narrative", "career"], url: "podcast/the-confoundedness-of-success-part-1.html", dest: "success part 1" },
      { display: "to think about absurdism, emotion and why art doesn't have to make sense", terms: ["absurd", "absurdist", "art", "miyazaki", "1000xresist", "narrative", "consistency", "postmodern", "feeling", "emotion", "storytelling", "form"], url: "https://joyus.studio/podcast/thinking-on-absurdist-successes-and-1000xresist-success-part-7.html", dest: "absurdist art" },
      { display: "to question the defaults we never thought to question", terms: ["default", "assumption", "accepted", "truth", "given", "norm", "convention", "engineer", "attention", "responsibility", "market share", "question"], url: "podcast/thinking-on-accepted-truths-defaults-and-how-we-got-here.html", dest: "accepted truths" },
      { display: "to think about communicating identity vs checking boxes", terms: ["identity", "queer", "pride", "corporate", "communicate", "express", "category", "segmentation", "rainbow", "instrumental", "authentic"], url: "podcast/thinking-on-accepted-truths-defaults-and-how-we-got-here.html", dest: "communicate vs check" },
      { display: "to think about ai eating skilled white-collar work", terms: ["ai", "future of work", "commoditiz", "skilled labor", "dall-e", "gpt-3", "stable diffusion", "creative jobs", "automation", "voice synthesis", "mechanical turk", "uber", "copy", "entertainment"], url: "podcast/thinking-on-ai-the-future-of-work-and-the-commoditization-of-high-er-skilled-lab.html", dest: "ai and work" },
      { display: "to hear a child-prodigy writer rethink what success means in her 30s", terms: ["samhita", "arni", "writer", "author", "success", "identity", "bestseller", "novelist", "transcultural", "bangalore", "indian", "mythology"], url: "https://joyus.studio/podcast/thinking-on-being-successful-with-samhita-arni.html", dest: "samhita arni" },
      { display: "to think about depth journaling and a creative routine", terms: ["journal", "progoff", "morning pages", "artist's way", "depth psychology", "creative", "routine", "discipline", "practice"], url: "https://joyus.studio/podcast/thinking-on-being-successful-with-samhita-arni.html", dest: "depth journaling" },
      { display: "to think about how brands and people actually earn your trust", terms: ["trust", "loyalty", "brand", "customer", "relationship", "emotional", "practical", "earn", "build", "service", "hospitality", "care", "recovery"], url: "podcast/thinking-on-building-trust.html", dest: "building trust" },
      { display: "to hear a queer founder walk through four careers before underwear", terms: ["fran", "dunaway", "tomboyx", "career", "careers", "switch", "queer", "lesbian", "lgbtq", "film", "producer", "lobbying", "human rights campaign", "disability", "group home"], url: "podcast/thinking-on-careers-work-with-fran-dunaway.html", dest: "fran dunaway" },
      { display: "to think about why we care about some things and not others", terms: ["care", "invested", "identity", "loyalty", "brand", "habit", "self image", "resolution", "behavior change", "ocd", "ocpd"], url: "https://joyus.studio/podcast/thinking-on-caring-and-being-invested.html", dest: "caring and invested" },
      { display: "to hear a designer talk about becoming a creative coder", terms: ["coding", "code", "creative", "computational", "mama", "designer", "p5", "processing", "raspberry pi", "manasi", "tinker", "stem", "self-taught"], url: "podcast/thinking-on-coding-creativity-culture-with-computational-mama.html", dest: "computational mama" },
      { display: "to think about identity and giving yourself a new name to grow into", terms: ["identity", "moniker", "name", "persona", "alter ego", "secret identity", "transformation", "shift", "career", "rename"], url: "podcast/thinking-on-coding-creativity-culture-with-computational-mama.html", dest: "identity and name" },
      { display: "to build a better mental model for failure and how to learn from it", terms: ["failure", "cognitive", "emotional", "foolish", "fool", "self-awareness", "learning", "iteration", "maxima", "relationships", "growth", "belief", "mistakes", "models", "decision"], url: "podcast/thinking-on-cognitive-vs-emotional-experiences-models-for-failure.html", dest: "models for failure" },
      { display: "to think about why failure builds confidence and success doesn't", terms: ["confidence", "success", "failure", "achievement", "imposter", "anxiety", "recovery", "founder", "optimism bias", "pivot", "kahneman"], url: "https://joyus.studio/podcast/thinking-on-confidence-feelings-of-success-failure-and-achievement.html", dest: "confidence and failure" },
      { display: "to think about the difference between courage and daring", terms: ["courage", "courageous", "brave", "bravery", "daring", "dare", "risk", "bold", "rogue", "fear", "values", "virtue"], url: "podcast/thinking-on-courage-vs-daring.html", dest: "courage vs daring" },
      { display: "to get better at making decisions when you don't have certainty", terms: ["decision", "decisions", "uncertainty", "certainty", "choices", "branding", "future self", "tradeoff", "indecision", "framing", "finite", "infinite", "weights", "tribe"], url: "podcast/thinking-on-decision-making-when-you-lack-certainty.html", dest: "decision making" },
      { display: "to land on how to describe what you and your company actually do", terms: ["positioning", "describe", "what you do", "company", "team", "convergence", "frame", "narrative", "pitch", "imposter syndrome", "panel"], url: "https://joyus.studio/podcast/thinking-on-describing-what-you-do-and-how-you-do-it.html", dest: "describing what you do" },
      { display: "to think about how expectations design the experience that follows", terms: ["expectation", "expect", "design", "experience", "pre-experience", "quality", "spec", "perfectionism", "frame", "constraint", "ship", "release"], url: "podcast/thinking-on-designing-expectations.html", dest: "designing expectations" },
      { display: "to think about designing products and projects with an end date in mind", terms: ["ending", "endings", "lifespan", "sustainable", "design", "product", "goal", "finite", "indefinite", "stopping point", "marriage", "renewal", "service", "commitment"], url: "podcast/thinking-on-designing-for-the-end.html", dest: "designing for end" },
      { display: "to think about how the space you live in shapes what you do in it", terms: ["space", "design", "home", "interior", "behavior", "ritual", "experience", "aesthetic", "friction", "wabi", "live", "house"], url: "https://joyus.studio/podcast/thinking-on-designing-spaces-and-changing-your-mind.html", dest: "designing spaces" },
      { display: "to think about what values you can afford to live by", terms: ["ethics", "moral", "morals", "values", "afford", "scarcity", "abundance", "principle", "cost", "trade-off", "compromise", "integrity"], url: "podcast/thinking-on-ethics-and-affording-your-morals.html", dest: "affording morals" },
      { display: "to hear a founder leave academia and build a women's health startup", terms: ["aditi", "dimri", "cranberry", "academia", "phd", "economics", "policy", "startup", "founder", "women's health", "femtech", "india", "switch", "career"], url: "podcast/thinking-on-finding-your-path-making-a-startup-walking-away-from-academia-with-a.html", dest: "aditi dimri" },
      { display: "to think about how different learners shop and make creative decisions", terms: ["learner", "learn", "learning style", "memory", "visual", "verbal", "shop", "pinterest", "wishlist", "customer journey", "buying", "decision"], url: "https://joyus.studio/podcast/thinking-on-how-different-learners-solve-problems-buy-goods-and-go-on-their-cust.html", dest: "different learners" },
      { display: "to think about how using AI changes the way you think", terms: ["llm", "ai", "genai", "chatgpt", "gpt", "tool", "thinking", "knowledge", "research", "learn", "habit", "cognition", "creative"], url: "podcast/thinking-on-how-llms-genai-have-changed-our-thinking.html", dest: "ai changed thinking" },
      { display: "to think about kindness vs niceness and which one actually costs you", terms: ["kindness", "kind", "niceness", "nice", "politeness", "breakup", "firing", "euthanasia", "authenticity", "social capital", "honesty", "image", "minority", "hard conversation"], url: "podcast/thinking-on-kindness-vs-niceness.html", dest: "kindness vs niceness" },
      { display: "to think about how we learn and the way we do everything", terms: ["learn", "learning", "thought", "habit", "competence", "muscle memory", "buddhist", "energy", "mana", "system one", "change"], url: "https://joyus.studio/podcast/thinking-on-learning-to-change-our-thoughts.html", dest: "learning thoughts" },
      { display: "to think about leverage as a frame for money and relationships", terms: ["leverage", "lever", "debt", "equity", "finance", "asset", "capital", "social", "friend", "network", "money", "borrow", "valuation"], url: "podcast/thinking-on-leverage-what-it-means-and-how-you-do-it.html", dest: "leverage" },
      { display: "to understand what actually builds customer loyalty to a brand", terms: ["loyalty", "customer", "experience", "brand", "values", "nike", "bts", "fandom", "pricing", "reciprocity", "weld points", "consumer", "advocacy", "ladder"], url: "podcast/thinking-on-loyalty-customer-experiences.html", dest: "loyalty + cx" },
      { display: "to think through decision-making when sunk cost and inertia are loud", terms: ["decision", "decisions", "decide", "pivot", "sunk cost", "inertia", "reasoning", "deductive", "inductive", "choice", "tradeoff", "bezos"], url: "https://joyus.studio/podcast/thinking-on-making-better-decisions.html", dest: "better decisions" },
      { display: "to think about identity as something you put on rather than something you are", terms: ["identity", "self", "alter ego", "moniker", "persona", "shape shift", "role", "label", "gaze", "patriotism", "available"], url: "podcast/thinking-on-manasi-k-computational-mama.html", dest: "identity" },
      { display: "to question whether obedience and discipline have a place in your life", terms: ["obedience", "obedient", "discipline", "compliance", "authority", "agency", "disagree and commit", "amazon", "leadership", "schooling", "religion", "rules", "tribe", "team"], url: "podcast/thinking-on-obedience-and-discipline.html", dest: "obedience" },
      { display: "to think about pain and emotion as signals to read instead of fight", terms: ["pain", "emotion", "signal", "stress", "eustress", "distress", "brain", "pathway", "survival", "thriving", "trigger", "learning"], url: "https://joyus.studio/podcast/thinking-on-pain-emotional-signaling-learning-and-brain-pathways.html", dest: "pain as signal" },
      { display: "to hear a lawyer talk about inventing new selves on the road", terms: ["manasi", "khare", "identity", "traveling", "safety", "women", "stranger", "persona", "lawyer", "law", "stoicism", "philosophy", "non-reactive"], url: "podcast/thinking-on-patriotism-law-life-with-manasi-k.html", dest: "manasi k" },
      { display: "to think about what patriotism actually means today", terms: ["patriotism", "patriot", "country", "nation", "flag", "value", "civic", "india", "citizen", "duty", "love country"], url: "podcast/thinking-on-patriotism-law-life-with-manasi-k.html", dest: "patriotism reframed" },
      { display: "to think differently about saving, investing and managing risk in life", terms: ["finance", "money", "saving", "investing", "investment", "risk", "hedging", "stocks", "equities", "freelance", "worldview", "amazon", "fixed deposit", "personal finance"], url: "podcast/thinking-on-personal-finance-and-saving-vs-investing.html", dest: "personal finance" },
      { display: "to think about how listeners actually move through podcasts and media", terms: ["podcast", "listen", "audience", "media", "habit", "binge", "format", "continuity", "show", "consumption", "audio"], url: "https://joyus.studio/podcast/thinking-on-podcasts-how-we-listen.html", dest: "how we listen" },
      { display: "to think about how to make life work out for you", terms: ["serendipity", "luck", "manifest", "intention", "wish", "want", "outcome", "life", "work out", "psychology", "pattern", "action"], url: "podcast/thinking-on-serendipity-making-life-work-for-you.html", dest: "serendipity" },
      { display: "to think about how we signal belonging and read others' signals", terms: ["signaling", "signal", "in-group", "belonging", "identity", "alumni", "luxury", "opulence", "status", "queer", "bias", "first impressions", "code switching", "tribe"], url: "podcast/thinking-on-signaling-being-in-group.html", dest: "signaling" },
      { display: "to build a personal model for what your success is made of", terms: ["success", "model", "framework", "skills", "blocks", "ecosystem", "progress", "checkpoint", "creative", "preproduction", "construct"], url: "https://joyus.studio/podcast/thinking-on-success-models-for-building-success.html", dest: "success models" },
      { display: "to think about changing careers without it becoming an identity crisis", terms: ["career", "change", "shift", "pivot", "identity", "label", "expertise", "fran", "aditi", "founder", "researcher", "transition"], url: "podcast/thinking-on-the-careers-identity-of-fran-dunaway-and-aditi-dimri.html", dest: "career and identity" },
      { display: "to think about the creative process and when to shift your form", terms: ["creative", "creativity", "process", "writing", "format", "medium", "art", "play", "boredom", "novelty", "consistency", "audience", "poetry", "craft"], url: "podcast/thinking-on-the-creative-process.html", dest: "creative process" },
      { display: "to learn how to read and tighten a real acquisition deck", terms: ["acquisition", "deck", "pitch", "smiqql", "dina", "investor", "exit", "story", "fundraising", "presentation", "slide", "diligence"], url: "https://joyus.studio/podcast/thinking-on-the-smiqql-acquisition-deck.html", dest: "smiqql deck" },
      { display: "to think about whether remote work is fair when not everyone can do it", terms: ["covid", "remote", "wfh", "work from home", "distributed", "office", "hybrid", "fair", "ethics", "flexible", "timezone", "deep work"], url: "podcast/thinking-on-work-after-covid-19.html", dest: "work after covid" },
      { display: "to figure out how to actually work in partnership with generative ai", terms: ["genai", "generative ai", "ai", "gpt", "stable diffusion", "mid-journey", "marketing copy", "appraisal", "drug discovery", "tools", "partnership", "collaborator", "automation", "workflow"], url: "podcast/thinking-on-working-in-partnership-with-generative-ai-genai.html", dest: "genai partnership" },
      { display: "to draw a line between trust and confidence in yourself and others", terms: ["trust", "confidence", "self trust", "team", "client", "user", "mental", "fortitude", "practice", "doubt", "skill"], url: "https://joyus.studio/podcast/trust-vs-confidence-in-yourself-your-skills-your-environment.html", dest: "trust vs confidence" },
      { display: "to think about whether success is a moving goalpost or a state of mind", terms: ["success", "purpose", "achievement", "goalpost", "meaning", "fulfillment", "father", "pradeep", "satisfaction", "complete", "enough"], url: "podcast/unraveling-purpose-success-part-4.html", dest: "purpose part 4" },
      { display: "to think about whether being unique is its own kind of conformity", terms: ["unique", "uniqueness", "conformity", "nonconformist", "queer", "artist", "culture", "ambition", "religion", "community", "weirdness", "individuality", "fitting in", "standing out"], url: "podcast/when-its-conforming-to-be-unique.html", dest: "uniqueness" },

      // Comics
      { display: "to read a comic about friendship", terms: ["friend", "friendship", "comic", "connection", "close", "mr curl"], url: "comics/the-friend-comic.html", dest: "The Friend" },
      { display: "to understand why people gossip", terms: ["gossip", "gossipping", "talk about people", "why we gossip", "unhappiness"], url: "comics/gossip.html", dest: "Gossip" },
      { display: "to read a comic about a dying plant", terms: ["plant", "plants", "gardening", "grief", "loss", "death", "keeping alive", "best friend", "care", "mr curl"], url: "comics/plant-comic.html", dest: "the Plant Comic" },
      { display: "to read a comic about phone addiction", terms: ["phone", "smartphone", "screen", "screen time", "addiction", "doomscroll", "doomscrolling", "attention", "digital", "escape", "social media"], url: "comics/phone-comic.html", dest: "the Phone Comic" },
      { display: "to read the doing serious things unseriously zine", terms: ["zine", "serious", "unserious", "unseriously", "serious play", "play", "playful", "whimsy", "doing serious things"], url: "comics/serious-zine.html", dest: "the unserious zine" },
      { display: "to read your comics", terms: ["comics", "all comics", "illustration"], url: "comics/index.html", dest: "comics" },

      // (Themed hub pages removed from search — old editorial-wing design, not linked.)

      // Contact / portfolio entry points
      { display: "to talk to someone", terms: ["talk", "chat", "call", "consultation", "consult", "advice", "discuss", "connect", "reach out", "contact", "email", "hello", "hi", "say hi"], url: "say-hi.html", dest: "say hi" },
      { display: "to see examples of your work", terms: ["work", "example", "portfolio", "case stud", "projects", "clients", "past work", "show me"], url: "work/index.html", dest: "all work" },
      { display: "to build something new", terms: ["build", "create", "make", "new project", "start", "idea", "something new", "dream"], url: "services.html", dest: "services" },
      { display: "to understand my audience", terms: ["audience", "customer", "user", "persona", "segment", "target", "market research", "understand"], url: "services.html", dest: "services" }
    ];

    // Default 5 shown when input is empty / on focus with no query.
    const DEFAULT_DISPLAYS = [
      "help with a pitch deck",
      "to launch a product from zero",
      "a brand that feels like me",
      "to just think with someone",
      "a conversation worth listening to"
    ];

    function defaultEntries() {
      return DEFAULT_DISPLAYS
        .map(function(d) { return CONTENT_MAP.find(function(e) { return e.display === d; }); })
        .filter(Boolean);
    }

    // Core scorer: every CONTENT_MAP entry with its fuzzy score, sorted desc.
    // scoreHits (live match, score >= 2) and scoreNearMisses (the looking.html
    // stitch, 0 < score < 2) both derive from this so the scoring logic stays
    // single-source.
    function scoreEntries(query) {
      var q = (query || '').toLowerCase().trim();
      if (!q) return [];
      // length > 2 (≥3 chars): "in", "to", "of", "at", "on" are noise — they substring-match
      // hundreds of unrelated terms (uncertainty, branding, finite, etc.) and bury the
      // legit hits. Useful short queries like "ai" still match via the full-query
      // term-substring path below, which is more discriminating.
      var words = q.split(/\s+/).filter(function(w) { return w.length > 2; });

      var scored = CONTENT_MAP.map(function(entry, idx) {
        var score = 0;
        entry.terms.forEach(function(term) {
          var t = term.toLowerCase();  // terms are authored lowercase; normalize defensively so a mixed-case term can't silently miss
          if (q.indexOf(t) !== -1) {
            score += 3;
          } else if (t.indexOf(' ') === -1) {
            // Word-in-term partial credit only for single-word terms.
            // Skipping multi-word terms ("ai workshop", "chatgpt workshop") prevents
            // a short word like "work" from substring-matching three of them at once
            // and inflating an unrelated entry past the true hit.
            words.forEach(function(word) {
              if (t.indexOf(word) !== -1) score += 1;
            });
          }
        });
        if (entry.display.toLowerCase().indexOf(q) !== -1) {
          score += 2;
        } else {
          words.forEach(function(word) {
            if (entry.display.toLowerCase().indexOf(word) !== -1) score += 0.5;
          });
        }
        return { entry: entry, score: score, idx: idx };
      });

      // Sort by score desc; break ties by CONTENT_MAP order so the ranking is
      // stable/reproducible rather than depending on Array.sort tie behavior.
      scored.sort(function(a, b) { return (b.score - a.score) || (a.idx - b.idx); });
      return scored;
    }

    // Returns the real scored hits (score >= 2, top 5), or [] when nothing
    // clears the threshold. Kept separate from fuzzyMatch so the submit
    // handler can tell a genuine match from the no-match fallback.
    function scoreHits(query) {
      return scoreEntries(query)
        .filter(function(s) { return s.score >= 2; })
        .slice(0, 5)
        .map(function(s) { return s.entry; });
    }

    // ── Looser "second pass" for the looking.html near-miss stitch ──
    // The strict scorer above deep-links any confident hit. When a query is
    // only weakly related (or unrelated), we route to looking.html and hand it
    // a few "things you might be into" cards instead of force-navigating to one
    // shaky match. Those cards come from (a) the strict cluster that partially
    // matched, topped up by (b) a more lenient token-overlap pass weighted by
    // IDF — so rare, specific words ("fashion", "tax", "remote") carry signal
    // and common ones ("brand", "work", "team") don't drown it out. A query
    // with no real overlap surfaces nothing and the page falls back to pills.
    var NM_STOP = {};
    ('help want need like make made get got some someone something thing things please ' +
     'just really about with for the and that this your you our can how what why who idea ' +
     'ideas from into more have').split(' ').forEach(function(w){ NM_STOP[w] = 1; });

    function nmStem(w) { return w.replace(/ies$/, 'y').replace(/(es|s)$/, ''); }
    function nmTokens(str) {
      var seen = {}, out = [];
      String(str || '').toLowerCase().split(/[^a-z0-9]+/).forEach(function(w) {
        if (w.length < 3 || NM_STOP[w]) return;
        var s = nmStem(w);
        if (!seen[s]) { seen[s] = 1; out.push(s); }
      });
      return out;
    }

    // Precompute each entry's token bag + document frequencies once at load.
    var NM_BAGS = CONTENT_MAP.map(function(e) {
      var bag = {};
      e.terms.forEach(function(t) { nmTokens(t).forEach(function(w) { bag[w] = 1; }); });
      nmTokens(e.display).forEach(function(w) { bag[w] = 1; });
      if (e.dest) nmTokens(e.dest).forEach(function(w) { bag[w] = 1; });
      return bag;
    });
    var NM_DF = {};
    NM_BAGS.forEach(function(bag) {
      Object.keys(bag).forEach(function(t) { NM_DF[t] = (NM_DF[t] || 0) + 1; });
    });
    function nmIdf(t) { return Math.log(CONTENT_MAP.length / ((NM_DF[t] || 0) + 0.5)); }

    // Lenient pass: sum IDF of the query tokens that appear in each entry's
    // bag. Threshold >= 2 keeps it to roughly one rare-word hit or stronger,
    // which is what keeps the recommendations relevant rather than scattershot.
    function looseEntries(query) {
      var qt = nmTokens(query);
      if (!qt.length) return [];
      return CONTENT_MAP
        .map(function(entry, idx) {
          var bag = NM_BAGS[idx], s = 0;
          qt.forEach(function(t) { if (bag[t]) s += nmIdf(t); });
          return { entry: entry, score: s };
        })
        .sort(function(a, b) { return b.score - a.score; })
        .filter(function(s) { return s.score >= 2; })
        .map(function(s) { return s.entry; });
    }

    // Confidence bar: a query scoring this high deep-links straight to its top
    // hit. Below it we show the looking.html stitch rather than auto-routing to
    // a single weak match. (The live autocomplete dropdown still surfaces
    // everything >= 2 — this only governs what pressing Enter does.)
    var CONFIDENT_MATCH = 4;

    // Core navigational pages — a strong match to one of these deep-links
    // straight there; every other (content) match routes to the looking.html
    // top-3 results page instead. See the submit handler below.
    var NAV_URLS = {
      'index.html': 1, 'work/index.html': 1, 'services.html': 1, 'workshops.html': 1,
      'podcast.html': 1, 'about.html': 1, 'say-hi.html': 1, 'comics/index.html': 1,
      'ai-workshops.html': 1
    };

    // Exact navigational keywords → straight to that page. The content scorer
    // can let an episode/case-study outrank the umbrella page (many rows carry
    // "podcast"/"work" in their terms), so these clear intents are handled first.
    var NAV_KEYWORDS = {
      'podcast': 'podcast.html', 'podcasts': 'podcast.html', 'the podcast': 'podcast.html',
      'work': 'work/index.html', 'your work': 'work/index.html', 'portfolio': 'work/index.html',
      'case studies': 'work/index.html', 'case study': 'work/index.html', 'projects': 'work/index.html',
      'about': 'about.html', 'about us': 'about.html', 'who are you': 'about.html',
      'services': 'services.html', 'service': 'services.html',
      'workshop': 'workshops.html', 'workshops': 'workshops.html',
      'say hi': 'say-hi.html', 'contact': 'say-hi.html', 'hello': 'say-hi.html', 'get in touch': 'say-hi.html',
      'comics': 'comics/index.html', 'comic': 'comics/index.html'
    };

    // Build the near-miss cards: the strict >= 2 cluster first (the things that
    // partially matched), topped up by the looser pass when that cluster is
    // thin. De-duped so the same destination doesn't repeat — case studies all
    // route to coming-soon.html so we key those by dest (TomboyX, Klydo, …);
    // everything else keys by url so multiple intent-angles on one podcast
    // episode collapse to a single card.
    function nearMisses(query, scored) {
      var near = scored
        .filter(function(s) { return s.score >= 2; })
        .map(function(s) { return s.entry; });
      if (near.length < 3) { near = near.concat(looseEntries(query)); }
      var seen = {}, out = [];
      near.forEach(function(e) {
        var key = e.url === 'coming-soon.html' ? ('cs:' + e.dest) : e.url;
        if (seen[key]) return;
        seen[key] = 1;
        out.push(e);
      });
      return out.slice(0, 6);
    }

    function fuzzyMatch(query) {
      var q = (query || '').toLowerCase().trim();
      if (!q) return defaultEntries();
      var hits = scoreHits(q);
      if (hits.length) return hits;
      // No confident hits — surface the same near-misses the looking.html page
      // would show, not a generic "say hi". Returns [] when nothing's close, and
      // renderSuggestions hides the dropdown in that case.
      return nearMisses(q, scoreEntries(q));
    }

  // ── Wire the autocomplete + routing to the DOM. ──
  function initIntentBox(opts) {
    opts = opts || {};
    var page = opts.page || 'index';
    var input = document.getElementById('intentInput');
    var sug = document.getElementById('intentSuggestions');
    if (!input || !sug) return;

    function renderSuggestions(query) {
      var entries = fuzzyMatch(query);
      sug.innerHTML = '';
      entries.forEach(function(entry) {
        var a = document.createElement('a');
        a.className = 'sug';
        a.href = entry.url;
        var t = document.createElement('span');
        t.className = 'sug-text';
        t.textContent = entry.display;
        var d = document.createElement('span');
        d.className = 'sug-dest';
        d.textContent = '→ ' + entry.dest;
        a.appendChild(t);
        a.appendChild(d);
        sug.appendChild(a);
      });
      return entries.length;
    }

    // Show the dropdown only when there's something to show — a query with no
    // hits and no near-misses leaves it hidden rather than an empty box.
    function showSuggestions() {
      var n = renderSuggestions(input.value);
      sug.classList.toggle('visible', n > 0);
    }

    // Initial render so the dropdown has content the first time it opens.
    renderSuggestions('');

    input.addEventListener('focus', showSuggestions);
    input.addEventListener('input', showSuggestions);
    input.addEventListener('blur', function() {
      setTimeout(function() { sug.classList.remove('visible'); }, 160);
    });

    // ── Submit (Enter / arrow button) ──
    // A confident match (top score >= CONFIDENT_MATCH) goes straight to that
    // page. Anything weaker lands on looking.html carrying the query plus its
    // near-misses, so the page can stitch together "things you might be into"
    // instead of dead-ending or force-routing to one shaky match.
    var intentForm = document.querySelector('.hero-fill');
    if (intentForm) {
      intentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = input.value.trim();
        if (!q) { input.focus(); return; }
        // 1) Exact navigational keyword → straight to the page.
        var navDirect = NAV_KEYWORDS[q.toLowerCase()];
        if (navDirect) { logIntent(q, true, page); window.location.href = navDirect; return; }
        var scored = scoreEntries(q);
        var top = scored.length ? scored[0].score : 0;
        var topEntry = scored.length ? scored[0].entry : null;
        // Smart hybrid: a strong match to a CORE NAVIGATIONAL page deep-links
        // straight there ("podcast", "about", "say hi", "work"…). Everything
        // content-y (case studies, episodes, themes) lands on the looking.html
        // results page with the top 3 "we think these might be interesting"
        // cards — so we never force-route a vague content search to one page.
        var navHit = topEntry && top >= CONFIDENT_MATCH && NAV_URLS[topEntry.url];
        logIntent(q, !!navHit, page);
        if (navHit) {
          window.location.href = topEntry.url;
          return;
        }
        var near = nearMisses(q, scored).slice(0, 3).map(function(en) {
          return { d: en.display, u: en.url, t: en.dest };
        });
        var dest = 'looking.html?q=' + encodeURIComponent(q);
        if (near.length) {
          dest += '&n=' + encodeURIComponent(JSON.stringify(near));
        }
        window.location.href = dest;
      });
    }

    // ── Typewriter placeholder (homepage only — pass opts.prompts). ──
    // Cycles prompts char-by-char; pauses while the user is interacting.
    var prompts = opts.prompts;
    if (!prompts || !prompts.length) {
      if (opts.placeholder) input.placeholder = opts.placeholder;
      return;
    }
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { input.placeholder = prompts[0]; return; }

    var TYPE_MS = 65, DELETE_MS = 28, HOLD_MS = 1800, GAP_MS = 350;
    var pIdx = 0, cIdx = 0, typing = true;
    function tick() {
      if (document.activeElement === input || input.value) { setTimeout(tick, 600); return; }
      var word = prompts[pIdx];
      if (typing) {
        cIdx++;
        input.placeholder = word.slice(0, cIdx) + (cIdx < word.length ? '|' : '');
        if (cIdx >= word.length) { input.placeholder = word; typing = false; setTimeout(tick, HOLD_MS); return; }
        setTimeout(tick, TYPE_MS);
      } else {
        cIdx--;
        input.placeholder = word.slice(0, cIdx) + (cIdx > 0 ? '|' : '');
        if (cIdx <= 0) { input.placeholder = ''; typing = true; pIdx = (pIdx + 1) % prompts.length; setTimeout(tick, GAP_MS); return; }
        setTimeout(tick, DELETE_MS);
      }
    }
    setTimeout(tick, 400);
  }

  global.initIntentBox = initIntentBox;
})(window);
