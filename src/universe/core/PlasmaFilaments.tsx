"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  Group,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { bootParams } from "@/animation/bootParams";
import { PALETTE } from "@/constants/theme";
import { mulberry32 } from "@/lib/random";
import { filamentFragment, filamentVertex } from "@/shaders/energy";

const FILAMENT_COUNT = 14;

interface Filament {
  geometry: TubeGeometry;
  material: ShaderMaterial;
  axis: Vector3;
  speed: number;
}

/** Irregular closed loops of plasma that rotate independently and stretch during accumulation. */
export function PlasmaFilaments({ subtle = false }: { subtle?: boolean } = {}) {
  const groups = useRef<(Group | null)[]>([]);

  const filaments = useMemo<Filament[]>(() => {
    const rand = mulberry32(42);
    return Array.from({ length: FILAMENT_COUNT }, (_, i) => {
      const normal = new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      const tangent = new Vector3(0, 1, 0).cross(normal).normalize();
      if (tangent.lengthSq() < 0.01) tangent.set(1, 0, 0);
      const bitangent = normal.clone().cross(tangent);
      const radius = 1.08 + rand() * 0.35;
      const points: Vector3[] = [];
      const segments = 24;
      for (let k = 0; k < segments; k++) {
        const a = (k / segments) * Math.PI * 2;
        const wobble = 1 + (rand() - 0.5) * 0.18;
        points.push(
          tangent
            .clone()
            .multiplyScalar(Math.cos(a) * radius * wobble)
            .add(bitangent.clone().multiplyScalar(Math.sin(a) * radius * wobble))
            .add(normal.clone().multiplyScalar((rand() - 0.5) * 0.15)),
        );
      }
      const curve = new CatmullRomCurve3(points, true, "catmullrom", 0.5);
      const geometry = new TubeGeometry(curve, 160, 0.006 + rand() * 0.008, 5, true);
      const material = new ShaderMaterial({
        vertexShader: filamentVertex,
        fragmentShader: filamentFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uStretch: { value: 0 },
          uOpacity: { value: 0 },
          uSeed: { value: i * 1.37 + rand() },
          uColor: { value: new Color(subtle ? (i % 2 ? PALETTE.violet : PALETTE.softPurple) : i % 3 === 0 ? PALETTE.lavender : PALETTE.softPurple) },
        },
      });
      return {
        geometry,
        material,
        axis: new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        speed: (0.15 + rand() * 0.4) * (rand() > 0.5 ? 1 : -1),
      };
    });
  }, [subtle]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    filaments.forEach((f, i) => {
      f.material.uniforms.uTime.value = t;
      f.material.uniforms.uStretch.value = bootParams.filamentStretch;
      f.material.uniforms.uOpacity.value = bootParams.filamentOpacity * (subtle ? 0.22 : 1);
      groups.current[i]?.rotateOnAxis(f.axis, delta * f.speed * (1 + bootParams.turbulence));
    });
  });

  return (
    <>
      {filaments.map((f, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)}>
          <mesh geometry={f.geometry} material={f.material} />
        </group>
      ))}
    </>
  );
}
