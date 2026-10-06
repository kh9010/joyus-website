/* The J, built live, in a worker. Study 19; Study 20 adds layer:false (3D)
   and per-font masks (mask: 'masks/<font>.png').

   Studies 16–18 baked one J into a JSON file. Building it takes ~0.25 s
   (measured), so every visit can build its own: a random seed, a new J.
   It runs in a worker so the page never stalls, and posts each stone the
   moment it's meshed, so stones can fly in as they're made.

   Same procedure as joyus/brand-lab's Solid tab (solid-geometry.js, copied
   verbatim) with two changes:
   - the glyph comes from j-mask.png (Arial Black, drawn once on a machine
     that has it), not from the font, which Android doesn't have;
   - occlusion (shade where stones touch) is not ray-cast (0.9–4.7 s,
     measured in Study 19) but read off the other stones' distance fields:
     a point is shaded by how close the nearest other stone is.

   in:  { seed, cells, fluff, depth, gap, dome, res, mask }
   out: { type:'start', count } · { type:'piece', i, colour, pos, nrm, idx, ao, home }
        · { type:'done', ms, sizes } · { type:'error', message } */
import { seeds3, buildCell, cellSDF, surfaceNets, assignColours } from './bake/solid-geometry.js';

const PALETTE = ['#f25aa3', '#7d55d4', '#2fc0d8', '#f5c63c'];
const SIDE = 1.6, R = 320;

function chamfer(bin, w, h){
  const INF = 1e9, D = Math.SQRT2, d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = bin[i] ? INF : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y*w + x; if (d[i] === 0) continue; let v = d[i];
    if (x > 0) v = Math.min(v, d[i-1] + 1);
    if (y > 0){ v = Math.min(v, d[i-w] + 1); if (x > 0) v = Math.min(v, d[i-w-1] + D); if (x < w-1) v = Math.min(v, d[i-w+1] + D); }
    d[i] = v;
  }
  for (let y = h-1; y >= 0; y--) for (let x = w-1; x >= 0; x--){
    const i = y*w + x; if (d[i] === 0) continue; let v = d[i];
    if (x < w-1) v = Math.min(v, d[i+1] + 1);
    if (y < h-1){ v = Math.min(v, d[i+w] + 1); if (x < w-1) v = Math.min(v, d[i+w+1] + D); if (x > 0) v = Math.min(v, d[i+w-1] + D); }
    d[i] = v;
  }
  return d;
}
/* bake.html's glyphField, reading alpha from the mask instead of fillText */
function glyphFromAlpha(A){
  const bin = new Uint8Array(R*R), inv = new Uint8Array(R*R);
  let lox = R, loy = R, hix = -1, hiy = -1;
  for (let i = 0; i < R*R; i++){ const on = A[i*4+3] > 127; bin[i] = on ? 1 : 0; inv[i] = on ? 0 : 1; if (on){ const x = i % R, y = (i / R) | 0; if (x<lox)lox=x; if (x>hix)hix=x; if (y<loy)loy=y; if (y>hiy)hiy=y; } }
  const din = chamfer(bin, R, R), dout = chamfer(inv, R, R);
  const sd = new Float32Array(R*R); for (let i = 0; i < R*R; i++) sd[i] = (dout[i] - din[i]);
  const bw = hix - lox + 1, bh = hiy - loy + 1, Sc = Math.max(bw, bh) / 0.92;
  const ox = 0.5 - bw / Sc / 2, oy = 0.5 - bh / Sc / 2;
  const toPx = (x, y) => [lox + (x - ox) * Sc, hiy - (y - oy) * Sc];
  const sample = (px, py) => {
    const X = Math.max(0, Math.min(R - 1.001, px)), Y = Math.max(0, Math.min(R - 1.001, py));
    const x0 = X | 0, y0 = Y | 0, fx = X - x0, fy = Y - y0;
    const a = sd[y0*R+x0], b = sd[y0*R+x0+1], c2 = sd[(y0+1)*R+x0], d2 = sd[(y0+1)*R+x0+1];
    return (a*(1-fx) + b*fx)*(1-fy) + (c2*(1-fx) + d2*fx)*fy;
  };
  return {
    sd: (x, y) => { const p = toPx(x, y); return sample(p[0], p[1]) / Sc; },
    grad: (x, y) => { const p = toPx(x, y), e = 3.0; const gx = sample(p[0]+e, p[1]) - sample(p[0]-e, p[1]), gy = sample(p[0], p[1]-e) - sample(p[0], p[1]+e); const L = Math.hypot(gx, gy) || 1; return [gx/L, gy/L]; },
    inside: (x, y) => { const p = toPx(x, y); return sample(p[0], p[1]) < -Sc * 0.02; },
    off: 0
  };
}

const alphaCache = {};
async function maskAlpha(url){
  if (alphaCache[url]) return alphaCache[url];
  const bmp = await createImageBitmap(await (await fetch(url)).blob());
  const cv = new OffscreenCanvas(R, R), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  return (alphaCache[url] = g.getImageData(0, 0, R, R).data);
}

