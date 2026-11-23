import gsap from "gsap";
import type { BootPhase } from "@/types/universe";
import type { CameraView } from "@/constants/regions";
import { FINAL_PARAMS, INITIAL_PARAMS, applyParams, bootParams, cameraRig } from "./bootParams";

interface TimelineOptions {
  onPhase: (phase: BootPhase) => void;
  /** Resolves when critical resources are ready. The timeline holds at the threshold until then. */
  isReady: () => boolean;
  subscribeReady: (cb: () => void) => () => void;
  /** Where the camera should land at the end of the sequence. */
  coreView: CameraView;
}

const BOOT_CAMERA_START = { x: 0, y: 0, z: 7 };

/**
 * The full Singularity → Universe cinematic (roadmap §4.2/§4.3), ~10s.
 * One timeline drives every parameter; shaders react to the values.
 */
export function createBootTimeline({ onPhase, isReady, subscribeReady, coreView }: TimelineOptions) {
  applyParams(INITIAL_PARAMS);
  cameraRig.position.set(BOOT_CAMERA_START.x, BOOT_CAMERA_START.y, BOOT_CAMERA_START.z);
  cameraRig.target.set(0, 0, 0);
  cameraRig.pivot.set(0, 0, 0);

  const p = bootParams;
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });
  let unsubscribe: (() => void) | null = null;
  let safety: ReturnType<typeof setTimeout> | null = null;

  // Stage 1 — Void
  tl.call(() => onPhase("void"), [], 0);
  tl.to(p, { voidGlow: 1, duration: 1.2 }, 0);

  // Stage 2 — The singularity: a single, tiny point of light. No matter yet.
  tl.call(() => onPhase("singularity"), [], 0.8);
  tl.to(p, { coreIntensity: 0.6, duration: 1.4, ease: "power2.out" }, 0.8);
  tl.to(cameraRig.position, { z: 6.5, duration: 3.4, ease: "sine.inOut" }, 0.8);

  // Stage 3 — Quantum fluctuations: the point brightens and trembles.
  tl.call(() => onPhase("accumulation"), [], 2.0);
  tl.to(p, { coreIntensity: 1.2, turbulence: 0.7, duration: 1.4, ease: "power1.inOut" }, 2.0);

  // Hold here until critical resources are ready (never a fake percentage).
  tl.call(
    () => {
      if (isReady()) return;
      tl.pause();
      const resume = () => {
        unsubscribe?.();
        unsubscribe = null;
        if (safety) clearTimeout(safety);
        safety = null;
        tl.resume();
      };
      unsubscribe = subscribeReady(resume);
      // Never trap the visitor: continue after 6s regardless.
      safety = setTimeout(resume, 6000);
    },
    [],
    3.4,
  );

  // Stage 4 — Threshold: unbearable density, the point flickers violently.
  tl.call(() => onPhase("threshold"), [], 3.5);
  tl.to(p, { turbulence: 1.6, coreIntensity: 2.2, duration: 0.7, ease: "power2.in" }, 3.5);
  tl.to(p, { compression: 1, duration: 0.25, ease: "power3.in" }, 4.05);

  // Stage 5 — The Big Bang.
  // Inflation: space itself stretches from the point almost instantly — a
  // uniform expansion everywhere, not an explosion into existing space.
  tl.call(() => onPhase("expansion"), [], 4.3);
  tl.set(p, { flash: 1, haze: 1, temperature: 1, particleOpacity: 1, compression: 0 }, 4.3);
  tl.to(p, { flash: 0, duration: 0.35, ease: "power2.out" }, 4.3);
  // One continuous curve: a violent initial burst that decelerates smoothly.
  // (Two chained tweens made the cloud stall for ~150ms between them.)
  tl.to(p, { particleSpread: 1, duration: 3.4, ease: "power3.out" }, 4.3);
  tl.to(p, { temperature: 0, duration: 2.8, ease: "power2.out" }, 4.35);
  // …until recombination: the opaque plasma fog clears and light travels freely.
  tl.to(p, { haze: 0, duration: 1.3, ease: "power2.in" }, 5.3);
  tl.to(p, { coreIntensity: 1.25, turbulence: 0.45, particleSpeed: 0.5, coreScale: 0.85, duration: 1.2 }, 4.4);
  // The black hole condenses at the centre once the fog has cleared.
  tl.to(p, { filamentOpacity: 0.8, filamentStretch: 0.35, duration: 0.1 }, 6.0);
  tl.to(p, { holeReveal: 1, duration: 3.0, ease: "power1.inOut" }, 5.8);

  // Stage 6 — Universe formation
  tl.call(() => onPhase("formation"), [], 6.0);
  tl.to(p, { formation: 1, duration: 2.8, ease: "power2.inOut" }, 6.0);
  tl.to(p, { environmentReveal: 1, duration: 2.6, ease: "power1.inOut" }, 6.3);

  // One continuous camera move from the bang to the Core view. The camera
  // only ever pulls back (never out-and-back), with a gentle rise and a slight
  // sideways drift, so it never slows to a stop while the black hole forms.
  // (Chained tweens used to overlap here and stall the camera mid-formation.)
  const from = { x: cameraRig.position.x, y: cameraRig.position.y, z: 6.5 };
  const to = { x: coreView.position[0], y: coreView.position[1], z: coreView.position[2] };
  const look = { x: coreView.target[0], y: coreView.target[1], z: coreView.target[2] };
  const path = { u: 0 };
  tl.to(
    path,
    {
      u: 1,
      duration: 5.4,
      ease: "sine.inOut",
      onUpdate: () => {
        const u = path.u;
        const arc = Math.sin(Math.PI * u);
        cameraRig.position.set(
          from.x + (to.x - from.x) * u + arc * 2.0,
          from.y + (to.y - from.y) * u + arc * 2.5,
          from.z + (to.z - from.z) * u,
        );
        // The look-at point drifts to its off-centre framing in the second half.
        const k = Math.min(1, Math.max(0, (u - 0.4) / 0.6));
        const e = k * k * (3 - 2 * k);
        cameraRig.target.set(look.x * e, look.y * e, look.z * e);
      },
    },
    4.4,
  );

  // Stage 7 — System online
  tl.call(() => onPhase("online"), [], 8.6);
  tl.to(p, { hudReveal: 1, duration: 0.4 }, 8.6);

  // Stage 8 — Welcome
  tl.call(() => onPhase("welcome"), [], 9.8);

  const cleanup = () => {
    unsubscribe?.();
    if (safety) clearTimeout(safety);
    tl.kill();
  };

  return { timeline: tl, cleanup };
}

