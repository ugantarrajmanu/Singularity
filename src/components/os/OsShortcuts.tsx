"use client";

import { useEffect } from "react";
import { APPS } from "@/os/apps";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";
import { useWindowStore } from "@/store/windowStore";
import { usePaletteStore } from "./CommandPalette";

/**
 * Global keyboard model:
 *   ⌘K / Ctrl+K  command palette        `  terminal
 *   1            core space             2–5 launch apps (and fly to their space)
 *   U            universe overview      Esc close focused window → back to core
 * During boot: Esc / Enter skips the intro.
 */
export function OsShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (!isInteractive(useBootStore.getState().phase)) return;
        e.preventDefault();
        const p = usePaletteStore.getState();
        p.setOpen(!p.open);
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!isInteractive(useBootStore.getState().phase)) {
        if (e.key === "Escape" || e.key === "Enter") useBootStore.getState().skip();
        return;
      }
      if (usePaletteStore.getState().open) return;

      const win = useWindowStore.getState();
      const uni = useUniverseStore.getState();
      if (e.key === "1") uni.navigate("core");
      else if (e.key === "u" || e.key === "U") uni.showUniverse();
      else if (e.key === "Escape") {
        if (win.focused) win.close(win.focused);
        else uni.navigate("core");
      } else {
        const app = APPS.find((a) => a.shortcut === e.key);
        if (!app) return;
        win.open(app.id);
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

/** Skip-intro button shown only while booting. */
export function SkipIntro() {
  const phase = useBootStore((s) => s.phase);
  const skip = useBootStore((s) => s.skip);
  if (isInteractive(phase) || phase === "idle") return null;
  return (
    <button type="button" className="skip-btn" onClick={skip}>
      Skip intro <kbd>Esc</kbd>
    </button>
  );
}
