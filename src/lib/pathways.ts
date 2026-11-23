import { CatmullRomCurve3, Vector3 } from "three";
import { REGIONS } from "@/constants/regions";
import type { SystemRegion } from "@/types/universe";

/**
 * Curved pathways from the core to each region. Shared by the pathway meshes
 * and the particle formation targets so the data streams follow the same paths.
 */
export function createPathwayCurves(): { id: SystemRegion; curve: CatmullRomCurve3 }[] {
  return REGIONS.filter((r) => r.id !== "core").map((r) => {
    const end = new Vector3(...r.position);
    const start = end.clone().normalize().multiplyScalar(2.2);
    const mid = end.clone().multiplyScalar(0.5);
    // Arch each pathway away from the core plane for spatial depth.
    mid.y += 4 + end.length() * 0.08;
    mid.add(new Vector3(-end.z, 0, end.x).normalize().multiplyScalar(3));
    const nearEnd = end.clone().multiplyScalar(0.82);
    nearEnd.y += 1.5;
    return { id: r.id, curve: new CatmullRomCurve3([start, mid, nearEnd, end], false, "centripetal") };
  });
}
