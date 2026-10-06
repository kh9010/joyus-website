// Look 4 · Candy. Studio's material, plus the one thing every candy
// reference in Study 17 has and Studio lacks: shade where stones touch
// (pmndrs' baubles and hi-key bubbles use N8AO, tinted). The decision here
// is to bake it: occlusion per vertex, once (bake/ao.html, 64 rays per
// vertex), because the stones barely move relative to each other. Runtime
// cost: one multiply. And the shade is tinted — the stone's own colour
// pushed toward a plum, never grey, so the seams read as colour, not dirt.
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { contactShadow } from './studio.js';
export function setup({ THREE, renderer, scene, pieces, box }) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const PLUM = new THREE.Color('#5a2a6e');
  for (const m of pieces) {
    if (!m.geometry.attributes.ao) throw new Error('candy needs a mesh with baked ao (mesh=p100-ao)');
    const mat = new THREE.MeshPhysicalMaterial({
      color: m.userData.colour, roughness: 0.4, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.05,
      sheen: 0.4, sheenRoughness: 0.5, sheenColor: m.userData.colour.clone().lerp(new THREE.Color(1, 1, 1), 0.6),
    });
    const tint = m.userData.colour.clone().lerp(PLUM, 0.55);
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTint = { value: tint };
      sh.vertexShader = 'attribute float ao;\nvarying float vAo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvAo = ao;');
      sh.fragmentShader = 'uniform vec3 uTint;\nvarying float vAo;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
        { float o = smoothstep(0.05, 0.85, vAo);            // 0 = closed in, 1 = open sky
          outgoingLight *= mix(uTint * 0.9, vec3(1.0), o); }
        #include <opaque_fragment>`);
    };
    m.material = mat;
  }
  scene.add(contactShadow(THREE, box, 0.22));
  return {};
}
