/* The 3D procedure, as a module.

   Everything here is pure - no DOM, no three.js - so `node test.mjs` can
   hold it to the same standard as the flat tool's pure block. The app
   (solid-app.js) imports it; the glyph field it consumes in Letter mode is
   injected by the caller, since rasterising a font needs a canvas.

   The chain: seeds3 (best-candidate, prefix-stable) -> buildCell (a box
   clipped by a bisecting half-space per other seed, the gap built into the
   clip, true neighbours read off the SURVIVING faces) -> cellSDF (the C2
   P-norm superellipsoid blend settled by the adversarial review - see the
   comment on it) -> surfaceNets (meshing with exact-gradient normals). */

/* ===================== the procedure, in three dimensions =====================
   Same idea as the flat tool: a seed string → points → Voronoi cells → a
   gap → rounded corners. In 2D a cell is a square clipped by a half-plane per
   other seed; here it is a box clipped by a half-space per other seed. The
   gap is built into the clip (each plane sits gap/2 nearer its own seed than
   the true bisector), so the grout is exactly even everywhere. In Letter
   mode the box is also cut by the glyph, and the seeds live inside its ink. */

function xmur3(str){
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++){ h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return function(){ h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
}
function mulberry32(a){
  return function(){ let t = (a += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const MAXN = 60;
/* best-candidate, prefix-stable: adding cells never moves the ones you have.
   `inside(x, y)` restricts the xy footprint (the glyph); depth D is the box. */
function seeds3(seedString, D, inside){
  const rng = mulberry32(xmur3(seedString)()), pts = [], u = [], lo = 0.08, span = 0.84;
  for (let i = 0; i < MAXN; i++){
    let best = null, bestD = -1;
    for (let c = 0; c < 14; c++){
      let p = null;
      for (let t = 0; t < 40 && !p; t++){
        const q = [lo + rng() * span, lo + rng() * span, D * (lo + rng() * span)];
        if (!inside || inside(q[0], q[1])) p = q;
      }
      if (!p) p = [lo + rng() * span, lo + rng() * span, D * (lo + rng() * span)];
      let d = Infinity;
      for (const q of pts){ const dd = (p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2; if (dd < d) d = dd; }
      if (d > bestD){ bestD = d; best = p; }
    }
    pts.push(best); u.push(rng());
  }
  return { pts, u };
}

const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub = (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dist2 = (a,b) => (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;

/* Convex polyhedron clipping (Sutherland–Hodgman per face, plus the cap).
   inside = n·p − d ≤ 0. */
function clipFace(poly, n, d){
  const out = [], m = poly.length;
  for (let i = 0; i < m; i++){
    const A = poly[i], B = poly[(i + 1) % m];
    const a = dot(n, A) - d, b = dot(n, B) - d;
    if (a <= 0) out.push(A);
    if ((a < 0 && b > 0) || (a > 0 && b < 0)){
      const t = a / (a - b);
      out.push([A[0] + (B[0]-A[0]) * t, A[1] + (B[1]-A[1]) * t, A[2] + (B[2]-A[2]) * t]);
    }
  }
  return out;
}
/* faces carry the id of the plane they lie on, so that when clipping is
   finished the SURVIVING faces say who the true neighbours are — a plane
   that cut the box early and was then clipped away entirely is not a
   neighbour, and the area of what survives is how much the two touch */
function clipPolyhedron(faces, n, d, tag){
  const kept = [], capPts = [];
  for (const f of faces){
    const c = clipFace(f.pts, n, d);
    if (c.length >= 3){
      kept.push({ pts: c, tag: f.tag });
      for (const p of c){ if (Math.abs(dot(n, p) - d) < 1e-9) capPts.push(p); }
    }
  }
  if (!kept.length) return { faces: [] };
  if (capPts.length >= 3){
    const c = [0,0,0]; for (const p of capPts){ c[0]+=p[0]; c[1]+=p[1]; c[2]+=p[2]; }
    c[0]/=capPts.length; c[1]/=capPts.length; c[2]/=capPts.length;
    const ax = Math.abs(n[0]) < 0.9 ? [1,0,0] : [0,1,0];
    const u = cross(n, ax), v = cross(n, u);
    const pts = capPts.map(p => ({ p, a: Math.atan2(dot(sub(p,c), v), dot(sub(p,c), u)) })).sort((a,b) => a.a - b.a);
    const cap = []; for (const q of pts){ if (!cap.length || dist2(cap[cap.length-1], q.p) > 1e-14) cap.push(q.p); }
    if (cap.length >= 3) kept.push({ pts: cap, tag });
  }
  return { faces: kept };
}
function polyArea3(poly){
  let a = 0;
  for (let k = 1; k + 1 < poly.length; k++){ const c = cross(sub(poly[k], poly[0]), sub(poly[k+1], poly[0])); a += Math.hypot(...c) / 2; }
  return a;
}
function boxFaces(D){
  const V = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,D],[1,0,D],[1,1,D],[0,1,D]];
  return [[0,3,2,1],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,4,7,3]].map((f, k) => ({ pts: f.map(i => V[i].slice()), tag: -1 - k }));
}

/* One cell. `shrink` is how far every plane is pulled in beyond the gap —
   the rounding radius — so that the rounded surface lands back exactly on
   the gap. Returns the polytope's faces (oriented outward, with per-edge
   data), its planes, bounds and true neighbours. */
function buildCell(i, pts, n, h, shrink, D, boundaryGap = h){
  const planes = [];
  for (let axis = 0; axis < 3; axis++) for (const s of [1,-1]){
    const nn = [0,0,0]; nn[axis] = s;
    const ext = axis === 2 ? D : 1;
    planes.push({ n: nn, d: (s > 0 ? ext - boundaryGap : -boundaryGap) - shrink, j: -1 });
  }
  for (let j = 0; j < n; j++){
    if (j === i) continue;
    const dv = sub(pts[j], pts[i]), L = Math.hypot(...dv);
    if (L < 1e-9) continue;
    const nn = [dv[0]/L, dv[1]/L, dv[2]/L];
    const co = [pts[i][0] + nn[0]*(L/2 - h), pts[i][1] + nn[1]*(L/2 - h), pts[i][2] + nn[2]*(L/2 - h)];
    planes.push({ n: nn, d: dot(nn, co) - shrink, j });
  }
  /* start from a box a little larger than the domain and clip with EVERY
     plane, walls included: the walls sit a gap (and the rounding radius)
     inside the domain, and the faces must agree with the planes exactly or
     the distance field tears along the outer cells */
  let faces = boxFaces(D).map(f => ({ pts: f.pts.map(p => [p[0] * 1.2 - 0.1, p[1] * 1.2 - 0.1, p[2] * 1.2 - 0.1 * D]), tag: f.tag }));
  for (let k = 0; k < planes.length; k++){
    faces = clipPolyhedron(faces, planes[k].n, planes[k].d, k).faces;
    if (!faces.length) return null;
  }
  /* who survived: the planes that still own a face are the cell's planes
     and its neighbours; everyone else was clipped away */
  const alive = {}, used = [], nbrs = [], touch = {};
  for (const f of faces) alive[f.tag] = (alive[f.tag] || 0) + polyArea3(f.pts);
  for (let k = 0; k < planes.length; k++){
    const pl = planes[k];
    if (pl.j < 0){ used.push(pl); continue; }
    if (alive[k]){ used.push(pl); nbrs.push(pl.j); touch[pl.j] = alive[k]; }
  }
  const lo = [1e9,1e9,1e9], hi = [-1e9,-1e9,-1e9], cen = [0,0,0]; let cnt = 0;
  for (const f of faces) for (const p of f.pts){ for (let k = 0; k < 3; k++){ lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); cen[k] += p[k]; } cnt++; }
  cen[0]/=cnt; cen[1]/=cnt; cen[2]/=cnt;
  /* face records for the exact distance: outward normal, offset, edges */
  const F = [];
  for (const face of faces){
    const poly = face.pts;
    let nn = [0,0,0];
    for (let k = 0; k < poly.length; k++){ const a = poly[k], b = poly[(k+1)%poly.length];
      nn[0] += (a[1]-b[1])*(a[2]+b[2]); nn[1] += (a[2]-b[2])*(a[0]+b[0]); nn[2] += (a[0]-b[0])*(a[1]+b[1]); }
    const L = Math.hypot(...nn); if (L < 1e-14) continue;
    nn = [nn[0]/L, nn[1]/L, nn[2]/L];
    const fc = [0,0,0]; for (const p of poly){ fc[0]+=p[0]; fc[1]+=p[1]; fc[2]+=p[2]; } fc[0]/=poly.length; fc[1]/=poly.length; fc[2]/=poly.length;
    if (dot(nn, sub(fc, cen)) < 0) nn = [-nn[0], -nn[1], -nn[2]];
    const d = dot(nn, fc);
    /* per edge: the in-plane outward normal of the edge, for the inside test */
    const edges = [];
    for (let k = 0; k < poly.length; k++){
      const a = poly[k], b = poly[(k+1)%poly.length];
      const e = sub(b, a), L2 = dot(e, e); if (L2 < 1e-16) continue;
      let en = cross(e, nn); const eL = Math.hypot(...en) || 1; en = [en[0]/eL, en[1]/eL, en[2]/eL];
      if (dot(en, sub(fc, a)) > 0) en = [-en[0], -en[1], -en[2]];
      edges.push({ a, e, L2, en, ed: dot(en, a) });
    }
    F.push({ n: nn, d, edges });
  }
  return { planes: used, faces: F, lo, hi, nbrs, touch, size: Math.min(hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]) };
}

/* ===================== the soft surface =====================
   Three fields came before this one and Divya read every one of them as
   "random curves and edges": a pushed-out soft-max (creased balloon), then
   the true Euclidean offset of the polytope — a perfect fillet, but only C1:
   curvature jumps from zero on the face to 1/r at the band's edge, three
   fillet tubes meet at a corner in a ridge, and polished shading draws
   every curvature jump as a line. An adversarial review of three routes
   (grid diffusion, analytic C2 field, mesh subdivision) settled it: the
   cause is curvature continuity, and the cure is a field that is C2.

   The P-norm blend. S_i = n_i·p − d_i is the distance beyond plane i, the
   planes already pulled in by r. F = (Σ max(0,S_i)^P)^(1/P) − r. On a flat
   region only one term is live, so S = r exactly — the surface sits ON the
   gap line, no compensation needed. Where several are live they blend as
   one superellipsoid of radius r, the SAME r at every dihedral angle, and
   each term enters with ∂F/∂S ∝ S^(P−1) and ∂²F/∂S² ∝ S^(P−2): for P = 3
   both vanish at the face boundary. No band edge, and a corner is one
   superellipsoid octant rather than three tubes — nothing to ridge. Large r
   makes the whole cell one superellipsoid: the pillow. A small dome term
   bulges the middle of big faces that r alone would leave flat. Measured:
   curvature jumps 14–20× below the Euclidean fillet's. Exact gradient. */
function cellSDF(cell, r, glyph, gk, dome){
  const P = 3, PL = cell.planes, N = PL.length;
  const c = [(cell.lo[0]+cell.hi[0])/2, (cell.lo[1]+cell.hi[1])/2, (cell.lo[2]+cell.hi[2])/2];
  const R2 = ((cell.hi[0]-cell.lo[0])**2 + (cell.hi[1]-cell.lo[1])**2 + (cell.hi[2]-cell.lo[2])**2) / 4 + 1e-12;
  const S = new Float64Array(N);
  return function(x, y, z, grad){
    let m = -Infinity, mi = 0, sum = 0;
    for (let i = 0; i < N; i++){
      const pl = PL[i], s = pl.n[0]*x + pl.n[1]*y + pl.n[2]*z - pl.d;
      S[i] = s; if (s > m){ m = s; mi = i; }
      if (s > 0) sum += s * s * s;
    }
    let v, gx, gy, gz;
    if (sum > 0){
      const out = Math.cbrt(sum);
      v = out - r;
      const k = 1 / (out * out);                 /* out^(1−P) */
      gx = gy = gz = 0;
      for (let i = 0; i < N; i++){ const s = S[i]; if (s <= 0) continue; const w = s * s * k; const n = PL[i].n; gx += w*n[0]; gy += w*n[1]; gz += w*n[2]; }
    } else {
      v = m - r; const n = PL[mi].n; gx = n[0]; gy = n[1]; gz = n[2];
    }
    if (dome > 0){
      const dx = x - c[0], dy = y - c[1], dz = z - c[2];
      const t = 1 - (dx*dx + dy*dy + dz*dz) / R2;
      if (t > 0){ v -= dome * r * t * t; const dt = dome * r * 2 * t * (2 / R2); gx += dt*dx; gy += dt*dy; gz += dt*dz; }
    }
    if (glyph){
      /* Letter: intersect with the extruded glyph. The glyph is a 2D signed
         distance (negative in the ink); its cut is held the gap away from
         the outline like every other cut and rounded by the same r. A
         smooth-max (C∞) joins the two, so the join stays smooth. */
      const gd = glyph.sd(x, y) + glyph.off - r, k = gk;
      const mx = Math.max(v, gd), e1 = Math.exp(k * (v - mx)), e2 = Math.exp(k * (gd - mx)), sm = e1 + e2;
      if (grad){
        const g2 = glyph.grad(x, y), w1 = e1 / sm, w2 = e2 / sm;
        grad[0] = w1*gx + w2*g2[0]; grad[1] = w1*gy + w2*g2[1]; grad[2] = w1*gz;
      }
      return mx + Math.log(sm) / k;
    }
    if (grad){ grad[0] = gx; grad[1] = gy; grad[2] = gz; }
    return v;
  };
}

/* naive surface nets: one vertex per sign-changing grid cube, a quad per
   sign-changing grid edge. Short, robust, smooth on a smooth field. */
function surfaceNets(f, lo, hi, N){
  const nx = N[0], ny = N[1], nz = N[2];
  const sx = (hi[0]-lo[0]) / nx, sy = (hi[1]-lo[1]) / ny, sz = (hi[2]-lo[2]) / nz;
  const grid = new Float32Array((nx+1)*(ny+1)*(nz+1));
  const gi = (x,y,z) => (z*(ny+1) + y)*(nx+1) + x;
  for (let z = 0; z <= nz; z++) for (let y = 0; y <= ny; y++) for (let x = 0; x <= nx; x++)
    grid[gi(x,y,z)] = f(lo[0] + x*sx, lo[1] + y*sy, lo[2] + z*sz, null);
  const vidx = new Int32Array(nx*ny*nz).fill(-1);
  const ci = (x,y,z) => (z*ny + y)*nx + x;
  const pos = [], nrm = [], idx = [], g = [0,0,0];
  const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const C = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++){
    const v = C.map(c => grid[gi(x+c[0], y+c[1], z+c[2])]);
    let mask = 0; for (let i = 0; i < 8; i++) if (v[i] < 0) mask |= 1 << i;
    if (mask === 0 || mask === 255) continue;
    let px = 0, py = 0, pz = 0, cnt = 0;
    for (const [a,b] of E){
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      px += C[a][0] + (C[b][0]-C[a][0]) * t; py += C[a][1] + (C[b][1]-C[a][1]) * t; pz += C[a][2] + (C[b][2]-C[a][2]) * t; cnt++;
    }
    let X = lo[0] + (x + px/cnt) * sx, Y = lo[1] + (y + py/cnt) * sy, Z = lo[2] + (z + pz/cnt) * sz;
    /* one Newton step along the gradient pulls the vertex onto the exact
       surface — surface nets alone leave it at the cell's average crossing,
       which on a curved fillet is slightly inside and reads as facets */
    const d0 = f(X, Y, Z, g); X -= g[0]*d0; Y -= g[1]*d0; Z -= g[2]*d0;
    vidx[ci(x,y,z)] = pos.length / 3;
    pos.push(X, Y, Z);
    f(X, Y, Z, g); const L = Math.hypot(g[0],g[1],g[2]) || 1; nrm.push(g[0]/L, g[1]/L, g[2]/L);
  }
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++){
    const v0 = grid[gi(x,y,z)];
    const tryEdge = (vb, cells) => {
      if ((v0 < 0) === (vb < 0)) return;
      const ids = cells.map(c => (c[0] < 0 || c[1] < 0 || c[2] < 0) ? -1 : vidx[ci(c[0],c[1],c[2])]);
      if (ids.some(i => i < 0)) return;
      if (v0 < 0){ idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]); }
      else        { idx.push(ids[0], ids[3], ids[2], ids[0], ids[2], ids[1]); }
    };
    if (x < nx) tryEdge(grid[gi(x+1,y,z)], [[x,y-1,z-1],[x,y,z-1],[x,y,z],[x,y-1,z]]);
    if (y < ny) tryEdge(grid[gi(x,y+1,z)], [[x-1,y,z-1],[x-1,y,z],[x,y,z],[x,y,z-1]]);
    if (z < nz) tryEdge(grid[gi(x,y,z+1)], [[x-1,y-1,z],[x,y-1,z],[x,y,z],[x-1,y,z]]);
  }
  return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), idx: new Uint32Array(idx) };
}


