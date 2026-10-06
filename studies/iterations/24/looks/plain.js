// Study 16's shader, unchanged: the baseline every look is compared to.
export function setup({ THREE, pieces }) {
  const vert = `
varying vec3 vN; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
  const frag = `
uniform vec3 uColor;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  vec3 L = normalize(vec3(-0.5, 0.75, 0.6));
  float wrap = clamp((dot(n, L) + 0.45) / 1.45, 0.0, 1.0);
  vec3 sky = mix(vec3(0.80, 0.78, 0.82), vec3(1.0), 0.5 + 0.5 * n.y);
  vec3 col = uColor * (0.42 * sky + 0.72 * wrap);
  vec3 h = normalize(L + v);
  col += vec3(1.0) * pow(max(dot(n, h), 0.0), 90.0) * 0.85;
  col += vec3(1.0) * pow(max(dot(n, normalize(vec3(0.6, 0.3, 0.8) + v)), 0.0), 30.0) * 0.18;
  float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  col = mix(col, vec3(1.0), fr * 0.55);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
  for (const m of pieces) m.material = new THREE.ShaderMaterial({ uniforms: { uColor: { value: m.userData.colour } }, vertexShader: vert, fragmentShader: frag });
  return {};
}
