import type { SystemRegion } from "@/types/universe";
import type { AppId } from "./apps";

export interface Point {
  x: number;
  y: number;
}

/**
 * Screen-space anchors shared between the 3D scene and the window manager,
 * updated outside React (no re-renders):
 *  - regions: each region's projected screen position, written every frame by
 *    the canvas, so windows can open out of / minimise into their 3D structure.
 *  - dock: centre of each dock icon, so windows can minimise into the dock.
 */
export const anchors = {
  regions: {} as Partial<Record<SystemRegion, Point & { visible: boolean }>>,
  dock: {} as Partial<Record<AppId, Point>>,
};
