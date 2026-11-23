import { Vector3 } from "three";
import { REGION_MAP } from "@/constants/regions";
import { createPathwayCurves } from "./pathways";
import { mulberry32, randomUnitVector } from "./random";

export interface ParticleBuffers {
  orbit: Float32Array;
  cloud: Float32Array;
  target: Float32Array;
  seed: Float32Array;
  speed: Float32Array;
  count: number;
}

type Writer = (x: number, y: number, z: number) => void;

const snap = (v: number, step: number) => Math.round(v / step) * step;

/**
 * Deterministic particle states for the singularity → universe sequence
 * (roadmap §11.3). Random cloud positions resolve into structured, quantised
 * geometry — the transition from cosmic chaos to an organised OS.
 */
export function createParticleBuffers(count: number): ParticleBuffers {
  const rand = mulberry32(0x9e3779b9);
  const orbit = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const speed = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const [ux, uy, uz] = randomUnitVector(rand);
    const r = 0.02 + rand() * 0.04; // all matter begins inside the singularity
    orbit.set([ux * r, uy * r, uz * r], i * 3);

    const [cx, cy, cz] = randomUnitVector(rand);
    const dist = 8 + Math.pow(rand(), 0.6) * 75;
    cloud.set([cx * dist, cy * dist * 0.55, cz * dist], i * 3);

    seed[i] = rand();
    speed[i] = (0.5 + rand() * 1.0) * (rand() > 0.5 ? 1 : -1);
  }

  // Assign formation targets in structured groups.
  let cursor = 0;
  const write: Writer = (x, y, z) => {
    if (cursor >= count) return;
    target.set([x, y, z], cursor * 3);
    cursor++;
  };
  const budget = (fraction: number) => Math.floor(count * fraction);

  // Orbital rings around the core.
  const rings = [3.4, 4.6, 6.1, 7.9, 10.2, 13.2];
  const ringBudget = budget(0.18);
  rings.forEach((radius, ri) => {
    const n = Math.floor(ringBudget / rings.length);
    const tilt = (ri % 2 === 0 ? 1 : -1) * (0.08 + ri * 0.03);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      write(x, z * Math.sin(tilt), z * Math.cos(tilt));
    }
  });

  // Region formations — each subsystem gets its own structured signature.
  const regionBudget = budget(0.09);
  const at = (id: keyof typeof REGION_MAP) => new Vector3(...REGION_MAP[id].position);

  // Memory: Fibonacci sphere lattice (neural / memory cells).
  {
    const c = at("memory");
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let k = 0; k < regionBudget; k++) {
      const y = 1 - (k / (regionBudget - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * k;
      const shell = 4.2 + (k % 3) * 0.9;
      write(c.x + Math.cos(th) * rr * shell, c.y + y * shell, c.z + Math.sin(th) * rr * shell);
    }
  }
  // Filesystem: quantised cuboid lattice (blocks / sectors).
  {
    const c = at("filesystem");
    for (let k = 0; k < regionBudget; k++) {
      const x = snap((rand() - 0.5) * 9, 0.75);
      const y = snap((rand() - 0.5) * 6, 0.75);
      const z = snap((rand() - 0.5) * 6, 0.75);
      // Keep only the outer shell of the lattice.
      const edge = Math.abs(x) > 3.7 || Math.abs(y) > 2.2 || Math.abs(z) > 2.2;
      if (edge) write(c.x + x, c.y + y, c.z + z);
      else write(c.x + x, c.y - 3.4, c.z + z);
    }
  }
  // Process: concentric circuit squares in a plane.
  {
    const c = at("process");
    const squares = 5;
    const per = Math.floor(regionBudget / squares);
    for (let s = 0; s < squares; s++) {
      const half = 1.6 + s * 1.15;
      for (let k = 0; k < per; k++) {
        const t = (k / per) * 4;
        const side = Math.floor(t);
        const f = (t - side) * 2 - 1;
        const pts: [number, number][] = [
          [f * half, -half],
          [half, f * half],
          [-f * half, half],
          [-half, -f * half],
        ];
        const [x, z] = pts[side];
        write(c.x + x, c.y - 2.4 + s * 0.05, c.z + z);
      }
    }
  }
  // Network: torus portal.
  {
    const c = at("network");
    for (let k = 0; k < regionBudget; k++) {
      const u = (k / regionBudget) * Math.PI * 2 * 7;
      const v = rand() * Math.PI * 2;
      const R = 5.2;
      const rr = 0.55;
      write(
        c.x + (R + rr * Math.cos(v)) * Math.cos(u),
        c.y + (R + rr * Math.cos(v)) * Math.sin(u),
        c.z + rr * Math.sin(v),
      );
    }
  }

  // Data streams along the pathways.
  const curves = createPathwayCurves();
  const streamBudget = budget(0.14);
  const p = new Vector3();
  for (let k = 0; k < streamBudget; k++) {
    const { curve } = curves[k % curves.length];
    curve.getPoint(rand(), p);
    write(p.x + (rand() - 0.5) * 0.5, p.y + (rand() - 0.5) * 0.5, p.z + (rand() - 0.5) * 0.5);
  }

  // Digital floor: a vast, quiet grid beneath the universe.
  const floorBudget = budget(0.16);
  const side = Math.floor(Math.sqrt(floorBudget));
  const spacing = 3.2;
  for (let gx = 0; gx < side; gx++) {
    for (let gz = 0; gz < side; gz++) {
      write((gx - side / 2) * spacing, -24, (gz - side / 2) * spacing - 10);
    }
  }

  // Remaining particles stay as cosmic dust, quantised to a coarse grid.
  while (cursor < count) {
    const [dx, dy, dz] = randomUnitVector(rand);
    const d = 20 + rand() * 70;
    write(snap(dx * d, 2), snap(dy * d * 0.6, 2), snap(dz * d, 2));
  }

  return { orbit, cloud, target, seed, speed, count };
}
