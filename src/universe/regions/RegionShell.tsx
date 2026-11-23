"use client";

import { type ReactNode, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { bootParams } from "@/animation/bootParams";
import { REGION_MAP } from "@/constants/regions";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { REGION_APP } from "@/os/apps";
import { anchors } from "@/os/anchors";
import { useUniverseStore } from "@/store/universeStore";
import { useWindowStore } from "@/store/windowStore";
import type { SystemRegion } from "@/types/universe";

/**
 * Shared wrapper for a region: positions it, reveals it during formation,
 * makes it clickable and shows its system label in universe view.
 */
export function RegionShell({
  id,
  children,
  labelOffset = 6,
}: {
  id: SystemRegion;
  children: ReactNode;
  labelOffset?: number;
}) {
  const region = REGION_MAP[id];
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const interactive = useBootStore((s) => isInteractive(s.phase));
  const cameraMode = useUniverseStore((s) => s.cameraMode);
  const activeRegion = useUniverseStore((s) => s.activeRegion);
  const navigate = useUniverseStore((s) => s.navigate);
  // Clicking a structure launches its app, materialising out of the structure.
  const launch = () => {
    const app = REGION_APP[id];
    if (!app) return navigate(id);
    const a = anchors.regions[id];
    useWindowStore.getState().open(app, { origin: a?.visible ? { x: a.x, y: a.y } : null });
  };

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const reveal = Math.min(1, Math.max(0, bootParams.environmentReveal * 1.25 - region.index * 0.06));
    const s = reveal * (hovered ? 1.06 : 1);
    g.scale.setScalar(Math.max(s, 0.0001));
    g.visible = reveal > 0.001;
  });

  const showLabel = interactive && (cameraMode === "universe" || (activeRegion === "core" && id !== "core"));

  return (
    <group position={region.position}>
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 6) return; // that was a drag, not a click
          if (interactive) launch();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!interactive) return;
          setHovered(true);
          document.body.classList.add("is-hovering-region");
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.classList.remove("is-hovering-region");
        }}
      >
        {children}
      </group>
      {showLabel && id !== "core" && (
        <Html position={[0, labelOffset, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "auto" }}>
          <button
            type="button"
            onClick={launch}
            className="region-label"
            tabIndex={-1}
            aria-hidden
          >
            <span className="region-label__index">0{region.index}</span>
            <span>{region.system}</span>
          </button>
        </Html>
      )}
    </group>
  );
}
