/* Distance transforms of a binary image (1 = inside), in pixels.
   Study 34. Shared by jbuilder.js (the glyph field) and bake/field.html
   (the contour pictures on the study page).

   chamfer: the 3×3 two-pass approximation used since Study 19 (weights
   1 and √2). Its contour lines are octagons: along a curved edge the
   distance is wrong by up to ~8%, and the stones' edges and normals follow
   that wobble, whatever the mesh resolution.

   edt: the exact Euclidean distance (Felzenszwalb & Huttenlocher 2004,
   separable lower-envelope of parabolas), O(w·h). Contour lines are true
   offsets of the shape. */
export function chamfer(bin, w, h) {
  const INF = 1e9, D = Math.SQRT2, d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = bin[i] ? INF : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (d[i] === 0) continue; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) { v = Math.min(v, d[i - w] + 1); if (x > 0) v = Math.min(v, d[i - w - 1] + D); if (x < w - 1) v = Math.min(v, d[i - w + 1] + D); }
    d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; if (d[i] === 0) continue; let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < h - 1) { v = Math.min(v, d[i + w] + 1); if (x < w - 1) v = Math.min(v, d[i + w + 1] + D); if (x > 0) v = Math.min(v, d[i + w - 1] + D); }
    d[i] = v;
  }
  return d;
}

/* one-dimensional squared-distance transform of f (INF where there is no
   site), into out; v, z are scratch arrays of length n and n + 1 */
function edt1d(f, n, out, v, z) {
  const INF = 1e20;
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const d = q - v[k]; out[q] = d * d + f[v[k]];
  }
}
export function edt(bin, w, h) {
  const INF = 1e20, n = Math.max(w, h);
  const g = new Float64Array(w * h), f = new Float64Array(n), o = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  /* columns: squared vertical distance to the nearest 0 (outside) pixel */
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = bin[y * w + x] ? INF : 0;
    edt1d(f, h, o, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = o[y];
  }
  const d = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    edt1d(f, w, o, v, z);
    for (let x = 0; x < w; x++) d[y * w + x] = Math.sqrt(o[x]);
  }
  return d;
}
