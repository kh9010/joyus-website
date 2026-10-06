/* The construction site, Study 21: what's actually used on a road works
   site, not Study 19's striped barrier.
   - a diamond road-works sign: orange, black border, the digging-worker
     symbol (the work-zone warning sign), on a folding sign stand, with a
     plate under it: UNDER CONSTRUCTION;
   - traffic cones: orange with two white bands, on a square black base.
   Everything solid is real geometry, coloured per part, so each look shades
   it like the stones; the symbol, border and words are drawn on a canvas
   and laid over the face, unlit, so they read in every look. */

export const ORANGE = '#F07D1E', CONE_WHITE = '#F4F1EA', INK = '#1F2630', METAL = '#5E6773';

/* ---------- the drawn parts (canvas, also used by art.html) ---------- */

/* the worker: bent well forward, driving a shovel into a pile of earth.
   Try 1 stood him upright, small, legs crossed, over a sliver of a pile
   (img/try1-worker.png); on the real sign he fills the diamond. */
export function drawWorker(g, S) {
  const u = S / 1024, P = (x, y) => [x * u, y * u];
  g.save();
  g.fillStyle = g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (w, ...pts) => { g.lineWidth = w * u; g.beginPath(); g.moveTo(...P(...pts[0])); for (const p of pts.slice(1)) g.lineTo(...P(...p)); g.stroke(); };
  // the pile: a big low mound, bottom left
  g.beginPath(); g.moveTo(...P(150, 790));
  g.bezierCurveTo(...P(190, 640), ...P(330, 600), ...P(420, 660));
  g.bezierCurveTo(...P(470, 700), ...P(500, 760), ...P(510, 790)); g.closePath(); g.fill();
  // legs: hips back and high, knees bent, feet apart
  line(64, [612, 560], [668, 668], [712, 784]);
  line(64, [612, 560], [566, 676], [576, 784]);
  line(30, [690, 784], [750, 784]); line(30, [556, 784], [612, 784]);       // boots
  // body, bent forward to the left
  line(92, [612, 560], [492, 420]);
  // head, low and forward
  g.beginPath(); g.arc(...P(430, 352), 60 * u, 0, Math.PI * 2); g.fill();
  // the shovel: handle from behind his shoulder down into the pile, blade buried
  line(26, [560, 410], [318, 690]);
  g.beginPath(); g.moveTo(...P(262, 664)); g.lineTo(...P(340, 662)); g.lineTo(...P(326, 742)); g.lineTo(...P(270, 736)); g.closePath(); g.fill();
  // arms: one hand high on the handle, one low
  line(44, [500, 430], [486, 488]);
  line(44, [520, 452], [470, 540], [402, 592]);
  g.restore();
}

/* the diamond: a black border just inside the edge, the worker in the middle.
   Drawn upright as a square; the mesh is turned 45° to make the diamond, so
   the worker is drawn turned −45° to stand upright on the sign. */
export function drawDiamond(cv) {
  const S = cv.width, g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  const inset = S * 0.055, r = S * 0.07;
  g.strokeStyle = INK; g.lineWidth = S * 0.035; g.lineJoin = 'round';
  roundRect(g, inset, inset, S - 2 * inset, S - 2 * inset, r); g.stroke();
  g.save(); g.translate(S / 2, S / 2); g.rotate(-Math.PI / 4); g.translate(-S / 2, -S / 2);
  g.translate(S * 0.5, S * 0.56); g.scale(0.98, 0.98); g.translate(-S * 0.45, -S * 0.54);   // centre the figure (it spans x 150–750, y 290–790)
  drawWorker(g, S);
  g.restore();
}

