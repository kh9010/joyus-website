// Look 1 · Studio. The one real decision: stop hand-writing the light and
// let physically based materials see a photographed-style studio. Each stone
// is a MeshPhysicalMaterial (lacquer clearcoat over a satin base, a little
// sheen so the shadow side stays soft), lit only by RoomEnvironment, three's
// procedural softbox room, prefiltered (PMREM) so roughness blurs the
// reflections. A blurred contact shadow sits it on the white.
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function setup({ THREE, renderer, scene, pieces, box }) {
  renderer.toneMapping = THREE.NeutralToneMapping;   // keeps the pastels from washing out (AgX did, in brand-lab)
  renderer.toneMappingExposure = 1.0;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.0;
  for (const m of pieces) m.material = new THREE.MeshPhysicalMaterial({
    color: m.userData.colour, roughness: 0.42, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.06,
    sheen: 0.4, sheenRoughness: 0.5, sheenColor: m.userData.colour.clone().lerp(new THREE.Color(1, 1, 1), 0.6),
  });
  scene.add(contactShadow(THREE, box));
  return {};
}

// soft shadow under the J: a gaussian on a plane, no shadow maps
export function contactShadow(THREE, box, strength = 0.2) {
  const w = (box.max.x - box.min.x) * 1.5, d = 1.2;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { k: { value: strength } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float k; varying vec2 vU; void main(){ vec2 p = (vU - 0.5) * 2.0; gl_FragColor = vec4(0.17, 0.2, 0.27, exp(-3.0 * dot(p, p)) * k); }',
  }));
  s.rotation.x = -Math.PI / 2; s.position.y = box.min.y - 0.02;
  return s;
}
