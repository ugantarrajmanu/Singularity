"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { REGIONS } from "@/constants/regions";
import { anchors } from "@/os/anchors";

const v = new Vector3();

/** Projects each region's world position to screen space every frame for the window manager. */
export function RegionProjector() {
  useFrame(({ camera, size }) => {
    for (const r of REGIONS) {
      v.set(...r.position).project(camera);
      anchors.regions[r.id] = {
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
        visible: v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2,
      };
    }
  });
  return null;
}
