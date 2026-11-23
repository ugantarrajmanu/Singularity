export type BootPhase =
  | "idle"
  | "void"
  | "singularity"
  | "accumulation"
  | "threshold"
  | "expansion"
  | "formation"
  | "online"
  | "welcome"
  | "exploring";

export type SystemRegion = "core" | "memory" | "filesystem" | "process" | "network";

export type CameraMode = "region" | "universe";

export type RenderMode = "pending" | "webgl" | "fallback";

export type Vec3 = [number, number, number];

export interface RegionDefinition {
  id: SystemRegion;
  index: number;
  /** OS subsystem name shown in the HUD. */
  system: string;
  /** Human-readable section name. */
  label: string;
  summary: string;
  /** World-space centre of the region's structure. */
  position: Vec3;
  /** Camera offset from `position` when the region is active. */
  cameraOffset: Vec3;
  /** Light tint used when the region is active. */
  accent: string;
}
