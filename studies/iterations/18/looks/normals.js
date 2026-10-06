// Diagnostic, not a look: the normals as colour, to see if the face crease is in the geometry.
export function setup({ THREE, pieces }) {
  const mat = new THREE.MeshNormalMaterial();
  for (const m of pieces) m.material = mat;
  return {};
}
