import type { SystemRegion } from "@/types/universe";

export type AppId = "about" | "projects" | "lab" | "terminal" | "contact";

export interface AppDefinition {
  id: AppId;
  /** Name in the dock, menu bar and palette. */
  title: string;
  /** Process name in the window title bar. */
  process: string;
  pid: number;
  /** The Space (3D region) this app lives in; launching it flies the camera there. */
  region: SystemRegion;
  /** Preferred window size (clamped to the viewport). */
  size: { w: number; h: number };
  /** Where the window opens: beside the region structure, or centred. */
  anchor: "right" | "center";
  shortcut?: string;
}

export const APPS: readonly AppDefinition[] = [
  { id: "about", title: "Memory", process: "memory.app", pid: 0x02, region: "memory", size: { w: 560, h: 620 }, anchor: "right", shortcut: "2" },
  { id: "projects", title: "Files", process: "filesystem.app", pid: 0x03, region: "filesystem", size: { w: 860, h: 600 }, anchor: "right", shortcut: "3" },
  { id: "lab", title: "Processes", process: "process.app", pid: 0x04, region: "process", size: { w: 720, h: 520 }, anchor: "right", shortcut: "4" },
  { id: "contact", title: "Network", process: "network.app", pid: 0x05, region: "network", size: { w: 520, h: 460 }, anchor: "right", shortcut: "5" },
  { id: "terminal", title: "Terminal", process: "ysh", pid: 0x01, region: "core", size: { w: 720, h: 460 }, anchor: "center", shortcut: "`" },
];

export const APP_MAP = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<AppId, AppDefinition>;

export const REGION_APP: Partial<Record<SystemRegion, AppId>> = {
  memory: "about",
  filesystem: "projects",
  process: "lab",
  network: "contact",
};

export const formatPid = (pid: number) => `0x${pid.toString(16).toUpperCase().padStart(2, "0")}`;
