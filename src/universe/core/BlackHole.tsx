"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, Color, Group, Mesh, NormalBlending, ShaderMaterial, Vector3 } from "three";
import { bootParams } from "@/animation/bootParams";
import { PALETTE } from "@/constants/theme";
import { blackHoleFragment, blackHoleVertex } from "@/shaders/blackhole";
import { haloFragment, haloVertex } from "@/shaders/energy";
import { PlasmaFilaments } from "./PlasmaFilaments";

const BOUND = 6;
const camLocal = new Vector3();

/**
 * The central singularity: a ray-traced black hole with a violet plasma disk,
 * wrapped in the energy core's plasma filaments (see shaders/blackhole.ts).
 * Driven by the same bootParams as the energy core, so the boot timeline,
 * expansion and formation work unchanged.
 */
export function BlackHole({ steps = 220 }: { steps?: number }) {
  const group = useRef<Group>(null);
  const volume = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);

  const volumeMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: blackHoleVertex,
        fragmentShader: blackHoleFragment,
        defines: { STEPS: steps },
        side: BackSide, // back faces render whether the camera is inside or outside
        transparent: true,
        premultipliedAlpha: true,
        blending: NormalBlending,
        // Writes depth only where the hole/disk is drawn (empty pixels discard),
        // so particles behind the hole are hidden and particles in front blend over.
        depthWrite: true,
        uniforms: {
          uCamLocal: { value: new Vector3() },
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uOpacity: { value: 0 },
          uTurbulence: { value: 0 },
          uReveal: { value: 0 },
          uRS: { value: 0.22 },
          uInner: { value: 1.05 },
          uDeep: { value: new Color(PALETTE.deepSpace) },
          uViolet: { value: new Color(PALETTE.violet) },
          uPurple: { value: new Color(PALETTE.softPurple) },
          uLavender: { value: new Color(PALETTE.lavender) },
        },
      }),
    [steps],
  );

  const haloMat = useMemo(
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
          uColorInner: { value: new Color(PALETTE.softPurple) },
          uColorOuter: { value: new Color(PALETTE.violet) },
          uRays: { value: 0 },
        },
      }),
    [],
  );

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const p = bootParams;
    const scale = Math.max(p.coreScale * (1 - 0.3 * p.compression), 0.0001);
    group.current?.scale.setScalar(scale);

    const u = volumeMat.uniforms;
    if (volume.current) {
      volume.current.updateWorldMatrix(true, false);
      u.uCamLocal.value.copy(volume.current.worldToLocal(camLocal.copy(camera.position)));
      volume.current.visible = p.holeReveal > 0.001;
    }
    u.uTime.value = t;
    u.uIntensity.value = p.coreIntensity * 1.1 + p.flash * 1.2;
    // Formation, driven by holeReveal (0 → 1):
    //   gas gathers into a diffuse swirl → flattens into a fast-spinning disk →
    //   the core collapses: the horizon grows from a point and light starts to bend.
    const rev = p.holeReveal;
    const gas = Math.min(1, rev / 0.35);
    const collapse = Math.max(0, Math.min(1, (rev - 0.45) / 0.55));
    const collapseEased = collapse * collapse * (3 - 2 * collapse);
    u.uOpacity.value = Math.min(1, p.filamentOpacity * 1.25) * gas;
    u.uReveal.value = Math.min(1, rev * 2.5);
    u.uRS.value = 0.22 * collapseEased;
    u.uInner.value = 0.12 + (1.05 - 0.12) * collapseEased;
    u.uTurbulence.value = p.turbulence + (1 - collapseEased) * 1.4 * gas;

    // The first point of light before the hole exists; fades out as it forms
    // (returns briefly for the expansion flash).
    // Before the explosion the centre is only gathering light; it hands over to the hole.
    const gather = 1 - p.holeReveal;
    haloMat.uniforms.uTime.value = t;
    // The singularity: a tiny point whose brightness flickers with quantum fluctuations.
    const flicker = 1 + p.turbulence * 0.22 * Math.sin(t * 31) * Math.sin(t * 7.3 + 1.7);
    haloMat.uniforms.uIntensity.value = (p.voidGlow * 0.5 + p.coreIntensity * 0.6) * flicker * gather + p.flash * 1.6;
    if (halo.current) {
      halo.current.quaternion.copy(camera.quaternion);
      halo.current.scale.setScalar((0.25 + p.coreIntensity * 0.32 - p.compression * 0.15) * gather + p.flash * 5);
      halo.current.visible = haloMat.uniforms.uIntensity.value > 0.002;
    }
  });

  return (
    <group>
      <mesh ref={halo} material={haloMat} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={group} rotation={[0.1, 0, 0.05]}>
        <mesh ref={volume} material={volumeMat} renderOrder={-1}>
          <sphereGeometry args={[BOUND, 48, 32]} />
        </mesh>
        {/* Energy-core filaments, scaled out to wrap the photon sphere. */}
        <group scale={0.9}>
          {/* <PlasmaFilaments subtle /> */}
        </group>
      </group>
    </group>
  );
}
