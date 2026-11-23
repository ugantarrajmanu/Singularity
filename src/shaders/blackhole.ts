import { simplexNoise3D } from "./noise";

/**
 * "Plasma singularity" — a ray-traced Schwarzschild black hole whose accretion
 * disk is violet plasma (the energy core's language) rather than white-hot gas.
 *
 * Each fragment marches a light ray through a bounding sphere, bending it with
 * the photon-orbit approximation  a = -1.5 · rs · h² · x / |x|⁵  (h = |x × v|).
 * That yields the shadow, the lensed far side of the disk arching over and
 * under the hole, and a soft photon ring — all from the physics, no billboards.
 *
 * Everything is in the mesh's local space, so the group's scale/tilt drive it.
 */
export const blackHoleVertex = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const blackHoleFragment = /* glsl */ `
${simplexNoise3D}
uniform vec3 uCamLocal;
uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
uniform float uReveal;
uniform float uTurbulence;
uniform float uRS;      // Schwarzschild radius — grows from 0 as the core collapses
uniform float uInner;   // disk inner edge — gas fills the centre before the horizon forms
uniform vec3 uDeep;
uniform vec3 uViolet;
uniform vec3 uPurple;
uniform vec3 uLavender;
varying vec3 vLocal;

const float OUTER = 4.4;
const float BOUND = 6.0;

vec4 shadeDisk(vec3 hit, float rr, vec3 dir) {
  float t = (rr - uInner) / (OUTER - uInner);
  float ang = atan(hit.z, hit.x);
  // Keplerian shear: inner plasma orbits much faster.
  float swirl = ang + uTime * (0.45 + uTurbulence * 0.8) * pow(uInner / rr, 1.5) * 2.0;
  vec3 q = vec3(cos(swirl) * rr, sin(swirl) * rr, uTime * 0.07);
  float n = fbm(q * 1.15);
  // Plasma veins borrowed from the energy core.
  float veins = pow(1.0 - abs(snoise(q * 2.4 + vec3(0.0, 0.0, uTime * 0.2))), 5.0);
  float lanes = 0.75 + 0.25 * sin(rr * 13.0 + n * 6.0);

  // Beaming: approaching side brighter, receding side dimmer and deeper violet.
  vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
  float beam = clamp(1.0 + 0.6 * dot(tangent, -dir), 0.25, 1.7);

  float heat = pow(1.0 - t, 1.8) + exp(-t * 7.0) * 0.9;
  float b = heat * (0.45 + 0.75 * n + veins * 0.6) * lanes * beam;

  // Palette only: violet → soft purple → lavender at the hottest. No white.
  vec3 col = mix(uViolet, uPurple, smoothstep(0.1, 0.85, heat * beam * 0.7));
  col = mix(col, uLavender, smoothstep(1.1, 2.0, heat * beam) * 0.7);
  col = mix(col, uDeep, smoothstep(0.6, 1.0, t) * 0.6);

  float edge = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.65, t);
  float a = clamp(b * 1.3, 0.0, 0.97) * edge * uOpacity;
  return vec4(col * b * 1.5 * uIntensity, a);
}

void main() {
  vec3 ro = uCamLocal;
  vec3 rd = normalize(vLocal - ro);

  float bq = dot(ro, rd);
  float cq = dot(ro, ro) - BOUND * BOUND;
  float disc = bq * bq - cq;
  if (disc < 0.0) discard;
  float t0 = -bq - sqrt(disc);

  vec3 pos = ro + rd * max(t0, 0.0);
  vec3 vel = rd;
  vec3 L = cross(pos, vel);
  float h2 = dot(L, L);

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float closest = 1e3;

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);
    closest = min(closest, r);
    float dt = clamp(0.06 * r, 0.008, 0.3);
    vec3 prev = pos;
    float r2 = r * r;
    vel += -1.5 * uRS * h2 * pos / (r2 * r2 * r) * dt;
    pos += vel * dt;

    if (prev.y * pos.y < 0.0) {
      float f = prev.y / (prev.y - pos.y);
      vec3 hit = mix(prev, pos, f);
      float rr = length(hit.xz);
      if (rr > uInner && rr < OUTER) {
        vec4 d = shadeDisk(hit, rr, normalize(vel));
        col += (1.0 - alpha) * d.rgb * d.a;
        alpha += (1.0 - alpha) * d.a;
      }
    }

    float rn = length(pos);
    if (rn < uRS) {
      alpha = 1.0;   // swallowed: pure black
      break;
    }
    if (rn > BOUND + 0.25 && dot(pos, vel) > 0.0) break;
    if (alpha > 0.985) break;
  }

  // Soft violet photon ring from rays that skimmed the photon sphere (1.5 rs).
  if (alpha < 1.0 && uRS > 0.01) {
    float ring = exp(-pow((closest - uRS * 1.5) / (uRS * 0.22), 2.0)) * 0.55;
    col += (1.0 - alpha) * uPurple * ring * uIntensity * uOpacity;
    alpha += (1.0 - alpha) * ring * 0.6 * uOpacity;
  }

  col *= uReveal;
  alpha *= uReveal;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);   // premultiplied
}
`;
