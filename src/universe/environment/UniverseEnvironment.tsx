"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, PointLight, Vector3 } from "three";
import { bootParams } from "@/animation/bootParams";
import { REGION_MAP } from "@/constants/regions";
import { PALETTE } from "@/constants/theme";
import { useUniverseStore } from "@/store/universeStore";
import {
  CoreRegion,
  FilesystemRegion,
  MemoryRegion,
  NetworkRegion,
  ProcessRegion,
} from "../regions/Regions";
import { EnergyPathways } from "./EnergyPathways";

const accent = new Color();
const lightTarget = new Vector3();

/** The persistent world: lighting, regions and pathways. */
export function UniverseEnvironment() {
  const coreLight = useRef<PointLight>(null);
  const regionLight = useRef<PointLight>(null);

  useFrame((_, delta) => {
    const { activeRegion, cameraMode } = useUniverseStore.getState();
    const k = Math.min(1, delta * 2);
    if (coreLight.current) {
      coreLight.current.intensity = 40 + bootParams.coreIntensity * 60 + bootParams.flash * 400;
    }
    const rl = regionLight.current;
    if (rl) {
      const region = REGION_MAP[activeRegion];
      const on = cameraMode === "region" && activeRegion !== "core";
      accent.set(region.accent);
      rl.color.lerp(accent, k);
      lightTarget.set(region.position[0] + 4, region.position[1] + 6, region.position[2] + 6);
      rl.position.lerp(lightTarget, k);
      rl.intensity += ((on ? 120 : 0) * bootParams.environmentReveal - rl.intensity) * k;
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} color={PALETTE.lavender} />
      <pointLight ref={coreLight} color={PALETTE.softPurple} distance={90} decay={1.4} />
      <pointLight ref={regionLight} color={PALETTE.lavender} distance={40} decay={1.6} intensity={0} />
      <directionalLight position={[10, 20, 10]} intensity={0.4} color={PALETTE.lavender} />

      <CoreRegion />
      <MemoryRegion />
      <FilesystemRegion />
      <ProcessRegion />
      <NetworkRegion />
      <EnergyPathways />
    </>
  );
}
