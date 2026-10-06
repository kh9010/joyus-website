// Look 7 · Sugared. The one real decision: no gloss at all. A sugar-dusted
// gummy: matte base, velvet sheen (three's Charlie sheen, Study 17's
// "Sheen" ref) catching light at the grazing edges, and sugar crystals —
// tiny glints scattered over the surface by a hash of position, each lit
// only when it faces the light, so they twinkle as the J leans. Baked tinted
// occlusion from Look 4, because a matte surface has nothing else to carry
// its form in the seams (pmndrs' hi-key bubbles).
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
// Study 19 copy: the page draws the floor and shadows now, so no contactShadow here.
export function setup({ THREE, renderer, scene, pieces, box }) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const PLUM = new THREE.Color('#5a2a6e'), white = new THREE.Color(1, 1, 1);
  for (const m of pieces) {
    const c = m.userData.colour;
    const mat = new THREE.MeshPhysicalMaterial({
      color: c.clone().lerp(white, 0.08), roughness: 0.95, metalness: 0,
      sheen: 1, sheenRoughness: 0.35, sheenColor: c.clone().lerp(white, 0.75),
    });
    const tint = c.clone().lerp(PLUM, 0.55);
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTint = { value: tint };
      sh.vertexShader = 'attribute float ao;\nvarying float vAo;\nvarying vec3 vObj;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvAo = ao; vObj = position;');
      sh.fragmentShader = 'uniform vec3 uTint;\nvarying float vAo;\nvarying vec3 vObj;\n' +
        'float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n' +
        sh.fragmentShader.replace('#include <opaque_fragment>', `
        { float o = smoothstep(0.05, 0.85, vAo);
          outgoingLight *= mix(uTint * 0.9, vec3(1.0), o);
          // sugar: one candidate crystal per small cell, a random facet each
          vec3 q = vObj * 110.0, id = floor(q);   // try 1: 160, too fine
          float pick = h3(id), facet = h3(id + 7.1);
          vec3 fn = normalize(normal + 0.6 * (vec3(h3(id + 1.3), h3(id + 2.7), h3(id + 4.1)) - 0.5));
          vec3 V = normalize(vViewPosition), L = normalize(vec3(-0.5, 0.8, 0.55));
          float glint = pow(max(dot(fn, normalize(L + V)), 0.0), 50.0) * step(0.55, pick)   /* try 1: 120 and 0.82, too sparse to see */
            * (0.6 + facet);
          float near = 1.0 - smoothstep(0.2, 0.45, length(fract(q) - 0.5));
          outgoingLight += vec3(1.0) * glint * near * o * 2.5; }
        #include <opaque_fragment>`);
    };
    m.material = mat;
  }
  return {};
}