self.onmessage = async (e) => {
  try {
    const S = Object.assign({ fixGlyph: true, layer: true, cells: 25, fluff: 100, depth: 42, gap: 40, dome: 40, res: 0.6, reach: 0.09 }, e.data);
    /* resolved next to this file: a relative URL in a worker resolves from
       the worker script, not the page (cost a run in Study 19) */
    S.mask = new URL(S.mask || 'masks/arial-black.png', import.meta.url).href;
    const t0 = performance.now();
    const glyph = glyphFromAlpha(await maskAlpha(S.mask));
    const D = (S.depth / 100) * 0.9;
    const { pts, u } = seeds3(S.seed, D, glyph.inside);
    if (S.layer) for (const p of pts) p[2] = D / 2;        /* 2D: one layer of stones (Study 16). Study 20: layer:false = seeds through the depth, a 3D Voronoi */
    const n = S.cells, h = (S.gap / 100) * 0.05 / 2, fl = S.fluff / 100, dm = S.dome / 100;
    const probe = []; for (let i = 0; i < n; i++) probe.push(buildCell(i, pts, n, h, 0, D));
    const col = assignColours(probe, u, PALETTE.length);
    glyph.off = 2 * h;
    /* every stone's field first, so each can be shaded by the others */
    const cells = [];
    for (let i = 0; i < n; i++){
      const p = probe[i]; if (!p || p.size < 4 * h + 0.01) continue;
      const r = fl * Math.min(0.5 * p.size, 0.18);
      const field = { planes: p.planes.map(pl => ({ n: pl.n, d: pl.d - r })), lo: p.lo, hi: p.hi };
      /* Study 20 fix: cellSDF moves every face in by r (pl.d − r) and then
         rounds back out by r, but cuts the glyph at sd + off − r — not moved
         in. So every stone ended r OUTSIDE the letter (measured: 46% of the
         stone silhouette outside the J at fluff 100). Inherited from
         brand-lab's solid-app.js; fixed here by handing each cell a glyph
         moved in by its own r, without editing the copied solid-geometry.js. */
      const g = S.fixGlyph ? { sd: (x, y) => glyph.sd(x, y) + r, grad: glyph.grad, inside: glyph.inside, off: glyph.off } : glyph;
      cells.push({ i, p, r, f: cellSDF(field, r, g, 7 / Math.max(r, 0.01), dm) });
    }
    self.postMessage({ type: 'start', count: cells.length });
    const sizes = [];
    for (const c of cells){
      const { p, r, f } = c;
      const pad = r * dm + 0.02;
      const lo = p.lo.map(v => v - pad), hi = p.hi.map(v => v + pad);
      const ext = Math.max(...[0,1,2].map(a => hi[a]-lo[a]));
      const res = Math.round((40 + 24 * Math.min(1, ext)) * S.res);
      const N = [0,1,2].map(a => Math.max(8, Math.round(res * (hi[a]-lo[a]) / ext)));
      const mesh = surfaceNets(f, lo, hi, N);
      if (!mesh.idx.length) continue;
      /* occlusion from the neighbours' fields: only stones whose box comes
         within reach can shade this one */
      const near = cells.filter(o => o !== c && o.p.lo.every((v, a) => v < hi[a] + S.reach) && o.p.hi.every((v, a) => v > lo[a] - S.reach));
      const vc = mesh.pos.length / 3, ao = new Uint8Array(vc);
      for (let k = 0; k < vc; k++){
        const x = mesh.pos[k*3], y = mesh.pos[k*3+1], z = mesh.pos[k*3+2];
        const nx = mesh.nrm[k*3], ny = mesh.nrm[k*3+1], nz = mesh.nrm[k*3+2];
        /* sample a little way out along the normal: is another stone there? */
        let open = 1;
        for (const o of near){
          for (const t of [0.25, 0.6, 1.0]){
            const s = S.reach * t, d = o.f(x + nx*s, y + ny*s, z + nz*s);
            open = Math.min(open, Math.max(0, d / s));
          }
        }
        /* calibrated against Study 18's ray-cast occlusion on the same J
           (bake/equiv.html, least squares): rays ≈ 0.221 + 0.793·open.
           Raw, this read 0.40 mean vs the rays' 0.54 (rmse 0.22 → 0.15). */
        ao[k] = Math.round(255 * Math.min(1, 0.221 + 0.793 * open));
      }
      const pos = new Float32Array(vc * 3);
      for (let k = 0; k < vc; k++){
        pos[k*3] = mesh.pos[k*3] * SIDE - SIDE/2; pos[k*3+1] = mesh.pos[k*3+1] * SIDE; pos[k*3+2] = mesh.pos[k*3+2] * SIDE - SIDE * D / 2;
      }
      sizes.push(+p.size.toFixed(3));
      /* how deep in the J this stone sits (glyph distance at its seed; ~0 = on
         the outline): the page drops two small edge stones on the floor */
      const edge = +glyph.sd(pts[c.i][0], pts[c.i][1]).toFixed(4);
      self.postMessage({ type: 'piece', i: c.i, colour: PALETTE[col[c.i]], size: p.size, edge, pos, nrm: mesh.nrm, idx: mesh.idx, ao }, [pos.buffer, mesh.nrm.buffer, mesh.idx.buffer, ao.buffer]);
    }
    self.postMessage({ type: 'done', ms: Math.round(performance.now() - t0), sizes });
  } catch (err) { self.postMessage({ type: 'error', message: String(err && err.stack || err) }); }
};
