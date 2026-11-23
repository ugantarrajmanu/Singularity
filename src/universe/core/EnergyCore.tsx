"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, Color, Group, Mesh, ShaderMaterial } from "three";
import { bootParams } from "@/animation/bootParams";
import { PALETTE } from "@/constants/theme";
import {
  energyFragment,
  energyVertex,
  haloFragment,
  haloVertex,
  shellFragment,
} from "@/shaders/energy";
import { PlasmaFilaments } from "./PlasmaFilaments";

/**
 * The central energy core (roadmap §11.1): displaced plasma sphere, luminous
 * shell, camera-facing halo and plasma filaments. Driven entirely by bootParams.
 */
export function EnergyCore({ detail = 64 }: { detail?: number }) {
  const group = useRef<Group>(null);
  const halo = useRef<Mesh>(null);

  const coreMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: energyVertex,
        fragmentShader: energyFragment,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uTurbulence: { value: 0 },
          uCompression: { value: 0 },
          uColorCore: { value: new Color(PALETTE.white) },
          uColorInner: { value: new Color(PALETTE.lavender) },
          uColorMain: { value: new Color(PALETTE.softPurple) },
          uColorOuter: { value: new Color(PALETTE.violet) },
        },
      }),
    [],
  );

  const shellMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: energyVertex,
        fragmentShader: shellFragment,
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uTurbulence: { value: 0 },
          uCompression: { value: 0 },
          uColor: { value: new Color(PALETTE.violet) },
        },
      }),
    [],
  );

  const haloMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: haloFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uColorInner: { value: new Color(PALETTE.lavender) },
          uColorOuter: { value: new Color(PALETTE.violet) },
          uRays: { value: 1 },
        },
      }),
    [],
  );

  useFrame(({ clock, camera }, delta) => {
    const t = clock.elapsedTime;
    const p = bootParams;
    // Unstable pulse that strengthens with turbulence.
    const pulse = 1 + Math.sin(t * (2 + p.turbulence * 4)) * 0.025 * (0.4 + p.turbulence);
    const scale = Math.max(p.coreScale * (1 - 0.35 * p.compression) * pulse, 0.0001);

    if (group.current) {
      group.current.scale.setScalar(scale);
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x = Math.sin(t * 0.1) * 0.15;
    }

    const intensity = p.coreIntensity + p.flash * 4;
    for (const m of [coreMaterial, shellMaterial]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uTurbulence.value = p.turbulence;
      m.uniforms.uCompression.value = p.compression;
      m.uniforms.uIntensity.value = intensity;
    }

    // The halo is visible before the sphere forms: it *is* the first point of light.
    haloMaterial.uniforms.uTime.value = t;
    haloMaterial.uniforms.uIntensity.value = Math.min(p.voidGlow * 0.9 + p.coreIntensity * 0.45 + p.flash * 3, 5);
    if (halo.current) {
      halo.current.quaternion.copy(camera.quaternion);
      const hs = 2.2 + p.coreScale * 4.5 + p.flash * 14 + p.compression * 1.5;
      halo.current.scale.setScalar(hs);
    }
  });

  return (
    <group>
      <group ref={group}>
        <mesh material={coreMaterial}>
          <icosahedronGeometry args={[1, detail]} />
        </mesh>
        <mesh material={shellMaterial} scale={1.35}>
          <icosahedronGeometry args={[1, Math.max(8, detail / 4)]} />
        </mesh>
        <PlasmaFilaments />
      </group>
      <mesh ref={halo} material={haloMaterial} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
