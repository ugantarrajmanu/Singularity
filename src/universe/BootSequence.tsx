"use client";

import { useEffect } from "react";
import { createBootTimeline, createShortBoot } from "@/animation/bootTimeline";
import { getRegionView } from "@/constants/regions";
import { prefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";
import type { BootPhase } from "@/types/universe";

const SEEN_KEY = "yug-os:booted";

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage unavailable — the intro simply plays again next time */
  }
}

/**
 * Boot sequence controller (roadmap §4.4/§12). Owns the GSAP timeline and
 * maps it onto discrete phases; handles skip, replay, reduced motion and
 * returning visitors. Renders nothing.
 */
export function BootSequence() {
  const runId = useBootStore((s) => s.runId);
  const runKind = useBootStore((s) => s.runKind);
  const renderMode = useBootStore((s) => s.renderMode);

  // First run: decide between the full cinematic and the short path.
  useEffect(() => {
    if (renderMode !== "webgl" || useBootStore.getState().runId > 0) return;
    const short = prefersReducedMotion() || readSeen();
    useBootStore.getState().start(short ? "short" : "full");
  }, [renderMode]);

  useEffect(() => {
    if (runId === 0) return;
    useUniverseStore.getState().reset();

    const coreView = () => getRegionView("core", window.innerWidth / window.innerHeight);
    const onPhase = (phase: BootPhase) => {
      useBootStore.getState().setPhase(phase);
      if (isInteractive(phase)) {
        useUniverseStore.getState().setNavigationEnabled(true);
        writeSeen();
      }
    };

    let active =
      runKind === "full"
        ? createBootTimeline({
            onPhase,
            coreView: coreView(),
            isReady: () => useBootStore.getState().sceneReady,
            subscribeReady: (cb) =>
              useBootStore.subscribe((s) => {
                if (s.sceneReady) cb();
              }),
          })
        : createShortBoot({ onPhase, coreView: coreView(), animate: !prefersReducedMotion() });

    // Skip: replace the running timeline with the short path.
    let handledSkip = useBootStore.getState().skipToken;
    const unsubSkip = useBootStore.subscribe((s) => {
      if (s.skipToken === handledSkip) return;
      handledSkip = s.skipToken;
      if (isInteractive(s.phase)) return;
      active.cleanup();
      active = createShortBoot({ onPhase, coreView: coreView(), animate: false });
    });

    return () => {
      unsubSkip();
      active.cleanup();
    };
  }, [runId, runKind]);

  return null;
}
