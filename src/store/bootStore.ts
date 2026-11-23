import { create } from "zustand";
import type { BootPhase, RenderMode } from "@/types/universe";

/**
 * Discrete boot state only. Continuous animation values live in
 * `animation/bootParams.ts` and are read inside the render loop.
 */
interface BootState {
  phase: BootPhase;
  renderMode: RenderMode;
  /** True once the scene has compiled shaders and rendered a frame. */
  sceneReady: boolean;
  /** Incremented to (re)start the boot timeline. */
  runId: number;
  /** "full" plays the cinematic; "short" fades straight to the final state. */
  runKind: "full" | "short";
  skipToken: number;

  setPhase: (phase: BootPhase) => void;
  setRenderMode: (mode: RenderMode) => void;
  setSceneReady: () => void;
  start: (kind: "full" | "short") => void;
  skip: () => void;
}

export const useBootStore = create<BootState>((set) => ({
  phase: "idle",
  renderMode: "pending",
  sceneReady: false,
  runId: 0,
  runKind: "full",
  skipToken: 0,

  setPhase: (phase) => set({ phase }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setSceneReady: () => set({ sceneReady: true }),
  start: (runKind) => set((s) => ({ runId: s.runId + 1, runKind, phase: "idle" })),
  skip: () => set((s) => ({ skipToken: s.skipToken + 1 })),
}));

/** Phases during which the visitor can navigate. */
export const isInteractive = (phase: BootPhase) => phase === "welcome" || phase === "exploring";
