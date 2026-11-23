import { simplexNoise3D } from "./noise";

/**
 * GPU particle system. Each particle carries three deterministic states:
 *   orbit  — tight shell around the singularity
 *   cloud  — radially dispersed position after the expansion
 *   target — structured position in the formed universe
 * The shader blends between them using uSpread and uFormation.
 */
export const particleVertex = /* glsl */ `
${simplexNoise3D}
uniform float uTime;
uniform float uOrbitAngle;
uniform float uSpread;
uniform float uFormation;
uniform float uSize;
uniform float uPixelRatio;
uniform float uCompression;
uniform float uHaze;

attribute vec3 aCloud;
attribute vec3 aTarget;
attribute float aSeed;
attribute float aSpeed;

varying float vSeed;
varying float vFormation;
varying float vFlicker;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vSeed = aSeed;

  // 1. Orbit around the singularity (angle accumulated on CPU to avoid jumps).
  vec3 orbit = position * (1.0 - 0.45 * uCompression);
  orbit.xz = rot(uOrbitAngle * aSpeed) * orbit.xz;
  orbit.xy = rot(uOrbitAngle * aSpeed * 0.35 + aSeed * 6.28) * orbit.xy;

  // 2. Metric expansion: every position scales with the cosmic scale factor
  //    a(t) = uSpread, so recession speed is proportional to distance (Hubble
  //    flow) — space stretching uniformly, not a shell blasting outward.
  float s = clamp(uSpread, 0.0, 1.0);
  vec3 cloud = mix(orbit, vec3(0.0), smoothstep(0.0, 0.02, s)) + aCloud * s;
  // Primordial density fluctuations grow as the universe expands.
  // Uniform branch (same for every vertex): skip the noise before the bang
  // and once every particle has settled into the formed universe.
  if (s > 0.0 && uFormation < 1.0) {
    cloud += vec3(
      snoise(aCloud * 0.05 + uTime * 0.05),
      snoise(aCloud * 0.05 + 17.0 + uTime * 0.05),
      snoise(aCloud * 0.05 + 31.0 + uTime * 0.05)
    ) * 1.5 * s * s;
  }

  // 3. Formation: staggered settling into structured geometry.
  float delay = aSeed * 0.45;
  float f = smoothstep(delay, delay + 0.55, uFormation);
  vFormation = f;
  vec3 settled = aTarget + vec3(
    sin(uTime * 0.6 + aSeed * 40.0),
    cos(uTime * 0.5 + aSeed * 23.0),
    sin(uTime * 0.4 + aSeed * 11.0)
  ) * 0.04;
  vec3 p = mix(cloud, settled, f);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  vFlicker = 0.65 + 0.35 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 50.0);
  // Swell in the cosmic-cloud phase, but stay small while the opaque plasma
  // hides them anyway — big additive points behind fog are pure overdraw.
  float cloudSwell = (1.0 + 1.6 * s * (1.0 - f)) * (1.0 - 0.6 * uHaze);
  float size = uSize * (0.5 + aSeed * 0.9) * mix(1.0, 0.8, f) * cloudSwell;
  float attenuated = size * uPixelRatio * (40.0 / -mv.z);
  float minimum = uPixelRatio * (1.1 + aSeed * 1.2);
  gl_PointSize = clamp(max(attenuated, minimum), 0.0, 32.0);
}
`;

export const particleFragment = /* glsl */ `
uniform float uOpacity;
uniform float uTemperature;   // 1 = white-hot early universe, 0 = cooled palette
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying float vSeed;
varying float vFormation;
varying float vFlicker;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, d);
  alpha *= alpha;

  vec3 col = mix(uColorA, uColorB, smoothstep(0.2, 0.8, vSeed));
  col = mix(col, uColorC, step(0.93, vSeed));
  // Cooling: white-hot → lavender → the violet palette.
  vec3 hot = mix(uColorC, mix(uColorB, uColorC, 0.6), smoothstep(0.5, 1.0, 1.0 - uTemperature));
  col = mix(col, hot, smoothstep(0.0, 0.8, uTemperature));
  float glow = 1.2 + vFlicker * 0.6 + uTemperature * 0.8;
  gl_FragColor = vec4(col * glow, alpha * uOpacity * vFlicker);
}
`;

/** Distant static starfield. */
export const starVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uOpacity;
attribute float aSeed;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vAlpha = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.3 + aSeed) + aSeed * 90.0))) * uOpacity;
  gl_PointSize = (1.0 + aSeed * 1.6) * uPixelRatio;
}
`;

export const starFragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha);
}
`;
