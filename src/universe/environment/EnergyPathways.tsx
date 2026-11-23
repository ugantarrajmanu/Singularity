"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, ShaderMaterial, TubeGeometry } from "three";
import { bootParams } from "@/animation/bootParams";
import { PALETTE } from "@/constants/theme";
import { createPathwayCurves } from "@/lib/pathways";
import { pathwayFragment, pathwayVertex } from "@/shaders/effects";
import { useUniverseStore } from "@/store/universeStore";

/** Data pathways from the core to each region; they draw on during formation. */
export function EnergyPathways() {
  const paths = useMemo(
    () =>
      createPathwayCurves().map(({ id, curve }, i) => ({
        id,
        geometry: new TubeGeometry(curve, 200, 0.028, 6, false),
        material: new ShaderMaterial({
          vertexShader: pathwayVertex,
          fragmentShader: pathwayFragment,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uReveal: { value: 0 },
            uActive: { value: 0 },
            uColor: { value: new Color(i % 2 ? PALETTE.softPurple : PALETTE.violet) },
          },
        }),
        delay: i * 0.08,
      })),
    [],
  );

  useFrame(({ clock }, delta) => {
    const { activeRegion, cameraMode } = useUniverseStore.getState();
    const reveal = bootParams.environmentReveal;
    for (const p of paths) {
      const u = p.material.uniforms;
      u.uTime.value = clock.elapsedTime;
      u.uReveal.value = Math.min(1, Math.max(0, (reveal - p.delay) / (1 - 0.32)));
      const target = cameraMode === "universe" || activeRegion === p.id ? 1 : 0;
      u.uActive.value += (target - u.uActive.value) * Math.min(1, delta * 3);
    }
  });

  return (
    <>
      {paths.map((p) => (
        <mesh key={p.id} geometry={p.geometry} material={p.material} frustumCulled={false} />
      ))}
    </>
  );
}
