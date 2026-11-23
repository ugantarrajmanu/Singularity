import { Vector3 } from "three";

/**
 * Frame-level animation parameters (roadmap §12.2). GSAP tweens these plain
 * objects; render components read them in useFrame and push them into shader
 * uniforms. Nothing here triggers React renders.
 */
export const bootParams = {
  voidGlow: 0,
  coreScale: 0,
  coreIntensity: 0,
  turbulence: 0.15,
  compression: 0,
  filamentStretch: 0,
  filamentOpacity: 0,
  /** Orbit speed multiplier for pre-expansion particles. */
  particleSpeed: 0.6,
  particleOpacity: 0,
  /** 0 = orbiting the core, 1 = fully dispersed cosmic cloud. */
  particleSpread: 0,
  /** 0 = dispersed cloud, 1 = settled into structured geometry. */
  formation: 0,
  /** Cosmic temperature: 1 = white-hot plasma, 0 = cooled to the violet palette. */
  temperature: 1,
  /** Opaque primordial plasma fog; clears at "recombination". */
  haze: 0,
  flash: 0,
  environmentReveal: 0,
  hudReveal: 0,
  /** 0 = black hole hidden (only gathering energy), 1 = revealed after the explosion. */
  holeReveal: 0,
};

export type BootParams = typeof bootParams;

/** Values at the end of the sequence; used by skip, reduced motion and returning visitors. */
export const FINAL_PARAMS: BootParams = {
  voidGlow: 1,
  coreScale: 0.85,
  coreIntensity: 1.25,
  turbulence: 0.45,
  compression: 0,
  filamentStretch: 0.35,
  filamentOpacity: 0.8,
  particleSpeed: 0.5,
  particleOpacity: 1,
  particleSpread: 1,
  formation: 1,
  temperature: 0,
  haze: 0,
  flash: 0,
  environmentReveal: 1,
  hudReveal: 1,
  holeReveal: 1,
};

export const INITIAL_PARAMS: BootParams = { ...bootParams };

/**
 * Camera rig shared by the boot timeline and the navigation controller.
 * The CameraController copies it to the real camera each frame.
 */
export const cameraRig = {
  position: new Vector3(0, 0, 7),
  target: new Vector3(0, 0, 0),
  /** What free-look orbits/zooms around: the subject, not the framing point. */
  pivot: new Vector3(0, 0, 0),
};

export function applyParams(values: BootParams) {
  Object.assign(bootParams, values);
}
