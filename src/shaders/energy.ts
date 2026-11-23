import { simplexNoise3D } from "./noise";

/** Plasma sphere: organic vertex displacement + fresnel-driven HDR emission. */
export const energyVertex = /* glsl */ `
${simplexNoise3D}
uniform float uTime;
uniform float uTurbulence;
uniform float uCompression;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vObjPos;
varying float vDisplacement;

void main() {
  vec3 n = normalize(position);
  float slow = snoise(n * 1.4 + vec3(uTime * 0.22, uTime * 0.17, -uTime * 0.2));
  float fine = snoise(n * 4.2 + vec3(-uTime * 0.6, uTime * 0.5, uTime * 0.4));
  float d = slow * (0.10 + 0.22 * uTurbulence) + fine * 0.07 * uTurbulence;
  d *= 1.0 - 0.6 * uCompression;
  vDisplacement = d;

  vec3 displaced = position + n * d;
  vObjPos = n;
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vNormal = normalize(mat3(modelMatrix) * n);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const energyFragment = /* glsl */ `
${simplexNoise3D}
uniform float uTime;
uniform float uIntensity;
uniform float uTurbulence;
uniform vec3 uColorCore;
uniform vec3 uColorInner;
uniform vec3 uColorMain;
uniform vec3 uColorOuter;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vObjPos;
varying float vDisplacement;

void main() {
  float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.2);

  // Animated plasma bands flowing across the surface.
  float flow = fbm(vObjPos * 2.2 + vec3(0.0, uTime * 0.35, uTime * 0.18));
  float veins = 1.0 - abs(snoise(vObjPos * 5.0 + vec3(uTime * 0.5, -uTime * 0.3, 0.0)));
  veins = pow(veins, 6.0) * (0.4 + uTurbulence);

  vec3 col = mix(uColorMain, uColorInner, smoothstep(-0.2, 0.6, flow));
  col = mix(col, uColorCore, pow(facing, 5.0) * 0.6);
  col = mix(col, uColorOuter, fresnel * 0.85);
  col += uColorInner * veins * 0.8;
  col += uColorCore * max(vDisplacement, 0.0) * 1.5;

  float emission = uIntensity * (0.45 + 0.35 * pow(facing, 4.0) + fresnel * 0.6);
  gl_FragColor = vec4(col * emission, 1.0);
}
`;

/** Back-face shell used for the luminous atmosphere around the core. */
export const shellFragment = /* glsl */ `
uniform float uIntensity;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vObjPos;
varying float vDisplacement;

void main() {
  float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
  float glow = pow(1.0 - facing, 1.6) * pow(facing, 0.4) * 1.8;
  gl_FragColor = vec4(uColor * glow * uIntensity, glow * clamp(uIntensity, 0.0, 1.0));
}
`;

/** Camera-facing radial halo. */
export const haloVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const haloFragment = /* glsl */ `
uniform float uIntensity;
uniform float uTime;
uniform vec3 uColorInner;
uniform vec3 uColorOuter;
uniform float uRays;   // 1 = stylised rays, 0 = clean point source
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float a = atan(p.y, p.x);
  float rays = mix(1.0, 0.85 + 0.15 * sin(a * 7.0 + uTime * 0.4) * sin(a * 3.0 - uTime * 0.25), uRays);
  float core = exp(-r * 9.0);
  float halo = exp(-r * 3.2) * rays;
  vec3 col = uColorInner * core * 2.5 + uColorOuter * halo;
  float alpha = clamp(core + halo, 0.0, 1.0) * smoothstep(1.0, 0.6, r);
  gl_FragColor = vec4(col * uIntensity, alpha * min(uIntensity, 1.0));
}
`;

/** Plasma filaments wrapping the core. */
export const filamentVertex = /* glsl */ `
${simplexNoise3D}
uniform float uTime;
uniform float uStretch;
uniform float uSeed;
varying float vAlong;
varying float vEdge;

void main() {
  vAlong = uv.x;
  vEdge = uv.y;
  vec3 dir = normalize(position);
  float n = snoise(dir * 1.8 + vec3(uSeed, uTime * 0.3, uSeed * 0.5));
  float reach = 1.0 + uStretch * (0.35 + 0.65 * max(n, 0.0)) * 0.9;
  vec3 p = position * reach + dir * n * 0.12;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const filamentFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uSeed;
uniform vec3 uColor;
varying float vAlong;
varying float vEdge;

void main() {
  float pulse = fract(vAlong * 2.0 - uTime * (0.15 + fract(uSeed) * 0.2));
  float band = smoothstep(0.0, 0.25, pulse) * smoothstep(0.65, 0.25, pulse);
  float base = 0.25 + band;
  gl_FragColor = vec4(uColor * base * 1.6, base * uOpacity);
}
`;
