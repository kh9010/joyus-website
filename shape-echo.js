/**
 * Shape Echo — renders the user's splash-page drawing as a persistent
 * SVG icon in the nav bar. The drawing follows you around the site
 * for the duration of your session.
 */
(function () {
  var data = sessionStorage.getItem('joyus_shape');
  if (!data) return;

  try {
    var shape = JSON.parse(data);
    if (!shape.path || !shape.path.length) return;
  } catch (e) {
    return;
  }

  // Find bounds of all strokes (already normalized 0-1)
  var minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (var s = 0; s < shape.path.length; s++) {
    for (var p = 0; p < shape.path[s].length; p++) {
      var pt = shape.path[s][p];
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  var shapeW = maxX - minX;
  var shapeH = maxY - minY;
  if (shapeW < 0.001 || shapeH < 0.001) return;

  // Target size for the nav icon
  var iconSize = 30;
  var padding = 2;
  var drawSize = iconSize - padding * 2;

  // Scale to fit within drawSize, maintaining aspect ratio
  var scale = Math.min(drawSize / shapeW, drawSize / shapeH);
  var offsetX = padding + (drawSize - shapeW * scale) / 2;
  var offsetY = padding + (drawSize - shapeH * scale) / 2;

  // Build SVG path data
  var pathData = '';
  for (var s = 0; s < shape.path.length; s++) {
    var stroke = shape.path[s];
    if (stroke.length < 2) continue;
    for (var i = 0; i < stroke.length; i++) {
      var x = (stroke[i].x - minX) * scale + offsetX;
      var y = (stroke[i].y - minY) * scale + offsetY;
      pathData += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
  }

  if (!pathData) return;

  // Create SVG element
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', iconSize);
  svg.setAttribute('height', iconSize);
  svg.setAttribute('viewBox', '0 0 ' + iconSize + ' ' + iconSize);
  svg.setAttribute('class', 'nav-shape');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'display:inline-block;vertical-align:middle;margin-left:0.6rem;opacity:0;transform:scale(0.8);transition:opacity 0.6s ease,transform 0.4s ease;';

  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#E91E7B');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  // Insert into nav, next to the logo
  var logo = document.querySelector('.logo, .nav-logo, .logo-link');
  if (logo) {
    logo.parentNode.insertBefore(svg, logo.nextSibling);
    // Trigger entrance animation
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        svg.style.opacity = '0.5';
        svg.style.transform = 'scale(1)';
      });
    });
  }
})();
