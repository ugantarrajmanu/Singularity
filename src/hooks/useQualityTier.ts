"use client";

import { useState } from "react";

export interface QualityTier {
  name: "high" | "low";
  particles: number;
  stars: number;
  coreDetail: number;
  bloom: boolean;
  dpr: [number, number];
}

const HIGH: QualityTier = { name: "high", particles: 26000, stars: 2500, coreDetail: 64, bloom: true, dpr: [1, 1.75] };
const LOW: QualityTier = { name: "low", particles: 9000, stars: 1000, coreDetail: 28, bloom: true, dpr: [1, 1.25] };

/** Initial quality guess from device signals; PerformanceMonitor refines DPR at runtime. */
export function useQualityTier(): QualityTier {
  const [tier] = useState<QualityTier>(() => {
    if (typeof window === "undefined") return HIGH;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const cores = navigator.hardwareConcurrency ?? 8;
    return coarse || small || cores <= 4 ? LOW : HIGH;
  });
  return tier;
}
