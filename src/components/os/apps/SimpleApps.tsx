"use client";

import { AboutSection, ContactSection, LabSection } from "@/features/sections";

/** memory.app — identity, philosophy, toolbox. */
export function AboutApp() {
  return (
    <div className="app-pad">
      <p className="mono-label">~/about.md</p>
      <h3 className="app-title">About</h3>
      <AboutSection />
    </div>
  );
}

/** process.app — the Engineering Lab as a process monitor. */
export function LabApp() {
  return (
    <div className="app-pad">
      <p className="mono-label">running experiments</p>
      <h3 className="app-title">Engineering Lab</h3>
      <LabSection />
    </div>
  );
}

/** network.app — open a connection. */
export function ContactApp() {
  return (
    <div className="app-pad">
      <p className="mono-label">outbound connections</p>
      <h3 className="app-title">Contact</h3>
      <ContactSection />
    </div>
  );
}
