/**
 * Shape Echo — your drawing lives on.
 *
 * 1. First landing after splash: replays the drawing in the hero,
 *    then shrinks it into the nav bar.
 * 2. Subsequent pages: shows the shape in the nav directly.
 * 3. No shape yet? A small "draw" prompt appears in the nav.
 *    Click it (or click an existing shape) to open a mini canvas
 *    and draw/redraw your mark.
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

  // ── Create the nav SVG icon ──
  function createNavIcon(strokes, animate) {
    var paths = buildPathData(strokes, ICON_SIZE);
    if (!paths || !paths.length) return null;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', ICON_SIZE);
    svg.setAttribute('height', ICON_SIZE);
    svg.setAttribute('viewBox', '0 0 ' + ICON_SIZE + ' ' + ICON_SIZE);
    svg.setAttribute('class', 'nav-shape');
    svg.setAttribute('role', 'button');
    svg.setAttribute('aria-label', 'Redraw your shape');
    svg.setAttribute('tabindex', '0');
    svg.style.cssText = 'display:inline-block;vertical-align:middle;margin-left:0.6rem;cursor:pointer;opacity:0;transform:scale(0.8);transition:opacity 0.6s ease,transform 0.4s ease;';

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
      openDrawOverlay();
    });

    return svg;
  }

  // ── Create the "draw" prompt for users with no shape ──
  function createDrawPrompt() {
    var btn = document.createElement('button');
    btn.className = 'nav-draw-prompt';
    btn.setAttribute('aria-label', 'Draw your mark');
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 19l4-1.5L17.5 7 15 4.5 4.5 15 3 19z" stroke="' + PINK + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>' +
      '<path d="M14 5.5l2.5 2.5" stroke="' + PINK + '" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>' +
      '</svg>';
    btn.style.cssText = 'background:none;border:none;cursor:pointer;padding:0.2rem;margin-left:0.5rem;vertical-align:middle;opacity:0;transition:opacity 0.6s ease;display:inline-block;';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openDrawOverlay();
    });
    return btn;
  }

  // ── Hero replay animation ──
  function replayInHero(strokes, callback) {
    var hero = document.querySelector('.intent-hero, .comic-hero, .podcast-page-hero, .comics-hero, .about-hero, .work-page-hero, .hub-hero, [class*="hero"]');
    if (!hero) { callback(); return; }

    hero.style.position = hero.style.position || 'relative';
    hero.style.overflow = 'hidden';

    // Build a large SVG to replay in the hero
    var heroRect = hero.getBoundingClientRect();
    var replaySize = Math.min(heroRect.width * 0.5, heroRect.height * 0.7, 400);
    var paths = buildPathData(strokes, replaySize, 10);
    if (!paths || !paths.length) { callback(); return; }

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', replaySize);
    svg.setAttribute('height', replaySize);
    svg.setAttribute('viewBox', '0 0 ' + replaySize + ' ' + replaySize);
    svg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;pointer-events:none;';

    var totalLength = 0;
    var pathEls = [];
    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', paths[i]);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', PINK);
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('opacity', '0.25');
      svg.appendChild(p);
      pathEls.push(p);
    }

    hero.appendChild(svg);

    // Measure and set up stroke-dasharray animation
    requestAnimationFrame(function () {
      for (var i = 0; i < pathEls.length; i++) {
        var len = pathEls[i].getTotalLength();
        pathEls[i].style.strokeDasharray = len;
        pathEls[i].style.strokeDashoffset = len;
        pathEls[i].style.transition = 'stroke-dashoffset 1.5s ease';
      }
      // Trigger the draw animation
      requestAnimationFrame(function () {
        for (var i = 0; i < pathEls.length; i++) {
          pathEls[i].style.strokeDashoffset = '0';
        }
      });

      // After draw completes, shrink and move to nav
      setTimeout(function () {
        svg.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        svg.style.opacity = '0';
        svg.style.transform = 'translate(-50%, -50%) scale(0.1)';

        setTimeout(function () {
          if (svg.parentNode) svg.parentNode.removeChild(svg);
          callback();
        }, 800);
      }, 2000);
    });
  }

  // ── Mini drawing overlay ──
  function openDrawOverlay() {
    if (document.getElementById('shapeDrawOverlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'shapeDrawOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(255,255,255,0.97);display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;';

    var prompt = document.createElement('p');
    prompt.textContent = 'draw your mark';
    prompt.style.cssText = 'font-family:"Caveat",cursive;font-size:1.4rem;color:#ccc;margin-bottom:1rem;';

    var canvas = document.createElement('canvas');
    var size = Math.min(window.innerWidth - 40, window.innerHeight - 160, 500);
    canvas.width = size * (window.devicePixelRatio || 1);
    canvas.height = size * (window.devicePixelRatio || 1);
    canvas.style.cssText = 'width:' + size + 'px;height:' + size + 'px;cursor:crosshair;border-radius:12px;border:1px solid #eee;touch-action:none;';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);

    var hint = document.createElement('p');
    hint.textContent = 'tap anywhere outside to save';
    hint.style.cssText = 'font-family:"DM Sans",sans-serif;font-size:0.8rem;color:#bbb;margin-top:1rem;';

    overlay.appendChild(prompt);
    overlay.appendChild(canvas);
    overlay.appendChild(hint);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () { overlay.style.opacity = '1'; });

    // Drawing state
    var drawing = false;
    var points = [];
    var allStrokes = [];

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    function redraw() {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(233, 30, 123, 0.6)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      var all = allStrokes.concat(points.length > 1 ? [points] : []);
      for (var s = 0; s < all.length; s++) {
        if (all[s].length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(all[s][0].x, all[s][0].y);
        for (var i = 1; i < all[s].length; i++) ctx.lineTo(all[s][i].x, all[s][i].y);
        ctx.stroke();
      }
    }

    function onStart(e) {
      e.preventDefault();
      drawing = true;
      points = [getPos(e)];
      prompt.style.opacity = '0';
    }
    function onMove(e) {
      if (!drawing) return;
      e.preventDefault();
      points.push(getPos(e));
      redraw();
    }
    function onEnd(e) {
      if (!drawing) return;
      e.preventDefault();
      drawing = false;
      if (points.length > 3) allStrokes.push(points.slice());
      points = [];
      redraw();
    }

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });

    // Close overlay on click outside canvas
    overlay.addEventListener('click', function (e) {
      if (e.target === canvas) return;
      closeOverlay();
    });

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { closeOverlay(); document.removeEventListener('keydown', handler); }
    });

    function closeOverlay() {
      if (allStrokes.length > 0) {
        // Normalize strokes to 0-1 range
        var normalized = allStrokes.map(function (stroke) {
          return stroke.map(function (p) {
            return { x: p.x / size, y: p.y / size };
          });
        });
        sessionStorage.setItem('joyus_shape', JSON.stringify({ path: normalized, hint: '' }));
        // Mark as already replayed so we don't replay on current page
        sessionStorage.setItem('joyus_shape_replayed', '1');
        updateNavShape(normalized);
      }

      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
    }
  }

  // ── Update or insert the nav shape ──
  function updateNavShape(strokes) {
    var existing = document.querySelector('.nav-shape');
    if (existing) existing.parentNode.removeChild(existing);
    var existingPrompt = document.querySelector('.nav-draw-prompt');
    if (existingPrompt) existingPrompt.parentNode.removeChild(existingPrompt);

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
        updateNavShape(shape.path);
      });
    } else {
      // Already replayed — just show in nav
      updateNavShape(shape.path);
    }
  } else {
    // No shape — show draw prompt
    var btn = createDrawPrompt();
    logo.parentNode.insertBefore(btn, logo.nextSibling);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { btn.style.opacity = '1'; });
    });
  }
})();