function assignColours(cells, u, palLen){
  const col = new Array(cells.length).fill(-1);
  const order = cells.map((c, i) => i).filter(i => cells[i]).sort((a, b) => cells[b].nbrs.length - cells[a].nbrs.length);
  /* weighted by shared-face area: when a clash is unavoidable it should
     land where two cells barely touch, not across a broad face */
  const clashes = (i, c) => cells[i].nbrs.reduce((a, j) => a + (col[j] === c ? 0.002 + (cells[i].touch[j] || 0) : 0), 0);
  const choose = i => {
    const base = Math.floor(u[i] * palLen) % palLen;
    let best = base, bestN = Infinity;
    for (let k = 0; k < palLen; k++){ const c = (base + k) % palLen, nn = clashes(i, c); if (nn < bestN){ bestN = nn; best = c; } if (nn === 0) break; }
    return best;
  };
  for (const i of order) col[i] = choose(i);
  for (let pass = 0; pass < 3; pass++){
    let moved = false;
    for (const i of order){ if (clashes(i, col[i]) > 0){ const c = choose(i); if (c !== col[i]){ col[i] = c; moved = true; } } }
    if (!moved) break;
  }
  return col;
}


export { MAXN, seeds3, clipFace, clipPolyhedron, polyArea3, boxFaces, buildCell, cellSDF, surfaceNets, assignColours };
