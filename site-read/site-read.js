/* ═══════════════════════════════════════════════════════════════════
   site-read.js — /site-read/

   States: idle → analyzing → read | decline | not-switched-on

   THE READER IS REAL OR IT IS OFF. There is no middle setting.
   API_BASE is the deployed Cloudflare Worker (site-read-worker/). While
   it is null, a typed URL gets the honest "not switched on yet" state —
   never a fixture, never a simulated read. The sample read is reachable
   only through an explicit ?demo= parameter.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Set this to the deployed worker origin to switch the reader on, e.g.
     'https://joyus-site-read.joyus.workers.dev'. Deploy steps live in
     /site-read-worker/worker/README.md. */
  var API_BASE = null;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.getElementById('app');
  var srStatus = document.getElementById('srStatus');

  /* The sample read. window.JOYUS_SITE_READ_FIXTURE is a plain JS object
     GENERATED from site-read/fixture.json by scripts/gen-site-read-fixture.mjs
     — a file:// page cannot fetch() a sibling JSON, and the demo has to work
     from a bare checkout. Edit fixture.json, then re-run the generator. */
  var FIXTURE = window.JOYUS_SITE_READ_FIXTURE || null;

  var PERCEPTION_NOTES = [
    'reading the front screen',
    'following the links a stranger would click',
    'looking for where the credentials live',
    'checking footers, feeds, image blocks',
    'weighing what’s dated and what isn’t',
    'writing the read'
  ];

  var IDLE_PROMPTS = [
    'yourstudio.com', 'yourname.nyc', 'your-practice.co', 'yourgallery.art', 'yourpractice.studio'
  ];

  var LANE_LABELS = {
    spine_story: 'the spine / story',
    website_sequencing: 'the website',
    credibility_surface: 'the credibility surface',
    short_form_social: 'short-form / social',
    long_form_writing: 'long-form / writing',
    publishing_rhythm: 'publishing rhythm'
  };

  /* Decline copy for the demo states. A real decline always renders the
     worker's own words (read.decline) — these exist so the four decline
     shapes can be previewed before the worker is live. */
  var DECLINE_DEMOS = {
    decline_product_company: {
      observation: 'This reads like a product — a roadmap, a pricing table, a team behind it.',
      redirect: 'Built for practitioners, artists and small studios. For a product, come talk to us.'
    },
    decline_thin: {
      observation: 'A link stack is not enough to meet you by.',
      redirect: 'Build one real page: name, work, one way to reach you.'
    },
    decline_unfetchable: {
      observation: 'This one did not come through.',
      redirect: 'Try the address again in a minute.'
    },
    decline_incomplete: {
      observation: 'Your pages were read; the write-up did not clear our accuracy checks.',
      redirect: 'Nothing on your end. Try again in a few minutes.'
    }
  };

  var DECLINE_HEADINGS = {
    decline_product_company: 'a quick honest note',
    decline_thin: 'a quick honest note',
    decline_unfetchable: 'a quick honest note',
    decline_incomplete: 'we couldn’t finish your read'
  };

  var state = { typedUrl: '', typedEmail: '', demo: null };

  // ────────────────────────────────────────────────────────────────
  // boot
  // ────────────────────────────────────────────────────────────────
  function boot() {
    var params = new URLSearchParams(window.location.search);
    var demo = params.has('demo') ? (params.get('demo') || 'menu') : null;
    state.demo = demo;

    if (demo === '1' || demo === 'read') {
      if (FIXTURE) { renderRead(FIXTURE, FIXTURE.site_url, true); return; }
      renderIdle();
      return;
    }
    if (demo === 'analyzing') {
      state.typedUrl = FIXTURE ? FIXTURE.site_url : 'yourstudio.com';
      renderAnalyzing(state.typedUrl, null);
      return;
    }
    if (demo === 'offline') { renderNotSwitchedOn(); return; }
    if (demo && DECLINE_DEMOS[demo]) { renderDecline(demo, DECLINE_DEMOS[demo]); return; }

    // A shared permalink: /site-read/?r=<slug> → GET /read/:slug on the worker.
    var slug = params.get('r');
    if (slug) { openPermalink(slug); return; }

    renderIdle();
  }

  function openPermalink(slug) {
    if (!API_BASE) { renderNotSwitchedOn(); return; }
    announce('Opening a saved read.');
    fetch(API_BASE.replace(/\/$/, '') + '/read/' + encodeURIComponent(slug))
      .then(function (res) { return res.json().then(function (body) { return { res: res, body: body }; }); })
      .then(function (out) {
        if (!out.res.ok || !out.body || !out.body.read) {
          renderDecline('decline_unfetchable', {
            observation: 'That link no longer points at a read.',
            redirect: 'Run the address again.'
          });
          return;
        }
        handleResponse(out.res, out.body, out.body.site_url || '');
      })
      .catch(function () {
        renderDecline('decline_unfetchable', {
          observation: 'That saved read did not come back.',
          redirect: 'Try the link again in a minute.'
        });
      });
  }

  // ────────────────────────────────────────────────────────────────
  // IDLE
  // ────────────────────────────────────────────────────────────────
  function renderIdle() {
    root.innerHTML = '' +
      '<section class="hero">' +
        '<span class="dot dh1 d-pink"></span>' +
        '<span class="dot dh2 d-yellow"></span>' +
        '<span class="dot dh3 d-cyan"></span>' +
        '<span class="dot dh4 d-cyan"></span>' +
        '<span class="dot dh5 d-yellow"></span>' +
        '<div class="hero-inner">' +
          '<p class="hero-eyebrow">for people &amp; small studios</p>' +
          '<h1 class="hero-h1">What does your site do when you’re <em>not</em> in the room?</h1>' +
          '<div class="hero-stage">' +
            '<label class="hero-lede" for="urlInput">Drop your URL.</label>' +
            '<form class="hero-fill" id="readForm" autocomplete="off">' +
              '<span class="hero-field" id="urlField">' +
                '<input id="urlInput" type="text" inputmode="url" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Your website URL" />' +
                '<span class="hero-caret" aria-hidden="true"><i></i></span>' +
                '<span class="hero-fauxph" id="urlFaux" aria-hidden="true"></span>' +
              '</span>' +
              '<button class="submit" type="submit" id="submitBtn">read it →</button>' +
            '</form>' +
            '<div class="hero-second">' +
              '<label for="emailInput">Send the read to</label>' +
              '<input id="emailInput" type="email" autocomplete="email" placeholder="you@yourdomain.com" />' +
              '<span class="optional">optional</span>' +
            '</div>' +
            '<p class="hero-error" id="heroError"></p>' +
            '<div class="hero-isnt">' +
              '<span class="hero-isnt-label">what this isn’t</span>' +
              '<ul>' +
                '<li><b>Not a grade.</b></li>' +
                '<li><b>Not generic advice.</b></li>' +
                '<li><b>Not for product companies.</b></li>' +
                '<li><b>Not instant</b> — about a minute.</li>' +
              '</ul>' +
            '</div>' +
            demoPillsHtml() +
          '</div>' +
        '</div>' +
      '</section>';

    var input = document.getElementById('urlInput');
    var field = document.getElementById('urlField');
    var faux = document.getElementById('urlFaux');
    var form = document.getElementById('readForm');
    var errorEl = document.getElementById('heroError');

    if (state.typedUrl) input.value = state.typedUrl;

    function sync() {
      field.classList.toggle('active', document.activeElement === input);
      field.classList.toggle('filled', input.value.length > 0);
    }
    input.addEventListener('focus', sync);
    input.addEventListener('blur', sync);
    input.addEventListener('input', sync);
    sync();

    var i = 0;
    var fauxTimer = null;
    faux.textContent = IDLE_PROMPTS[0];
    if (!reduce) {
      fauxTimer = setInterval(function () {
        if (document.activeElement === input || input.value) return;
        faux.classList.add('swap');
        setTimeout(function () {
          i = (i + 1) % IDLE_PROMPTS.length;
          faux.textContent = IDLE_PROMPTS[i];
          faux.classList.remove('swap');
        }, 340);
      }, 2600);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = input.value.trim();
      if (!val) {
        errorEl.textContent = 'A URL first — yourname.com is enough.';
        errorEl.classList.add('show');
        input.focus();
        return;
      }
      var email = document.getElementById('emailInput').value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = 'That email looks off.';
        errorEl.classList.add('show');
        document.getElementById('emailInput').focus();
        return;
      }
      errorEl.classList.remove('show');
      if (fauxTimer) clearInterval(fauxTimer);
      state.typedUrl = val.replace(/^https?:\/\//, '');
      state.typedEmail = email;
      submit(state.typedUrl, state.typedEmail);
    });
  }

  function demoPillsHtml() {
    // A real conditional: with no demo parameter these nodes never exist.
    if (!state.demo) return '';
    return '' +
      '<div class="demo-pills">' +
        '<span class="demo-pills-label">preview states</span>' +
        '<a href="?demo=1">the read</a>' +
        '<a href="?demo=analyzing">reading…</a>' +
        '<a href="?demo=decline_product_company">product company</a>' +
        '<a href="?demo=decline_thin">thin site</a>' +
        '<a href="?demo=decline_unfetchable">unfetchable</a>' +
        '<a href="?demo=decline_incomplete">couldn’t finish</a>' +
        '<a href="?demo=offline">reader off</a>' +
        '<a href="./">idle</a>' +
      '</div>';
  }

  // ────────────────────────────────────────────────────────────────
  // SUBMIT — the only path a typed URL can take
  // ────────────────────────────────────────────────────────────────
  function submit(url, email) {
    if (!API_BASE) { renderNotSwitchedOn(); return; }

    var pending = fetch(API_BASE.replace(/\/$/, '') + '/read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: url, email: email || undefined })
    }).then(function (res) {
      return res.json().then(function (body) { return { res: res, body: body }; });
    });

    renderAnalyzing(url, pending);
  }

  // ────────────────────────────────────────────────────────────────
  // ANALYZING
  // ────────────────────────────────────────────────────────────────
  function renderAnalyzing(url, pending) {
    announce('Reading ' + url + '. About a minute.');
    root.innerHTML = '' +
      '<section class="analyzing">' +
        '<p class="analyzing-target">reading <b>' + escapeHtml(url) + '</b>…</p>' +
        '<div class="analyzing-bar"><div class="analyzing-bar-fill" id="abarFill"></div></div>' +
        '<div class="analyzing-list" id="pnoteList"></div>' +
        '<p class="analyzing-promise"><strong>We’ll email it when it’s done.</strong> About a minute.</p>' +
      '</section>';

    var list = document.getElementById('pnoteList');
    var bar = document.getElementById('abarFill');
    var els = PERCEPTION_NOTES.map(function (text) {
      var el = document.createElement('div');
      el.className = 'pnote';
      el.innerHTML = '<span class="mk"></span><span class="tx">' + escapeHtml(text) + '</span>';
      list.appendChild(el);
      return el;
    });

    var settled = false;
    var idx = 0;
    var STEP = 7000; // the notes pace the real read, not a fake countdown

    function advance() {
      if (settled) return;
      if (idx > 0) { els[idx - 1].classList.remove('active'); els[idx - 1].classList.add('done'); }
      if (idx < els.length) {
        els[idx].classList.add('show', 'active');
        // Never reaches 100% on its own — only a real answer finishes the bar.
        bar.style.width = Math.min(92, Math.round(((idx + 1) / els.length) * 92)) + '%';
        idx++;
        setTimeout(advance, STEP);
      }
    }
    if (reduce) {
      els.forEach(function (el) { el.classList.add('show'); });
      bar.style.width = '92%';
    } else {
      setTimeout(advance, 300);
    }

    if (!pending) return; // ?demo=analyzing — the state, held open

    pending.then(function (out) {
      settled = true;
      els.forEach(function (el) { el.classList.add('show', 'done'); el.classList.remove('active'); });
      bar.style.width = '100%';
      setTimeout(function () { handleResponse(out.res, out.body, url); }, 450);
    }).catch(function () {
      settled = true;
      renderDecline('decline_unfetchable', {
        observation: 'The read did not come back. Our fault.',
        redirect: 'Try the same address in a minute.'
      });
    });
  }

  function handleResponse(res, body, url) {
    if (res.status === 429) {
      renderDecline('decline_incomplete', {
        observation: 'One person gets a few reads an hour.',
        redirect: 'Come back in an hour.'
      });
      return;
    }
    if (!res.ok || !body || !body.read) {
      renderDecline('decline_incomplete', {
        observation: 'The read did not come back whole.',
        redirect: 'Nothing on your end. Try again in a few minutes.'
      });
      return;
    }

    var read = body.read;
    var displayUrl = (read.site_url || body.site_url || url).replace(/^https?:\/\//, '');

    if (read.status === 'read') {
      renderRead(read, displayUrl, false, body.slug);
      return;
    }
    // Every other status is a decline, including the pipeline-only
    // decline_incomplete that repairLoop.js emits as its fail-safe.
    var copy = read.decline || DECLINE_DEMOS[read.status] || DECLINE_DEMOS.decline_incomplete;
    renderDecline(read.status, copy);
  }

  // ────────────────────────────────────────────────────────────────
  // NOT SWITCHED ON — the honest state while no worker is deployed
  // ────────────────────────────────────────────────────────────────
  function renderNotSwitchedOn() {
    announce('The reader is not switched on yet.');
    root.innerHTML = '' +
      '<div class="decline-wrap">' +
        '<span class="decline-kicker">not yet</span>' +
        '<p class="decline-observation">The reader isn’t switched on yet.</p>' +
        '<p class="decline-redirect">Built, not plugged in. We would rather say that than hand you a read that isn’t one.</p>' +
        '<a class="decline-back" href="./" data-nav-home>← back</a>' +
      '</div>' +
      (state.demo ? demoPillsWrapped() : '');
    wireBack();
  }

  // ────────────────────────────────────────────────────────────────
  // DECLINE
  // ────────────────────────────────────────────────────────────────
  function renderDecline(status, fx) {
    announce(DECLINE_HEADINGS[status] || 'a quick honest note');
    root.innerHTML = '' +
      '<div class="decline-wrap">' +
        '<span class="decline-kicker">' + escapeHtml(DECLINE_HEADINGS[status] || 'a quick honest note') + '</span>' +
        '<p class="decline-observation">' + escapeHtml(fx.observation) + '</p>' +
        '<p class="decline-redirect">' + escapeHtml(fx.redirect) + '</p>' +
        '<a class="decline-back" href="./" data-nav-home>← try another url</a>' +
      '</div>' +
      (state.demo ? demoPillsWrapped() : '');
    wireBack();
  }

  function demoPillsWrapped() {
    return '<div class="read-wrap" style="padding-top:0">' + demoPillsHtml() + '</div>';
  }

  function wireBack() {
    var back = document.querySelector('[data-nav-home]');
    if (!back) return;
    back.addEventListener('click', function (e) {
      e.preventDefault();
      state.typedUrl = '';
      renderIdle();
    });
  }

  // ────────────────────────────────────────────────────────────────
  // THE READ
  // ────────────────────────────────────────────────────────────────
  function renderRead(fx, displayUrl, isSample, slug) {
    announce('Your read is ready.');
    var html = '';
    html += '<div class="read-wrap">';
    html += '<div class="read-target"><span class="rd-dot"></span>the read for <b>' + escapeHtml(displayUrl) + '</b></div>';

    // The opening renders whole, immediately. Nothing types but the cut.
    html += '<p class="rd-opening">' + escapeHtml(fx.opening ? fx.opening.text : '') + '</p>';

    var skim = fx.skim_read || {};
    var skimItems = [skim.positioning_legibility, skim.tangibles, skim.entry_point, skim.delivered_vs_handheld].filter(Boolean);
    if (skimItems.length) {
      html += '<div class="rd-block rd-skim" id="rdSkim">';
      skimItems.forEach(function (item) {
        html += '<div class="rd-skim-item"><p>' + escapeHtml(item.observation) + '</p>' + exhibitLine(item.exhibit) + '</div>';
      });
      html += '</div>';
    }

    if (fx.gap) {
      html += '<div class="rd-block rd-gap" id="rdGap"><div class="rd-gap-grid">' +
        '<div class="rd-gap-col have"><span class="rd-gap-col-label">you have —</span><p>' + escapeHtml(fx.gap.what_you_have) + '</p></div>' +
        '<div class="rd-gap-col get"><span class="rd-gap-col-label">a stranger gets —</span><p>' + escapeHtml(fx.gap.what_a_stranger_gets) + '</p></div>' +
        '</div>';
      if (fx.gap.named_facts && fx.gap.named_facts.length) {
        html += '<div class="rd-facts"><span class="rd-facts-label">named, not invented</span>';
        fx.gap.named_facts.forEach(function (f) {
          html += '<div class="rd-fact"><b>' + escapeHtml(f.fact) + '</b> — ' + escapeHtml(f.page) +
            '<span class="rd-fact-src">“' + escapeHtml(f.source_sentence) + '”</span></div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

    html += '<div class="rd-block rd-lanes" id="rdLanes">';
    (fx.lane_verdicts || []).forEach(function (lv) {
      html += '<div class="rd-lane" data-verdict="' + escapeHtml(lv.verdict) + '">' +
        '<div class="rd-lane-head"><span class="rd-lane-name">' + escapeHtml(LANE_LABELS[lv.lane] || lv.lane) + '</span>' +
        '<span class="rd-verdict-pill" data-v="' + escapeHtml(lv.verdict) + '">' + escapeHtml(lv.verdict) + '</span></div>' +
        '<p class="rd-lane-evidence">' + escapeHtml(lv.evidence) + '</p>';
      if (lv.bold_line) html += '<p class="rd-bold-line">' + escapeHtml(lv.bold_line) + '</p>';
      if (lv.verdict === 'DOCUMENTATION' && lv.buried_on) {
        html += '<p class="rd-lane-meta">buried on ' + escapeHtml(lv.buried_on) + '</p>';
      }
      if (lv.verdict === 'ABSENT' && lv.searched && lv.searched.length) {
        html += '<p class="rd-lane-meta">searched: ' + lv.searched.map(escapeHtml).join(', ') + '</p>';
      }
      html += '</div>';
    });
    html += '</div>';

    if (fx.strongest_true_thing) {
      html += '<div class="rd-block rd-strongest" id="rdStrongest">' +
        '<span class="rd-strongest-label">the strongest true thing</span>' +
        '<p>' + escapeHtml(fx.strongest_true_thing.text) + '</p></div>';
    }

    html += '<div class="rd-block rd-cut" id="rdCut">' +
      '<span class="rd-cut-label">the one cut</span>' +
      '<p id="rdCutText"></p></div>';

    if (fx.bridge) {
      html += '<div class="rd-block rd-bridge" id="rdBridge">' +
        '<p>' + escapeHtml(fx.bridge.text) + '</p>' +
        '<div class="rd-cta-row">' +
          '<a class="rd-cta-btn" href="/services.html">the Articulation Intensive <span class="arrow">→</span></a>' +
          '<span class="rd-cta-hint">a few days together — 2–3 artifacts made</span>' +
        '</div></div>';
    }

    // coverage tail — one chrome line under a dashed rule
    var cov = fx.coverage;
    if (cov) {
      var skipped = (cov.not_examined || []).map(function (n) {
        return escapeHtml(LANE_LABELS[n.lane] || n.lane) + ' — ' + escapeHtml(n.reason);
      }).join(' · ');
      var unfetched = (cov.unfetched_pages && cov.unfetched_pages.length)
        ? ' Not retrieved: ' + cov.unfetched_pages.map(escapeHtml).join(', ') + '.'
        : '';
      html += '<p class="rd-coverage"><b>' + escapeHtml(String(cov.lanes_examined)) + ' of ' +
        escapeHtml(String(cov.lanes_total)) + '</b> lanes examined' +
        (skipped ? '. ' + skipped : '') + '.' + unfetched + '</p>';
    }

    if (slug) {
      var permalinkUrl = 'joyus.studio/site-read/?r=' + encodeURIComponent(slug);
      html += '<div class="rd-permalink"><span class="rd-permalink-url">' + escapeHtml(permalinkUrl) + '</span>' +
        '<button class="rd-permalink-copy" id="copyLink" type="button">copy link</button></div>';
    }

    if (isSample) {
      html += '<p class="rd-samplenote">Sample read. Fictional pottery, invented domain.</p>';
    }

    html += demoPillsHtml();
    html += '</div>'; // read-wrap

    // The dots sit in the closing's top padding band, on the right — behind the
    // content by z-index AND clear of it by geometry, so nothing ever reads
    // through a pink circle.
    html += '<section class="closing">' +
      '<span class="dot d-pink" style="width:22px;height:22px;top:6%;right:9%;"></span>' +
      '<span class="dot d-cyan" style="width:12px;height:12px;top:16%;right:22%;"></span>' +
      '<span class="closing-label">your move</span>' +
      '<h3>Now the version a stranger cannot miss. <em><a href="/say-hi.html">Be our friends.</a></em></h3>' +
      '<span class="hint">hello@joyus.studio · we read everything</span></section>';

    root.innerHTML = html;

    // reveal the body, then type the one cut — the only typed line here
    var blocks = ['rdSkim', 'rdGap', 'rdLanes', 'rdStrongest', 'rdBridge']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var cutBlock = document.getElementById('rdCut');
    var cutText = document.getElementById('rdCutText');
    var cutString = fx.one_cut ? fx.one_cut.text : '';

    if (reduce) {
      blocks.forEach(function (b) { b.classList.add('in'); });
      cutBlock.classList.add('in', 'done');
      cutText.textContent = cutString;
    } else {
      blocks.forEach(function (b, i) { setTimeout(function () { b.classList.add('in'); }, i * 220); });
      setTimeout(function () {
        cutBlock.classList.add('in');
        typeInto(cutText, cutString, 20, function () { cutBlock.classList.add('done'); });
      }, blocks.length * 220 + 400);
    }

    var copyBtn = document.getElementById('copyLink');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = 'https://joyus.studio/site-read/?r=' + encodeURIComponent(slug);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(function () {});
        }
        copyBtn.textContent = 'copied';
        copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.textContent = 'copy link'; copyBtn.classList.remove('copied'); }, 1600);
      });
    }
  }

  function exhibitLine(ex) {
    if (!ex) return '';
    var body = ex.quote ? '“' + escapeHtml(ex.quote) + '”' : escapeHtml(ex.reference || '');
    if (!body) return '';
    return '<span class="rd-exhibit"><b>' + escapeHtml(ex.page) + '</b> · ' + body + '</span>';
  }

  /* Types one string into one element. The node is deliberately NOT inside
     an aria-live region — a screen reader would otherwise re-announce the
     sentence on every character. The finished sentence is already in the
     document for anyone reading it with assistive tech. */
  function typeInto(el, text, speed, cb) {
    if (!text) { if (cb) cb(); return; }
    var caret = document.createElement('span');
    caret.className = 'caret';
    el.textContent = '';
    el.appendChild(caret);
    var i = 0;
    (function tick() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        el.appendChild(caret);
        i++;
        setTimeout(tick, speed);
      } else {
        caret.remove();
        el.textContent = text;
        if (cb) cb();
      }
    })();
  }

  function announce(msg) {
    if (srStatus) srStatus.textContent = msg;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  boot();
})();
