"use client";

import { PROFILE } from "@/content/profile";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";
import { hasVisibleWindows, useWindowStore } from "@/store/windowStore";

/** Stage 8 — identity in oversized editorial type beside the core. */
export function WelcomeInterface() {
  const phase = useBootStore((s) => s.phase);
  const activeRegion = useUniverseStore((s) => s.activeRegion);
  const cameraMode = useUniverseStore((s) => s.cameraMode);
  const showUniverse = useUniverseStore((s) => s.showUniverse);
  const windowsOpen = useWindowStore(hasVisibleWindows);
  const open = useWindowStore((s) => s.open);

  // The identity is the desktop: it steps back while windows are open.
  const visible = isInteractive(phase) && activeRegion === "core" && cameraMode === "region" && !windowsOpen;

  return (
    <section className={`welcome ${visible ? "is-visible" : ""}`} aria-hidden={!visible} inert={!visible}>
      <p className="mono-label welcome__eyebrow">~/core — identity</p>
      <h1 className="welcome__name">{PROFILE.name}</h1>
      <p className="welcome__tagline">{PROFILE.tagline}</p>
      <ul className="welcome__roles">
        {PROFILE.roles.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <div className="welcome__actions">
        <button type="button" className="btn btn--primary" onClick={() => open("projects")}>
          Explore projects
        </button>
        <button type="button" className="btn" onClick={() => open("terminal")}>
          Open terminal <kbd>`</kbd>
        </button>
        <button type="button" className="btn" onClick={showUniverse}>
          View universe
        </button>
        {PROFILE.contact.resume && (
          <a className="btn" href={PROFILE.contact.resume}>
            Resume
          </a>
        )}
      </div>
    </section>
  );
}
