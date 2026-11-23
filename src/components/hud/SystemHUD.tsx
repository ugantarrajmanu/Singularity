"use client";

import { useBootStore } from "@/store/bootStore";

const LINES: [string, string][] = [
  ["CORE", "ONLINE"],
  ["ENERGY FIELD", "STABLE"],
  ["SPATIAL ENGINE", "INITIALIZED"],
  ["ENVIRONMENT", "READY"],
];

/** Stage 7 — the system initialisation readout. */
export function SystemHUD() {
  const phase = useBootStore((s) => s.phase);
  if (phase !== "online") return null;

  return (
    <div className="system-hud" role="status" aria-live="polite">
      <div className="system-hud__title">SINGULARITY · ONLINE</div>
      <div className="system-hud__rule" />
      {LINES.map(([k, v], i) => (
        <div key={k} className="system-hud__line" style={{ animationDelay: `${i * 140}ms` }}>
          <span>{k}</span>
          <span className="system-hud__value">{v}</span>
        </div>
      ))}
      <div className="system-hud__rule" />
    </div>
  );
}
