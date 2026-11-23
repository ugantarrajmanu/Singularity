import { setConsoleFunction } from "three";

/**
 * three.js r183 deprecated THREE.Clock, but @react-three/fiber 9.x still
 * creates one internally for its frame clock (fixed upstream in R3F v10).
 * The warning is harmless and not actionable from app code, so drop exactly
 * that message and forward every other three.js log/warn/error unchanged.
 *
 * Remove this file once R3F v10 is stable and installed.
 */
const SILENCED = ["THREE.Clock: This module has been deprecated"];

setConsoleFunction((type: "log" | "warn" | "error", message: string, ...params: unknown[]) => {
  if (typeof message === "string" && SILENCED.some((s) => message.startsWith(s))) return;
  console[type](message, ...params);
});
