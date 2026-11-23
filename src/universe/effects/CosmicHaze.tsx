"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, Mesh, ShaderMaterial } from "three";
import { bootParams } from "@/animation/bootParams";
import { PALETTE } from "@/constants/theme";
import { simplexNoise3D } from "@/shaders/noise";

const vertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * The opaque primordial plasma. A sphere that grows with the scale factor:
 * first a white-hot fireball, then it engulfs the camera, cools through the
 * palette, and clears at "recombination". Its mottled texture nods to the
 * anisotropies of the cosmic microwave background.
 */
const fragment = /* glsl */ `
${simplexNoise3D}
uniform float uTime;
uniform float uHaze;
uniform float uTemperature;
uniform vec3 uWhite;
uniform vec3 uLavender;
uniform vec3 uPurple;
uniform vec3 uViolet;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  // Two octaves are plenty for the mottling and keep this full-screen pass cheap.
  vec3 q = d * 5.0 + vec3(uTime * 0.05);
  float n = 0.62 * snoise(q) + 0.38 * snoise(q * 2.7 + 11.0);
  float mottling = 0.7 + 0.3 * n;

  vec3 cool = mix(uViolet, uPurple, smoothstep(-0.3, 0.6, n));
  // Even at its hottest the plasma stays in the palette: lavender, with only
  // the densest knots reaching white.
  vec3 warm = mix(uLavender, uWhite, smoothstep(0.45, 0.9, n + 0.2) * 0.6);
  vec3 col = mix(cool, warm, smoothstep(0.2, 0.95, uTemperature));
  float glow = 0.55 + uTemperature * 0.75;

  float a = uHaze * clamp(mottling, 0.0, 1.0);
  gl_FragColor = vec4(col * glow * mottling * a, a);   // premultiplied
}
`;

export function CosmicHaze() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: BackSide,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uHaze: { value: 0 },
          uTemperature: { value: 1 },
          uWhite: { value: new Color(PALETTE.white) },
          uLavender: { value: new Color(PALETTE.lavender) },
          uPurple: { value: new Color(PALETTE.softPurple) },
          uViolet: { value: new Color(PALETTE.violet) },
        },
      }),
    [],
  );

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const { haze, temperature, particleSpread } = bootParams;
    m.visible = haze > 0.002;
    if (!m.visible) return;
    // Grows with the scale factor: a fireball at first, then it surrounds the camera.
    m.scale.setScalar(0.4 + particleSpread * 140);
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uHaze.value = haze;
    material.uniforms.uTemperature.value = temperature;
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={10} frustumCulled={false} visible={false}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  );
}