/* the plate under it */
export function drawPlate(cv, words = ['UNDER', 'CONSTRUCTION']) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.strokeStyle = INK; g.lineWidth = H * 0.06;
  roundRect(g, H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14, H * 0.1); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${H * 0.3}px "Space Grotesk"`; g.fillText(words[0], W / 2, H * 0.35);
  g.font = `700 ${H * 0.24}px "Space Grotesk"`; g.fillText(words[1], W / 2, H * 0.67);
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* ---------- the 3D parts ---------- */

/* every solid part carries a colour and a flat 'ao' (the looks expect one) */
function solid(THREE, geo, hex, parts) {
  geo.setAttribute('ao', new THREE.Uint8BufferAttribute(new Uint8Array(geo.attributes.position.count).fill(255), 1, true));
  const m = new THREE.Mesh(geo); m.userData.colour = new THREE.Color(hex); m.userData.hex = hex;
  parts.push(m); return m;
}
function decal(THREE, cv, w, h) {
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
}

/* the sign on its stand; its foot at y = 0 */
export function buildSign(THREE, RoundedBoxGeometry, parts) {
  const sign = new THREE.Group();
  const box = (w, h, d, hex) => solid(THREE, new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * 0.45), hex, parts);
  // folding stand: a mast, and two legs splayed front and back from a hinge
  const MAST = 1.02, HINGE = 0.36;
  const mast = box(0.04, MAST, 0.04, METAL); mast.position.y = MAST / 2; sign.add(mast);
  for (const s of [-1, 1]) {
    const L = Math.hypot(HINGE, 0.26), leg = box(0.035, L, 0.035, METAL);
    leg.position.set(0, HINGE / 2, s * 0.13); leg.rotation.x = s * Math.atan2(0.26, HINGE); sign.add(leg);
    const foot = box(0.1, 0.03, 0.06, INK); foot.position.set(0, 0.015, s * 0.26); sign.add(foot);
  }
  // the plate
  const PW = 0.62, PH = 0.2, PY = 0.56;
  const plate = box(PW, PH, 0.025, ORANGE); plate.position.set(0, PY, 0.03); sign.add(plate);
  const pc = document.createElement('canvas'); pc.width = 1024; pc.height = Math.round(1024 * PH / PW); drawPlate(pc);
  const pd = decal(THREE, pc, PW, PH); pd.position.set(0, PY, 0.03 + 0.0135); sign.add(pd);
  // the diamond: a square plate turned 45°
  const D = 0.6, DY = PY + PH / 2 + 0.05 + D * Math.SQRT1_2;
  const diamond = box(D, D, 0.025, ORANGE); diamond.position.set(0, DY, 0.03); diamond.rotation.z = Math.PI / 4; sign.add(diamond);
  const dc = document.createElement('canvas'); dc.width = dc.height = 1024; drawDiamond(dc);
  /* turned clockwise (−45°), as the art preview's CSS rotate(45deg) does.
     Try 1 used +45° (three.js turns counter-clockwise) and the worker lay on his side. */
  const dd = decal(THREE, dc, D, D); dd.position.set(0, DY, 0.03 + 0.0135); dd.rotation.z = -Math.PI / 4; sign.add(dd);
  sign.userData.height = DY + D * Math.SQRT1_2;
  return sign;
}

/* a traffic cone; its foot at y = 0 */
export function buildCone(THREE, RoundedBoxGeometry, parts) {
  const cone = new THREE.Group();
  const base = solid(THREE, new RoundedBoxGeometry(0.3, 0.04, 0.3, 4, 0.015), INK, parts); base.position.y = 0.02; cone.add(base);
  // the body as stacked lathe bands, so each band has its own colour
  const B0 = 0.04, TOP = 0.5, r = (y) => 0.115 - (0.115 - 0.028) * (y - B0) / (TOP - B0);
  const bands = [[B0, 0.2, ORANGE], [0.2, 0.27, CONE_WHITE], [0.27, 0.33, ORANGE], [0.33, 0.38, CONE_WHITE], [0.38, TOP, ORANGE]];
  for (const [y0, y1, hex] of bands) {
    const pts = [new THREE.Vector2(r(y0), y0), new THREE.Vector2(r(y1), y1)];
    if (y1 === TOP) pts.push(new THREE.Vector2(0.018, TOP + 0.008), new THREE.Vector2(0, TOP + 0.012));   // a rounded tip
    cone.add(solid(THREE, new THREE.LatheGeometry(pts, 40), hex, parts));
  }
  cone.userData.height = TOP + 0.012;
  return cone;
}
