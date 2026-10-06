// Look 6 · Painted (matcap). The one real decision: the lighting is a
// picture, not a simulation. Each colour gets a small painted sphere (made
// here on a canvas, no image files) and MeshMatcapMaterial looks every
// surface up on it by the direction it faces. So the light can do things
// physics wouldn't — here, an illustrator's move: the shadow side picks up
// a bounce of the NEXT palette colour (pink catches yellow, yellow catches
// cyan…), and the highlight is a soft painted shape, not a reflection.
// Cheapest look here (one texture read); the light is fixed to the camera,
// so as the J leans the shading doesn't slide — it reads drawn.
export function setup({ THREE, pieces }) {
  const palette = [...new Set(pieces.map(m => m.userData.hex))];
  const caps = {};
  palette.forEach((hex, i) => { caps[hex] = paint(THREE, hex, palette[(i + 1) % palette.length]); });
  for (const m of pieces) m.material = new THREE.MeshMatcapMaterial({ matcap: caps[m.userData.hex] });
  return {};
}
function paint(THREE, hex, bounceHex) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), c = S / 2;
  const base = new THREE.Color(hex), deep = base.clone().lerp(new THREE.Color('#3b2a5e'), 0.3), light = base.clone().lerp(new THREE.Color(1, 1, 1), 0.35);
  const css = (col) => '#' + col.getHexString();
  g.fillStyle = css(deep); g.fillRect(0, 0, S, S);
  // body: lit from upper left, falling to the deep tone
  let r = g.createRadialGradient(c * 0.7, c * 0.62, 4, c, c, c);
  r.addColorStop(0, css(light)); r.addColorStop(0.5, css(base)); r.addColorStop(1, css(deep));
  g.fillStyle = r; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
  // the bounce: the next colour, low and to the right
  /* try 1: radius 0.75c at 0.75 alpha — landed as a hard blot (purple
     smudge on pink). Broad, low, faint: */
  r = g.createRadialGradient(c * 1.1, c * 2.0, 2, c * 1.1, c * 1.9, c * 1.15);
  const b = new THREE.Color(bounceHex).lerp(new THREE.Color(1, 1, 1), 0.2);
  r.addColorStop(0, 'rgba(' + [b.r, b.g, b.b].map(v => Math.round(v * 255)).join(',') + ',0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
  // a painted highlight: a soft tilted oval, and a small hard one inside
  g.save(); g.translate(c * 0.62, c * 0.52); g.rotate(-0.6);
  r = g.createRadialGradient(0, 0, 0, 0, 0, 34); r.addColorStop(0, 'rgba(255,255,255,0.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.scale(1.6, 0.8); g.beginPath(); g.arc(0, 0, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill();
  g.restore();
  // (try 1 painted a pale rim here: it showed as a ghost halo round every stone)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
