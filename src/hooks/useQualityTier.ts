"use client";

import { useState } from "react";

export interface QualityTier {
  name: "high" | "low" | "mobile";
  particles: number;
  stars: number;
  coreDetail: number;
  bloom: boolean;
  /** [floor, ceiling] that PerformanceMonitor may move between once interactive. */
  dpr: [number, number];
  /** Resolution the cinematic starts at (it never adapts mid-intro). */
  initialDpr: number;
  /** Cheaper black-hole disk noise (2 octaves instead of 4). */
  liteCore: boolean;
}

const HIGH: QualityTier = { name: "high", particles: 26000, stars: 2500, coreDetail: 64, bloom: true, dpr: [1, 1.75], initialDpr: 1.75, liteCore: false };
const LOW: QualityTier = { name: "low", particles: 9000, stars: 1000, coreDetail: 28, bloom: true, dpr: [1, 1.25], initialDpr: 1.25, liteCore: false };
/**
 * Phones and tablets: fill-rate bound (high-DPI panels, small GPUs, thermal
 * limits), so they start at DPR 1 and may drop further, with a cheaper core.
 * Desktops never get this tier.
 */
const MOBILE: QualityTier = { name: "mobile", particles: 9000, stars: 1000, coreDetail: 28, bloom: true, dpr: [0.75, 1.25], initialDpr: 1, liteCore: true };

/** Initial quality guess from device signals; PerformanceMonitor refines DPR at runtime. */
export function useQualityTier(): QualityTier {
  const [tier] = useState<QualityTier>(() => {
    if (typeof window === "undefined") return HIGH;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    if (coarse || small) return MOBILE;
    const cores = navigator.hardwareConcurrency ?? 8;
    return cores <= 4 ? LOW : HIGH;
  });
  return tier;
}
