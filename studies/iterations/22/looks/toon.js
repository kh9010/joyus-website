// Look 3 · Toon. The one real decision: light in steps, not gradients, and
// an ink line round every stone, so the 3D J is drawn the way the brand's
// flat 2D patterns are (colour fields with a dark grout).
// Fill: three bands (lit / mid / shade) of the stone's own colour, the shade
// band shifted toward the ink rather than toward grey, plus one hard-edged
// white highlight. Line: the inverted hull — a second copy of each stone,
// back faces only, pushed out along its normals and filled with ink.
export function setup({ THREE, scene, pieces }) {
  const INK = new THREE.Color('#2C3544');
  const fill = (c) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: c }, uInk: { value: INK } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform vec3 uInk; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 n = normalize(vN), v = normalize(vV), L = normalize(vec3(-0.5, 0.8, 0.55));
        float d = dot(n, L);
        vec3 lit = mix(uColor, vec3(1.0), 0.12), mid = uColor, shade = mix(uColor, uInk, 0.38);
        /* each step blends over one pixel (fwidth), not a hard if: try 1
           used ternaries and every band edge came out stair-stepped */
        float aw = fwidth(d);
        vec3 col = mix(shade, mid, smoothstep(-0.05 - aw, -0.05 + aw, d));
        col = mix(col, lit, smoothstep(0.45 - aw, 0.45 + aw, d));
        float spec = pow(max(dot(n, normalize(L + v)), 0.0), 60.0), sw = fwidth(spec);
        col = mix(col, vec3(1.0), smoothstep(0.5 - sw, 0.5 + sw, spec));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const line = new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { uInk: { value: INK } },
    vertexShader: `void main(){ vec3 p = position + normal * 0.012; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0);
      #include <colorspace_fragment>
    }`,
  });
  for (const m of pieces) {
    m.material = fill(m.userData.colour);
    const hull = new THREE.Mesh(m.geometry, line);
    m.add(hull);
  }
  return {};
}
