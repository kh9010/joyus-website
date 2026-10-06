/* The construction site, Study 22.
   Divya on Study 21: better sign; no cones; the pillar isn't right; no
   UNDER CONSTRUCTION plate; Joyus colours; Joyus materials.
   - colours: the brand palette (brand-lab), ink for line work; no orange;
   - the stand: what a road-works sign really stands on — low, a spring
     stand: two legs splayed to the sides and one back, a coil spring, a
     short mast into the diamond's bottom corner (Study 21 had a tall pole);
   - materials: the brand's material is the Voronoi stone. Three ways to
     make the sign of it, switchable (?sign=):
       soft   — one inflated diamond, the worker drawn on it
       stones — the diamond built of Voronoi stones (the J's builder), worker drawn on
       worker — a soft diamond, the worker himself built of stones (failed:
                Voronoi breaks his silhouette, twice)
       pile   — a soft diamond, the worker in ink, digging a pile of stones */

export const PAL = { pink: '#f25aa3', purple: '#7d55d4', cyan: '#2fc0d8', yellow: '#f5c63c', ink: '#2C3544' };
const INK = PAL.ink;

/* ---------- drawn parts ---------- */

/* the worker (Study 21's, unchanged): bent forward, shovel into a pile.
   k thickens every stroke — the stone version needs room for stones. */
export function drawWorker(g, S, k = 1, { pile = true, figure = true } = {}) {
  const u = S / 1024, P = (x, y) => [x * u, y * u];
  g.save();
  g.fillStyle = g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (w, ...pts) => { g.lineWidth = w * u * k; g.beginPath(); g.moveTo(...P(...pts[0])); for (const p of pts.slice(1)) g.lineTo(...P(...p)); g.stroke(); };
  if (pile) { g.beginPath(); g.moveTo(...P(150, 790));
    g.bezierCurveTo(...P(190, 640), ...P(330, 600), ...P(420, 660));
    g.bezierCurveTo(...P(470, 700), ...P(500, 760), ...P(510, 790)); g.closePath(); g.fill(); }
  if (!figure) { g.restore(); return; }
  line(64, [612, 560], [668, 668], [712, 784]);
  line(64, [612, 560], [566, 676], [576, 784]);
  line(30, [690, 784], [750, 784]); line(30, [556, 784], [612, 784]);
  line(92, [612, 560], [492, 420]);
  g.beginPath(); g.arc(...P(430, 352), 60 * u * Math.min(k, 1.25), 0, Math.PI * 2); g.fill();
  line(26, [560, 410], [318, 690]);
  g.beginPath(); g.moveTo(...P(262, 664)); g.lineTo(...P(340, 662)); g.lineTo(...P(326, 742)); g.lineTo(...P(270, 736)); g.closePath(); g.fill();
  line(44, [500, 430], [486, 488]);
  line(44, [520, 452], [470, 540], [402, 592]);
  g.restore();
}
/* the art on the diamond's face. The decal is turned −45° in three.js
   (clockwise), so the worker is drawn turned the other way (canvas
   rotate(−45°)) to stand upright on the sign — as in Study 21, checked on screen. */
