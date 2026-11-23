"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, Mesh, ShaderMaterial } from "three";
import { bootParams } from "@/animation/bootParams";
import { PALETTE } from "@/constants/theme";
import { mulberry32, randomUnitVector } from "@/lib/random";
import { backdropFragment, backdropVertex } from "@/shaders/effects";
import { starFragment, starVertex } from "@/shaders/particle";

/** Deep-space gradient dome + distant starfield. */
export function Backdrop({ stars }: { stars: number }) {
  const dome = useRef<Mesh>(null);
  const domeMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        side: BackSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uGlow: { value: 0 },
          uFlash: { value: 0 },
          uVoid: { value: new Color(PALETTE.void) },
          uDeep: { value: new Color(PALETTE.deepSpace) },
          uViolet: { value: new Color(PALETTE.violet) },
        },
      }),
    [],
  );

  const starGeo = useMemo(() => {
    const rand = mulberry32(7);
    const pos = new Float32Array(stars * 3);
    const seed = new Float32Array(stars);
    for (let i = 0; i < stars; i++) {
      const [x, y, z] = randomUnitVector(rand);
      const r = 160 + rand() * 60;
      pos.set([x * r, y * r, z * r], i * 3);
      seed[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, [stars]);

  const starMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starVertex,
        fragmentShader: starFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uOpacity: { value: 0 },
          uColor: { value: new Color(PALETTE.lavender) },
        },
      }),
    [],
  );

  useFrame(({ clock, viewport, camera }) => {
    const t = clock.elapsedTime;
    domeMat.uniforms.uTime.value = t;
    // Before the Big Bang there is nothing — the nebula only exists once space does.
    domeMat.uniforms.uGlow.value = bootParams.voidGlow * (0.06 + 0.94 * bootParams.particleSpread);
    domeMat.uniforms.uFlash.value = bootParams.flash;
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uPixelRatio.value = viewport.dpr;
    starMat.uniforms.uOpacity.value = bootParams.particleSpread * 0.8;
    // Keep the dome centred on the camera so it reads as infinitely far.
    dome.current?.position.copy(camera.position);
  });

  return (
    <>
      <mesh
        material={domeMat}
        frustumCulled={false}
        renderOrder={-10}
        ref={dome}
      >
        <sphereGeometry args={[300, 128, 64]} />
      </mesh>
      <points geometry={starGeo} material={starMat} frustumCulled={false} />
    </>
  );
}
