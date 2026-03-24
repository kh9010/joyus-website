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

  // ── Hero replay animation ──
  function replayInHero(strokes, callback) {
    var hero = document.querySelector('.intent-hero, .comic-hero, .podcast-page-hero, .comics-hero, .about-hero, .work-page-hero, .hub-hero, [class*="hero"]');
    if (!hero) { callback(); return; }

    var origPosition = hero.style.position;
    var origOverflow = hero.style.overflow;
    hero.style.position = hero.style.position || 'relative';
    hero.style.overflow = 'hidden';

    var heroRect = hero.getBoundingClientRect();
    var replaySize = Math.min(heroRect.width * 0.45, heroRect.height * 0.6, 350);
    var paths = buildPathData(strokes, replaySize, 8);
    if (!paths || !paths.length) { callback(); return; }

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', replaySize);
    svg.setAttribute('height', replaySize);
    svg.setAttribute('viewBox', '0 0 ' + replaySize + ' ' + replaySize);
    svg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;pointer-events:none;';

    var pathEls = [];
    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', paths[i]);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', PINK);
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('opacity', '0.2');
      svg.appendChild(p);
      pathEls.push(p);
    }

    hero.appendChild(svg);

    // Set up stroke-dasharray draw animation
    requestAnimationFrame(function () {
      for (var i = 0; i < pathEls.length; i++) {
        var len = pathEls[i].getTotalLength();
        pathEls[i].style.strokeDasharray = len;
        pathEls[i].style.strokeDashoffset = len;
        pathEls[i].style.transition = 'stroke-dashoffset 1.5s ease';
      }
      // Trigger draw
      requestAnimationFrame(function () {
        for (var i = 0; i < pathEls.length; i++) {
          pathEls[i].style.strokeDashoffset = '0';
        }
      });

      // After draw, fade out and shrink
      setTimeout(function () {
        svg.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        svg.style.opacity = '0';
        svg.style.transform = 'translate(-50%, -50%) scale(0.15)';

        setTimeout(function () {
          if (svg.parentNode) svg.parentNode.removeChild(svg);
          hero.style.position = origPosition;
          hero.style.overflow = origOverflow;
          callback();
        }, 700);
      }, 2200);
    });
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
    var hasReplayed = sessionStorage.getItem('joyus_shape_replayed');

    if (!hasReplayed) {
      // First landing — replay in hero, then dock in nav
      sessionStorage.setItem('joyus_shape_replayed', '1');
      replayInHero(shape.path, function () {
        placeNavIcon(shape.path);
      });
    } else {
      // Already replayed — just show in nav
      placeNavIcon(shape.path);
    }
  } else {
    // No shape — show subtle pencil link to splash page
    var btn = createDrawPrompt();
    logo.parentNode.insertBefore(btn, logo.nextSibling);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { btn.style.opacity = '1'; });
    });
  }
})();