export function drawFace(cv, { border = true, worker = true, pile = true } = {}) {
  const S = cv.width, g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  if (border) { g.strokeStyle = INK; g.lineWidth = S * 0.04; g.lineJoin = 'round'; roundRect(g, S * 0.07, S * 0.07, S * 0.86, S * 0.86, S * 0.08); g.stroke(); }
  if (worker) { g.save(); faceTransform(g, S); drawWorker(g, S, 1, { pile }); g.restore(); }
}
/* the worker's place on the face: shared by drawFace and pileOnFace */
function faceTransform(g, S) {
  g.translate(S / 2, S / 2); g.rotate(-Math.PI / 4); g.translate(-S / 2, -S / 2);
  g.translate(S * 0.5, S * 0.56); g.scale(0.98, 0.98); g.translate(-S * 0.45, -S * 0.54);
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* masks for the stone builder (320px, ink on transparent, as data URLs) */
export function maskDiamond() {
  const R = 320, cv = document.createElement('canvas'); cv.width = cv.height = R; const g = cv.getContext('2d');
  g.translate(R / 2, R / 2); g.rotate(Math.PI / 4); g.fillStyle = '#000';
  roundRect(g, -R * 0.3, -R * 0.3, R * 0.6, R * 0.6, R * 0.05); g.fill();
  return cv.toDataURL('image/png');
}
/* D · the pile, for stones, and where it sits on the face. Try 1 and 2
   worked its position out by hand from drawFace's transforms and it landed
   small and off (img/try1-pile, try2-pile). Now: draw the pile with drawFace's
   own transforms on a 320 canvas, read its box from the pixels, and hand back
   the mask plus the box centre and size in the face plane (before the plane's
   −45° turn; the caller turns the stones with the plane, like the decal). */
export function pileOnFace(D) {
  const R = 320, cv = document.createElement('canvas'); cv.width = cv.height = R; const g = cv.getContext('2d');
  faceTransform(g, R);
  drawWorker(g, R, 1, { figure: false });
  const A = g.getImageData(0, 0, R, R).data;
  let lox = R, loy = R, hix = -1, hiy = -1;
  for (let i = 0; i < R * R; i++) if (A[i * 4 + 3] > 127) { const x = i % R, y = (i / R) | 0; lox = Math.min(lox, x); hix = Math.max(hix, x); loy = Math.min(loy, y); hiy = Math.max(hiy, y); }
  const cx = (lox + hix + 1) / 2, cy = (loy + hiy + 1) / 2;
  return { mask: cv.toDataURL('image/png'), x: (cx / R - 0.5) * D, y: (0.5 - cy / R) * D, w: (hix - lox + 1) / R * D, h: (hiy - loy + 1) / R * D, span: Math.max(hix - lox + 1, hiy - loy + 1) / R * D };
}
export function maskWorker(k = 1.7) {
  const R = 320, cv = document.createElement('canvas'); cv.width = cv.height = R; const g = cv.getContext('2d');
  drawWorker(g, R, k);
  return cv.toDataURL('image/png');
}

/* ---------- 3D ---------- */

export function solid(THREE, geo, hex, parts) {
  if (!geo.attributes.ao) geo.setAttribute('ao', new THREE.Uint8BufferAttribute(new Uint8Array(geo.attributes.position.count).fill(255), 1, true));
  const m = new THREE.Mesh(geo); m.userData.colour = new THREE.Color(hex); m.userData.hex = hex;
  parts.push(m); return m;
}
export function decal(THREE, cv, w, h) {
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
}

export const SIGN = { D: 0.62, CORNER: 0.44 };            // diamond side; its bottom corner's height
SIGN.CY = SIGN.CORNER + SIGN.D * Math.SQRT1_2;           // its centre
SIGN.TOP = SIGN.CORNER + SIGN.D * Math.SQRT2;

/* the spring stand, foot at y = 0, facing +z */
export function buildStand(THREE, RoundedBoxGeometry, parts) {
  const stand = new THREE.Group(), C = PAL.purple;
  const rod = (len, w, hex) => solid(THREE, new RoundedBoxGeometry(w, len, w, 4, w * 0.48), hex, parts);
  const HUB = 0.1;
  // hub
  const hub = solid(THREE, new RoundedBoxGeometry(0.1, 0.07, 0.08, 4, 0.03), C, parts); hub.position.y = HUB; stand.add(hub);
  // legs: two out to the sides, one back; each a rod from the hub to its foot, with a rubber foot
  for (const [fx, fz] of [[-0.36, 0.04], [0.36, 0.04], [0, -0.3]]) {
    const a = new THREE.Vector3(0, HUB, 0), b = new THREE.Vector3(fx, 0.02, fz), mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a);
    const leg = rod(dir.length(), 0.032, C); leg.position.copy(mid);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); stand.add(leg);
    const foot = solid(THREE, new RoundedBoxGeometry(0.08, 0.025, 0.06, 3, 0.012), INK, parts); foot.position.set(fx, 0.0125, fz); stand.add(foot);
  }
  // the spring: a coil from the hub up to the mast
  const S0 = HUB + 0.035, S1 = 0.3, turns = 6;
  const helix = new THREE.Curve(); helix.getPoint = (t, v = new THREE.Vector3()) => v.set(0.028 * Math.cos(t * turns * Math.PI * 2), S0 + (S1 - S0) * t, 0.028 * Math.sin(t * turns * Math.PI * 2));
  stand.add(solid(THREE, new THREE.TubeGeometry(helix, 160, 0.008, 8, false), INK, parts));
  // the mast: from the spring up behind the sign to its centre
  const mast = rod(SIGN.CY - S1 + 0.04, 0.036, C); mast.position.set(0, (S1 + SIGN.CY) / 2, -0.03); stand.add(mast);
  return stand;
}

/* A · soft: one inflated diamond, art drawn on */
export function buildSoftDiamond(THREE, RoundedBoxGeometry, parts, { worker = true, pile = true } = {}) {
  const g = new THREE.Group(), D = SIGN.D, T = 0.09;
  const body = solid(THREE, new RoundedBoxGeometry(D, D, T, 8, T * 0.48), PAL.yellow, parts);
  body.rotation.z = Math.PI / 4; g.add(body);
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024; drawFace(cv, { worker, pile });
  const d = decal(THREE, cv, D, D); d.position.z = T / 2 + 0.003; d.rotation.z = -Math.PI / 4; g.add(d);
  g.position.set(0, SIGN.CY, 0.02); g.userData.front = T / 2;
  return g;
}

/* stones from the J's builder → meshes centred on 0, scaled to `span` (the
   mask's larger side), with each stone's home kept for assembly */
export function stonesGroup(THREE, pieces, span, palette) {
  const g = new THREE.Group(), k = span / (1.6 * 0.92), meshes = [];
  let zMax = -Infinity;
  for (const d of pieces) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(d.nrm, 3));
    geo.setAttribute('ao', new THREE.BufferAttribute(d.ao, 1, true));
    geo.setIndex(new THREE.BufferAttribute(d.idx, 1));
    geo.translate(0, -0.8, 0); geo.scale(k, k, k);
    geo.computeBoundingBox(); zMax = Math.max(zMax, geo.boundingBox.max.z);
    const m = new THREE.Mesh(geo); const hex = palette ? palette(d) : d.colour;
    m.userData.colour = new THREE.Color(hex); m.userData.hex = hex;
    g.add(m); meshes.push(m);
  }
  g.userData.front = zMax; g.userData.meshes = meshes;
  return g;
}
