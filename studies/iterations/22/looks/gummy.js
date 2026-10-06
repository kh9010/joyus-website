// Look 2 · Gummy. The one real decision: the colour glows from inside.
//
// Wrong turns, kept as screenshots (img/gummy-try1, gummy-try2):
//  1. Real transmission (MeshPhysicalMaterial transmission + Beer–Lambert
//     attenuation), attenuationDistance 0.18: opaque, purple went navy.
//  2. Same at 0.9: right colours, but reads as plastic. On a white page there
//     is nothing to see through, and three's transmission pass only refracts
//     opaque things, so the stones can't see each other either.
// So: fake the *effect* of light inside a jelly instead of simulating it.
// The studio material, plus two terms added to its output in its own shader
// (onBeforeCompile): a back light that comes through where the surface
// turns away from the viewer (thin sides, edges), and a soft inner glow,
// both in the stone's own colour. No transmission pass: cheap on a phone.
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
// Study 19 copy: the page draws the floor and shadows now, so no contactShadow here.
export function setup({ THREE, renderer, scene, pieces, box }) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  for (const m of pieces) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: m.userData.colour, roughness: 0.3, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.03,
    });
    mat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
        {
          vec3 V = normalize(vViewPosition);                    // surface → eye, view space
          vec3 B = normalize(vec3(0.35, 0.55, -1.0));           // a light behind the J
          float through = pow(clamp(dot(V, -normalize(B + normal * 0.45)), 0.0, 1.0), 3.0);
          float edge = pow(1.0 - abs(dot(normal, V)), 2.0);     // thin where the surface turns away
          vec3 glow = diffuseColor.rgb * (0.9 * through + 0.55 * edge + 0.12);
          outgoingLight = outgoingLight * 0.85 + glow * mix(vec3(1.0), diffuseColor.rgb, 0.35);
        }
        #include <opaque_fragment>`);
    };
    m.material = mat;
  }
  return {};
}
