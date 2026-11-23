"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Object3D,
  OctahedronGeometry,
  Vector3,
} from "three";
import { mulberry32, randomUnitVector } from "@/lib/random";
import { RegionShell } from "./RegionShell";
import { edgeMaterial, glassMaterial, glowMaterial } from "./materials";

const tmp = new Object3D();

/** Glass solid with crisp additive edges. */
function Edged({ geometry, position }: { geometry: BufferGeometry; position?: [number, number, number] }) {
  const edges = useMemo(() => new EdgesGeometry(geometry, 20), [geometry]);
  return (
    <group position={position}>
      <mesh geometry={geometry} material={glassMaterial} />
      <lineSegments geometry={edges} material={edgeMaterial} />
    </group>
  );
}

/** CORE — a quiet orbital platform beneath the energy core. */
export function CoreRegion() {
  const ring = useRef<Group>(null);
  useFrame((_, d) => {
    if (ring.current) ring.current.rotation.z += d * 0.05;
  });
  return (
    <RegionShell id="core">
      <group ref={ring} rotation={[-Math.PI / 2 + 0.12, 0, 0]} position={[0, -2.6, 0]}>
        <mesh material={glassMaterial}>
          <ringGeometry args={[2.6, 2.75, 96]} />
        </mesh>
        <mesh material={glassMaterial}>
          <ringGeometry args={[3.3, 3.34, 96]} />
        </mesh>
      </group>
    </RegionShell>
  );
}

/** MEMORY — a neural lattice of nodes with nearest-neighbour connections. */
export function MemoryRegion() {
  const nodes = useRef<InstancedMesh>(null);
  const spin = useRef<Group>(null);
  const { points, lines } = useMemo(() => {
    const rand = mulberry32(11);
    const pts: Vector3[] = [];
    for (let i = 0; i < 46; i++) {
      const [x, y, z] = randomUnitVector(rand);
      pts.push(new Vector3(x, y, z).multiplyScalar(1.2 + rand() * 2.6));
    }
    const pos: number[] = [];
    pts.forEach((a, i) => {
      pts
        .map((b, j) => ({ j, d: a.distanceTo(b) }))
        .filter(({ j }) => j > i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 3)
        .forEach(({ j }) => pos.push(a.x, a.y, a.z, pts[j].x, pts[j].y, pts[j].z));
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return { points: pts, lines: g };
  }, []);

  const memoryCore = useMemo(() => new IcosahedronGeometry(0.7, 0), []);

  useFrame(({ clock }, d) => {
    if (spin.current) spin.current.rotation.y += d * 0.08;
    const m = nodes.current;
    if (!m) return;
    const t = clock.elapsedTime;
    points.forEach((p, i) => {
      tmp.position.copy(p);
      tmp.scale.setScalar(0.07 + 0.05 * (0.5 + 0.5 * Math.sin(t * 1.5 + i * 1.7)));
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <RegionShell id="memory">
      <group ref={spin}>
        <instancedMesh ref={nodes} args={[undefined, undefined, points.length]} material={glowMaterial}>
          <icosahedronGeometry args={[1, 1]} />
        </instancedMesh>
        <lineSegments geometry={lines} material={edgeMaterial} />
        <Edged geometry={memoryCore} />
      </group>
    </RegionShell>
  );
}

/** FILESYSTEM — a floating directory tree of glass slabs; one slab per featured repository. */
export function FilesystemRegion() {
  const tree = useRef<Group>(null);
  const slabs = useMemo(
    () => [
      { y: 1.8, x: -0.6, w: 3.6 },
      { y: 0.6, x: 0.4, w: 3.0 },
      { y: -0.6, x: 1.0, w: 2.6 },
      { y: -1.8, x: 0.2, w: 3.2 },
    ].map((s) => ({ ...s, geometry: new BoxGeometry(s.w, 0.14, 2) })),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    tree.current?.children.forEach((c, i) => {
      c.position.y = slabs[i].y + Math.sin(t * 0.6 + i) * 0.08;
    });
  });
  return (
    <RegionShell id="filesystem">
      <group rotation={[0.1, -0.5, 0]}>
        <group ref={tree}>
          {slabs.map((s, i) => (
            <Edged key={i} position={[s.x, s.y, 0]} geometry={s.geometry} />
          ))}
        </group>
        {/* Spine of the directory tree */}
        <mesh position={[-2.6, 0, 0]} material={glowMaterial}>
          <boxGeometry args={[0.04, 4.2, 0.04]} />
        </mesh>
      </group>
    </RegionShell>
  );
}

/** PROCESS — a CPU die with a grid of process cores pulsing like scheduler load. */
export function ProcessRegion() {
  const grid = useRef<InstancedMesh>(null);
  const die = useRef<Group>(null);
  const N = 7;
  const dieGeometry = useMemo(() => new OctahedronGeometry(1.3, 0), []);
  useFrame(({ clock }, d) => {
    if (die.current) die.current.rotation.y += d * 0.15;
    const m = grid.current;
    if (!m) return;
    const t = clock.elapsedTime;
    let k = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const load = 0.5 + 0.5 * Math.sin(t * 1.3 + i * 0.9 + j * 1.7) * Math.cos(t * 0.7 + j);
        tmp.position.set((i - (N - 1) / 2) * 0.75, -1.6 + load * 0.35, (j - (N - 1) / 2) * 0.75);
        tmp.scale.set(0.5, 0.1 + load * 0.7, 0.5);
        tmp.updateMatrix();
        m.setMatrixAt(k++, tmp.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <RegionShell id="process">
      <group ref={die} position={[0, 0.8, 0]}>
        <Edged geometry={dieGeometry} />
        <mesh material={glowMaterial} scale={0.25}>
          <octahedronGeometry args={[1, 0]} />
        </mesh>
      </group>
      <instancedMesh ref={grid} args={[undefined, undefined, N * N]} material={glassMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]} material={glassMaterial}>
        <ringGeometry args={[3.4, 3.46, 4, 1]} />
      </mesh>
    </RegionShell>
  );
}

/** NETWORK — a portal ring with orbiting relay nodes. */
export function NetworkRegion() {
  const relays = useRef<Group>(null);
  useFrame((_, d) => {
    if (relays.current) relays.current.rotation.z += d * 0.2;
  });
  return (
    <RegionShell id="network" labelOffset={7.5}>
      <mesh material={glassMaterial}>
        <torusGeometry args={[4, 0.12, 16, 120]} />
      </mesh>
      <mesh material={glowMaterial}>
        <torusGeometry args={[3.6, 0.015, 8, 160]} />
      </mesh>
      <group ref={relays}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 4.9, Math.sin(a) * 4.9, 0]} material={glowMaterial} scale={0.14}>
              <icosahedronGeometry args={[1, 1]} />
            </mesh>
          );
        })}
      </group>
    </RegionShell>
  );
}
