// Study 59: the live page's idea in two dimensions: any shape, cut into gummy stones by a Voronoi diagram.
// (The live J is 3D, in cs/jbuilder.js. This 2D cut is for layouts and portraits.)
export function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// seeds inside a mask, spread by two rounds of Lloyd's relaxation
export function seedsIn(w, h, inside, n, seed = 7) {
  const r = rng(seed), pts = [];
  let guard = 0;
  while (pts.length < n && guard++ < n * 800) { const x = r() * w, y = r() * h; if (inside(x | 0, y | 0)) pts.push({ x, y }); }
  for (let round = 0; round < 2; round++) {
    const sx = pts.map(() => 0), sy = pts.map(() => 0), c = pts.map(() => 0);
    for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) {
      if (!inside(x, y)) continue;
      let b = 0, bd = 1e12;
      for (let i = 0; i < pts.length; i++) { const d = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2; if (d < bd) { bd = d; b = i; } }
      sx[b] += x; sy[b] += y; c[b]++;
    }
    pts.forEach((p, i) => { if (c[i]) { p.x = sx[i] / c[i]; p.y = sy[i] / c[i]; } });
  }
  return pts;
}

// cut the mask into stones: each a small canvas, rounded, with a gummy light on it
export function cut(w, h, inside, pts, colourOf, gap = 2.2, gloss = 1) {
  const label = new Int16Array(w * h).fill(-1), gaps = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    let a = 1e12, b = 1e12, ai = -1;
    for (let i = 0; i < pts.length; i++) {
      const d = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2;
      if (d < a) { b = a; a = d; ai = i; } else if (d < b) b = d;
    }
    label[y * w + x] = ai; gaps[y * w + x] = Math.sqrt(b) - Math.sqrt(a);
  }
  return pts.map((p, i) => {
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (label[y * w + x] === i && gaps[y * w + x] > gap) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return null;
    const pad = 3, W = x1 - x0 + 1 + pad * 2, H = y1 - y0 + 1 + pad * 2;
    const m = document.createElement('canvas'); m.width = W; m.height = H;
    const mx = m.getContext('2d'), img = mx.createImageData(W, H);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (label[y * w + x] === i && gaps[y * w + x] > gap) img.data[((y - y0 + pad) * W + (x - x0 + pad)) * 4 + 3] = 255;
    mx.putImageData(img, 0, 0);
    // round the corners: blur, then harden
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.filter = 'blur(2px)'; g.drawImage(m, 0, 0); g.filter = 'none';
    const d = g.getImageData(0, 0, W, H);
    for (let k = 3; k < d.data.length; k += 4) d.data[k] = Math.max(0, Math.min(255, (d.data[k] - 110) * 8));
    g.putImageData(d, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = colourOf(p, i); g.fillRect(0, 0, W, H);
    // the gummy: a dark lower edge, a soft light upper left
    g.globalCompositeOperation = 'source-atop';
    const lo = g.createLinearGradient(0, 0, W * .3, H); lo.addColorStop(.55, 'rgba(0,0,0,0)'); lo.addColorStop(1, 'rgba(20,10,40,' + (.28 * gloss) + ')');
    g.fillStyle = lo; g.fillRect(0, 0, W, H);
    const hi = g.createRadialGradient(W * .34, H * .28, 0, W * .34, H * .28, Math.max(W, H) * .5); hi.addColorStop(0, 'rgba(255,255,255,' + (.55 * gloss) + ')'); hi.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hi; g.fillRect(0, 0, W, H);
    return { i, canvas: c, x: x0 - pad, y: y0 - pad, w: W, h: H, cx: x0 - pad + W / 2, cy: y0 - pad + H / 2 };
  }).filter(Boolean);
}

// a letter as a mask, in the page's own first font
export async function letterMask(ch, size, font = "900 1px 'Rubik'") {
  await document.fonts.load(font.replace('1px', '100px'), ch);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = font.replace('1px', Math.round(size * .92) + 'px'); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, size / 2, size / 2 + size * .03);
  const d = g.getImageData(0, 0, size, size).data;
  return (x, y) => x >= 0 && y >= 0 && x < size && y < size && d[(y * size + x) * 4 + 3] > 128;
}

// half-plane clipping: the exact polygon of each cell, for laying text in
export function cells(pts, W, H) {
  return pts.map((p, i) => {
    let poly = [[0, 0], [W, 0], [W, H], [0, H]];
    pts.forEach((q, j) => {
      if (i === j) return;
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, nx = q.x - p.x, ny = q.y - p.y, out = [];
      poly.forEach((a, k) => {
        const b = poly[(k + 1) % poly.length];
        const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
        if (da <= 0) out.push(a);
        if (da * db < 0) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      });
      poly = out;
    });
    return poly;
  });
}
export const PALETTE = ['#f25aa3', '#7d55d4', '#2fc0d8', '#f5c63c'];
