// Look 5 · Print. The one real decision: shade is drawn as halftone dots,
// not as a gradient — the way a riso or offset print would carry the form.
// (Study 17: Maxime Heckel's "Shades of Halftone", three's TSL halftone,
// and the CMYK interest in joyus/brand-lab/DESIGN.md.)
// Per material, not a post pass, so each stone keeps its own ink: the stone
// is a flat light tint of its colour (the paper showing through), and its
// full colour comes in as dots on a fixed 30° screen whose size follows how
// far the surface turns from the light. The highlight is bare paper.
// Dots are in screen pixels (gl_FragCoord), so they stay the same size at
// any zoom: a print, not a texture on a toy.
export function setup({ THREE, renderer, pieces }) {
  const dpr = renderer.getPixelRatio();
  const mat = (c) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: c }, uCell: { value: 6.5 * dpr } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uCell; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 n = normalize(vN), v = normalize(vV), L = normalize(vec3(-0.5, 0.8, 0.55));
        float lit = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
        float rim = pow(1.0 - max(dot(n, v), 0.0), 2.0);
        float tone = clamp(1.15 - lit * 1.05 + rim * 0.35, 0.0, 1.0);    // 0 = paper, 1 = solid ink
        // a 30° screen in pixels
        float a = radians(30.0); mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
        vec2 p = R * gl_FragCoord.xy / uCell, cell = fract(p) - 0.5;
        float r = sqrt(tone) * 0.62, d = length(cell), aa = fwidth(d);
        float ink = 1.0 - smoothstep(r - aa, r + aa, d);
        vec3 paper = mix(vec3(1.0), uColor, 0.28);
        float spec = pow(max(dot(n, normalize(L + v)), 0.0), 40.0);
        vec3 col = mix(paper, uColor, ink);
        col = mix(col, vec3(1.0), smoothstep(0.35, 0.6, spec));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  for (const m of pieces) m.material = mat(m.userData.colour);
  return {};
}
