// Look 8 · Frosted. The one real decision: give the glass something to show.
// Gummy (Look 2) failed because three's transmission only refracts opaque
// things and a white page offers nothing. So every stone becomes two: a
// solid candy core (the same stone, shrunk to 45% about its middle) and a
// clear frosted shell (the stone itself, transmissive, rough). The shell
// blurs and bends its own core, the way pmndrs' "Spline glass shapes"
// (Study 17) put pastel shapes behind frosted glass. Heaviest look here:
// one extra render of the scene for the transmission buffer.
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { contactShadow } from './studio.js';
export function setup({ THREE, renderer, scene, pieces, box }) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const white = new THREE.Color(1, 1, 1);
  for (const m of pieces) {
    const c = m.userData.colour;
    m.geometry.computeBoundingBox();
    const mid = m.geometry.boundingBox.getCenter(new THREE.Vector3());
    const coreGeo = m.geometry.clone().translate(-mid.x, -mid.y, -mid.z).scale(0.45, 0.45, 0.45).translate(mid.x, mid.y, mid.z);
    const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, emissive: c, emissiveIntensity: 0.25 }));
    m.add(core);   // a child, so it travels with its stone when the pieces fly in and drift
    m.material = new THREE.MeshPhysicalMaterial({
      color: c.clone().lerp(white, 0.88), roughness: 0.2, metalness: 0,   /* try 1: core 70%, roughness 0.38: blurred to one flat colour, read as Studio */
      transmission: 1, thickness: 0.25, ior: 1.45,
      clearcoat: 1, clearcoatRoughness: 0.02,   // a polished outside over a frosted body
    });
  }
  scene.add(contactShadow(THREE, box, 0.12));
  return {};
}