/**
 * Short path for skip, reduced motion and returning visitors: snap the
 * universe into place and fade it in without the cinematic.
 */
export function createShortBoot({
  onPhase,
  coreView,
  animate,
}: {
  onPhase: (phase: BootPhase) => void;
  coreView: CameraView;
  animate: boolean;
}) {
  gsap.killTweensOf(bootParams);
  gsap.killTweensOf(cameraRig.position);
  gsap.killTweensOf(cameraRig.target);

  const target = { ...FINAL_PARAMS };
  const fadeKeys = ["voidGlow", "coreIntensity", "particleOpacity", "environmentReveal", "filamentOpacity", "holeReveal"] as const;

  applyParams({ ...target, ...(animate ? Object.fromEntries(fadeKeys.map((k) => [k, 0])) : {}) });
  cameraRig.position.set(...coreView.position);
  cameraRig.target.set(...coreView.target);
  cameraRig.pivot.set(0, 0, 0);

  const tl = gsap.timeline();
  if (animate) {
    tl.to(bootParams, { ...Object.fromEntries(fadeKeys.map((k) => [k, target[k]])), duration: 1.2, ease: "power1.out" });
  }
  tl.call(() => onPhase("welcome"));
  return { timeline: tl, cleanup: () => tl.kill() };
}
