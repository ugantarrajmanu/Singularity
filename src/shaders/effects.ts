import { simplexNoise3D } from "./noise";

/** Energy pathways linking regions; uReveal draws them on along their length. */
export const pathwayVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const pathwayFragment = /* glsl */ `
uniform float uTime;
uniform float uReveal;
uniform float uActive;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  if (vUv.x > uReveal) discard;
  float dash = fract(vUv.x * 18.0 - uTime * 0.6);
  float pulse = smoothstep(0.0, 0.1, dash) * smoothstep(0.5, 0.1, dash);
  float headGlow = smoothstep(uReveal - 0.04, uReveal, vUv.x) * step(uReveal, 0.999);
  float base = 0.18 + pulse * (0.5 + uActive * 0.8) + headGlow * 2.0;
  gl_FragColor = vec4(uColor * base * 1.4, base * 0.9);
}
`;

/** Full-screen backdrop: deep-space gradient + faint violet nebula. */
export const backdropVertex = /* glsl */ `
${simplexNoise3D}
uniform float uTime;
varying vec3 vDir;
varying float vNebula;
void main() {
  vDir = normalize(position);
  // The nebula is low-frequency, so evaluating it per vertex (and letting the
  // GPU interpolate) looks the same as per pixel at a fraction of the cost.
  vNebula = fbm(vDir * 2.5 + vec3(uTime * 0.01));
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;

export const backdropFragment = /* glsl */ `
uniform float uGlow;
uniform float uFlash;
uniform vec3 uVoid;
uniform vec3 uDeep;
uniform vec3 uViolet;
varying vec3 vDir;
varying float vNebula;
void main() {
  vec3 d = normalize(vDir);
  float n = vNebula;
  float nebula = smoothstep(0.05, 0.75, n) * 0.35;
  float horizon = 1.0 - abs(d.y);
  vec3 col = mix(uVoid, uDeep, horizon * 0.55 * uGlow);
  col += uViolet * nebula * uGlow * 0.35;
  col += vec3(0.85, 0.8, 1.0) * uFlash * 0.25;
  gl_FragColor = vec4(col, 1.0);
}
`;
