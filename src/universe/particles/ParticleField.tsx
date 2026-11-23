"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import { bootParams } from "@/animation/bootParams";
import { ENABLE_HAZE, PALETTE } from "@/constants/theme";
import { createParticleBuffers } from "@/lib/particleData";
import { particleFragment, particleVertex } from "@/shaders/particle";

/**
 * One THREE.Points draw call for the whole orbit → expansion → formation
 * journey. All motion happens in the vertex shader.
 */
export function ParticleField({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const orbitAngle = useRef(0);

  const geometry = useMemo(() => {
    const b = createParticleBuffers(count);
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(b.orbit, 3));
    g.setAttribute("aCloud", new BufferAttribute(b.cloud, 3));
    g.setAttribute("aTarget", new BufferAttribute(b.target, 3));
    g.setAttribute("aSeed", new BufferAttribute(b.seed, 1));
    g.setAttribute("aSpeed", new BufferAttribute(b.speed, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOrbitAngle: { value: 0 },
          uSpread: { value: 0 },
          uFormation: { value: 0 },
          uCompression: { value: 0 },
          uHaze: { value: 0 },
          uSize: { value: 1.6 },
          uPixelRatio: { value: 1 },
          uOpacity: { value: 0 },
          uTemperature: { value: 1 },
          uColorA: { value: new Color(PALETTE.violet) },
          uColorB: { value: new Color(PALETTE.softPurple) },
          uColorC: { value: new Color(PALETTE.white) },
        },
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const p = bootParams;
    // Clamp: the first frame after a render pause can carry a huge delta.
    orbitAngle.current += Math.min(delta, 0.1) * p.particleSpeed;
    const u = material.uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uOrbitAngle.value = orbitAngle.current;
    u.uSpread.value = p.particleSpread;
    u.uFormation.value = p.formation;
    u.uCompression.value = p.compression;
    u.uHaze.value = ENABLE_HAZE ? p.haze : 0;
    u.uOpacity.value = p.particleOpacity * 0.9;
    u.uTemperature.value = p.temperature;
    u.uPixelRatio.value = dpr;
  });

  // Bounds change over the sequence, so skip frustum culling.
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
