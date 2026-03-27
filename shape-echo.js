/**
 * Shape Echo — your drawing lives on.
 *
 * 1. First landing after splash: replays the drawing in the hero,
 *    then docks it into the nav bar.
 * 2. Subsequent pages: shows the shape in the nav directly.
 * 3. Click the nav shape to go back to the splash page and redraw
 *    (full experience with illustration reveal).
 * 4. No shape? A subtle pencil link in the nav takes you to the splash.
 */
(function () {
  'use strict';

  var PINK = '#E91E7B';
  var ICON_SIZE = 30;

  // ── Utility: build SVG path data from normalized strokes ──
  function buildPathData(strokes, size, padding) {
    padding = padding || 2;
    var drawSize = size - padding * 2;
    var minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (var s = 0; s < strokes.length; s++) {
      for (var p = 0; p < strokes[s].length; p++) {
        var pt = strokes[s][p];
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }
    var w = maxX - minX, h = maxY - minY;
    if (w < 0.001 || h < 0.001) return null;
    var scale = Math.min(drawSize / w, drawSize / h);
    var ox = padding + (drawSize - w * scale) / 2;
    var oy = padding + (drawSize - h * scale) / 2;
    var paths = [];
    for (var s = 0; s < strokes.length; s++) {
      var stroke = strokes[s];
      if (stroke.length < 2) continue;
      var d = '';
      for (var i = 0; i < stroke.length; i++) {
        var x = (stroke[i].x - minX) * scale + ox;
        var y = (stroke[i].y - minY) * scale + oy;
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
      }
      paths.push(d);
    }
    return paths;
  }

  // Figure out the splash page URL (depends on directory depth)
  function splashUrl() {
    var path = window.location.pathname;
    if (path.indexOf('/work/') !== -1 || path.indexOf('/comics/') !== -1) return '../index.html';
    return 'index.html';
  }

  function goToSplash() {
    // Clear the session flag so the splash page works again
    sessionStorage.removeItem('joyus_entered');
    sessionStorage.removeItem('joyus_shape');
    sessionStorage.removeItem('joyus_shape_replayed');
    window.location.href = splashUrl();
  }

  // ── Create the nav SVG icon ──
  function createNavIcon(strokes) {
    var paths = buildPathData(strokes, ICON_SIZE);
    if (!paths || !paths.length) return null;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', ICON_SIZE);
    svg.setAttribute('height', ICON_SIZE);
    svg.setAttribute('viewBox', '0 0 ' + ICON_SIZE + ' ' + ICON_SIZE);
    svg.setAttribute('class', 'nav-shape');
    svg.setAttribute('role', 'button');
    svg.setAttribute('aria-label', 'Redraw — back to splash');
    svg.setAttribute('tabindex', '0');
    svg.style.cssText = 'display:inline-block;vertical-align:middle;margin-left:0.6rem;cursor:pointer;opacity:0;transform:scale(0.8);transition:opacity 0.6s ease,transform 0.4s ease;';
    svg.title = 'Draw again';

    for (var i = 0; i < paths.length; i++) {
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', paths[i]);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', PINK);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    }

    svg.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      goToSplash();
    });

    return svg;
  }

  // ── Create the "draw" prompt for users with no shape ──
  function createDrawPrompt() {
    var btn = document.createElement('button');
    btn.className = 'nav-draw-prompt';
    btn.setAttribute('aria-label', 'Draw your mark');
    btn.title = 'Draw something';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 19l4-1.5L17.5 7 15 4.5 4.5 15 3 19z" stroke="' + PINK + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>' +
      '<path d="M14 5.5l2.5 2.5" stroke="' + PINK + '" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>' +
      '</svg>';
    btn.style.cssText = 'background:none;border:none;cursor:pointer;padding:0.2rem;margin-left:0.5rem;vertical-align:middle;opacity:0;transition:opacity 0.6s ease;display:inline-block;';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      goToSplash();
    });
    return btn;
  }

  // ── Place icon in nav ──
  function placeNavIcon(strokes) {
    var existing = document.querySelector('.nav-shape, .nav-draw-prompt');
    if (existing) existing.parentNode.removeChild(existing);

    var svg = createNavIcon(strokes);
    if (!svg) return;

    var logo = document.querySelector('.logo, .nav-logo, .logo-link');
    if (logo) {
      logo.parentNode.insertBefore(svg, logo.nextSibling);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          svg.style.opacity = '0.5';
          svg.style.transform = 'scale(1)';
        });
      });
    }
  }

  // ── Page name helper ──
  var PAGE_LABELS = {
    'home.html': 'Home', 'about.html': 'About', 'services.html': 'Services',
    'podcast.html': 'Podcast', 'work/index.html': 'Work', 'comics/index.html': 'Comics',
    'comics/the-friend-comic.html': 'the Friend comic', 'comics/gossip.html': 'Gossip',
    'hub-story.html': 'Finding Your Story', 'hub-building.html': 'Building Something That Matters',
    'hub-behavior.html': 'How People Actually Behave', 'hub-play.html': 'Play as Practice',
    'hub-creative.html': 'Drawing Outside the Lines'
  };

  function currentPageKey() {
    var path = window.location.pathname;
    // Strip leading path segments to get relative page
    var match = path.match(/(?:^|\/)([^\/]+\/[^\/]+\.html|[^\/]+\.html)$/);
    return match ? match[1] : 'home.html';
  }

  function labelForPage(page) {
    return PAGE_LABELS[page] || page.replace('.html', '').replace(/.*\//, '');
  }

  // ── "Others are reading" ticker in the nav ──
  var SHAPE_PLURALS = {
    circle: 'circles', triangle: 'triangles', square: 'squares',
    rectangle: null, other: 'shapes'
  };

  function createOthersTicker(pages, shapeLabel) {
    if (!pages || !pages.length) return null;

    var container = document.createElement('span');
    container.className = 'nav-others-ticker';
    container.style.cssText = 'display:inline-block;vertical-align:middle;margin-left:0.35rem;font-family:"Caveat",cursive;font-size:0.95rem;color:#999;overflow:hidden;max-width:260px;white-space:nowrap;opacity:0;transition:opacity 0.6s ease;';

    var prefix = document.createElement('span');
    prefix.textContent = shapeLabel ? 'other ' + shapeLabel + ' exploring \u2192 ' : 'others are exploring \u2192 ';
    prefix.style.cssText = 'color:#ddd;';
    container.appendChild(prefix);

    var pageSpan = document.createElement('a');
    pageSpan.style.cssText = 'color:#E91E7B;opacity:0.85;text-decoration:none;transition:opacity 0.4s ease;';
    container.appendChild(pageSpan);

    // Rotate through pages
    var idx = 0;
    function showNext() {
      pageSpan.style.opacity = '0';
      setTimeout(function () {
        var entry = pages[idx % pages.length];
        pageSpan.textContent = labelForPage(entry.page);
        pageSpan.href = entry.url;
        pageSpan.style.opacity = '0.6';
        idx++;
      }, 400);
    }
    showNext();
    setInterval(showNext, 4000);

    return container;
  }

  // ── Firebase: log visit + query others ──
  function initFirebaseTracking(shapeType) {
    var firebaseConfig = {
      apiKey: "AIzaSyAE4YqmNENXay7sS55JOJT4Ql9u73g8Xgk",
      authDomain: "joyus-studio.firebaseapp.com",
      projectId: "joyus-studio",
      storageBucket: "joyus-studio.firebasestorage.app",
      messagingSenderId: "654710924238",
      appId: "1:654710924238:web:c300c98f31d2f620b3c19f"
    };

    function getDb() {
      var db = firebase.firestore();
      // Fix CORS errors on GitHub Pages by using long polling
      db.settings({ experimentalAutoDetectLongPolling: true, merge: true });
      return db;
    }

    function whenReady(cb) {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        cb(getDb());
      } else if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        firebase.initializeApp(firebaseConfig);
        cb(getDb());
      } else {
        // Dynamically load Firebase SDK
        var base = 'https://www.gstatic.com/firebasejs/10.12.0/';
        var s1 = document.createElement('script');
        s1.src = base + 'firebase-app-compat.js';
        s1.onload = function () {
          var s2 = document.createElement('script');
          s2.src = base + 'firebase-firestore-compat.js';
          s2.onload = function () {
            firebase.initializeApp(firebaseConfig);
            cb(getDb());
          };
          document.head.appendChild(s2);
        };
        document.head.appendChild(s1);
      }
    }

    whenReady(function (db) {
      var page = currentPageKey();

      // Log this visit
      try {
        db.collection('shape_visits').add({
          shapeType: shapeType,
          page: page,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) { /* silent */ }

      // Query what others with same shape type are visiting
      try {
        db.collection('shape_visits')
          .where('shapeType', '==', shapeType)
          .limit(100)
          .get()
          .then(function (snap) {
            // Count pages, excluding current
            var counts = {};
            snap.forEach(function (doc) {
              var d = doc.data();
              if (d.page && d.page !== page) {
                counts[d.page] = (counts[d.page] || 0) + 1;
              }
            });
            // Sort by popularity
            var sorted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
            if (!sorted.length) return;

            // Build URL for each page
            var isSubdir = window.location.pathname.indexOf('/work/') !== -1 || window.location.pathname.indexOf('/comics/') !== -1;
            var pages = sorted.map(function (p) {
              var url = isSubdir ? '../' + p : p;
              return { page: p, url: url };
            });

            var plural = SHAPE_PLURALS[shapeType] || 'shapes';

            // Desktop: insert ticker in nav after shape icon
            var navShape = document.querySelector('.nav-shape, .nav-draw-prompt');
            if (navShape) {
              var ticker = createOthersTicker(pages, plural);
              if (ticker) {
                navShape.parentNode.insertBefore(ticker, navShape.nextSibling);
                requestAnimationFrame(function () {
                  requestAnimationFrame(function () { ticker.style.opacity = '1'; });
                });
              }
            }

            // Mobile: insert a slim banner below the nav
            var mobileTicker = document.createElement('div');
            mobileTicker.className = 'mobile-others-ticker';
            mobileTicker.style.cssText = 'display:none;text-align:center;padding:0.5rem 1rem;font-family:"Caveat",cursive;font-size:0.9rem;color:#999;background:var(--warm-gray,#F5F3F0);border-bottom:1px solid #eee;margin-top:60px;';
            var mPrefix = document.createElement('span');
            mPrefix.textContent = 'other ' + plural + ' exploring \u2192 ';
            var mLink = document.createElement('a');
            mLink.style.cssText = 'color:#E91E7B;text-decoration:none;font-weight:500;';
            mobileTicker.appendChild(mPrefix);
            mobileTicker.appendChild(mLink);
            document.body.insertBefore(mobileTicker, document.body.firstChild.nextSibling);

            // Rotate mobile ticker
            var mIdx = 0;
            function rotateMobile() {
              var entry = pages[mIdx % pages.length];
              mLink.textContent = labelForPage(entry.page);
              mLink.href = entry.url;
              mIdx++;
            }
            rotateMobile();
            setInterval(rotateMobile, 4000);
          })
          .catch(function () { /* silent */ });
      } catch (e) { /* silent */ }
    });
  }

  // ── Init ──
  var logo = document.querySelector('.logo, .nav-logo, .logo-link');
  if (!logo) return;

  var data = sessionStorage.getItem('joyus_shape');
  var shape = null;

  if (data) {
    try {
      shape = JSON.parse(data);
      if (!shape.path || !shape.path.length) shape = null;
    } catch (e) { shape = null; }
  }

  if (shape) {
    // Determine shape type
    var shapeType = shape.shapeType;
    if (!shapeType) {
      var dest = shape.hint || '';
      if (dest.indexOf('about') !== -1) shapeType = 'circle';
      else if (dest.indexOf('gossip') !== -1) shapeType = 'triangle';
      else if (dest.indexOf('504') !== -1) shapeType = 'square';
      else shapeType = 'rectangle';
    }
    placeNavIcon(shape.path);
    initFirebaseTracking(shapeType);
  } else {
    // No shape — show subtle pencil link to splash page
    var btn = createDrawPrompt();
    logo.parentNode.insertBefore(btn, logo.nextSibling);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { btn.style.opacity = '1'; });
    });
  }
})();
