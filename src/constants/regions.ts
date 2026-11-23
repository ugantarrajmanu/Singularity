import type { RegionDefinition, SystemRegion, Vec3 } from "@/types/universe";

/**
 * Region registry (roadmap §13.2). Positions are a first pass at the
 * proposed layout in §5.6; tune them here, and everything else follows.
 */
export const REGIONS: readonly RegionDefinition[] = [
  {
    id: "core",
    index: 1,
    system: "CORE",
    label: "Home",
    summary: "Identity and the central energy core.",
    position: [0, 0, 0],
    cameraOffset: [0, 0.6, 13],
    accent: "#A78BFA",
  },
  {
    id: "memory",
    index: 2,
    system: "MEMORY",
    label: "About",
    summary: "Journey, philosophy and technical knowledge.",
    position: [-24, 9, -10],
    cameraOffset: [3, 1.5, 11],
    accent: "#D8D2F5",
  },
  {
    id: "filesystem",
    index: 3,
    system: "FILESYSTEM",
    label: "Projects",
    summary: "Repositories, case studies and professional work.",
    position: [26, 1, -8],
    cameraOffset: [-3, 1.8, 11],
    accent: "#A78BFA",
  },
  {
    id: "process",
    index: 4,
    system: "PROCESS",
    label: "Lab",
    summary: "Running experiments: compilers, systems, physics.",
    position: [17, -13, 10],
    cameraOffset: [-2, 2.5, 11],
    accent: "#7654DB",
  },
  {
    id: "network",
    index: 5,
    system: "NETWORK",
    label: "Contact",
    summary: "Connections and the way out.",
    position: [-30, 17, -38],
    cameraOffset: [4, 0.5, 12],
    accent: "#D8D2F5",
  },
];

export const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<
  SystemRegion,
  RegionDefinition
>;

export const UNIVERSE_VIEW: { position: Vec3; target: Vec3 } = {
  position: [4, 26, 72],
  target: [-2, 0, -10],
};

/** Universe overview, pulled further back on portrait screens so every region fits. */
export function getUniverseView(aspect: number): CameraView {
  if (aspect >= 0.9) return UNIVERSE_VIEW;
  const k = Math.min(2.4, 0.9 / aspect + 0.3);
  const [x, y, z] = UNIVERSE_VIEW.position;
  return { position: [x, y * k, z * k], target: UNIVERSE_VIEW.target };
}

export interface CameraView {
  position: Vec3;
  target: Vec3;
  /** Point free-look orbits around; defaults to target. */
  pivot?: Vec3;
}

/**
 * Camera view for a region, adjusted for viewport shape. On wide screens the
 * target shifts so the structure sits beside the content panel; on narrow
 * screens the camera pulls back and the structure sits above the bottom sheet.
 */
export function getRegionView(id: SystemRegion, aspect: number): CameraView {
  const r = REGION_MAP[id];
  const [px, py, pz] = r.position;
  const [ox, oy, oz] = r.cameraOffset;
  const narrow = aspect < 0.9;
  const pull = narrow ? 1.7 : 1;

  // Shift the look-at point so the structure is framed off-centre.
  // Core: structure on the right (identity text on the left).
  // Others: structure on the left (panel on the right).
  const sideShift = narrow ? 0 : id === "core" ? -3.4 : 3.6;
  const verticalShift = narrow ? -2.2 : 0;

  return {
    position: [px + ox * pull, py + oy * pull, pz + oz * pull],
    target: [px + sideShift, py + verticalShift, pz],
    pivot: [px, py, pz],
  };
}
