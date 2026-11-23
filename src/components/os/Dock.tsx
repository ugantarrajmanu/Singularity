"use client";

import { useEffect, useRef } from "react";
import { APPS, type AppId } from "@/os/apps";
import { anchors } from "@/os/anchors";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";
import { useWindowStore } from "@/store/windowStore";
import { AppIcon } from "./icons";

const ORDER: AppId[] = ["terminal", "projects", "about", "lab", "contact"];

/** Floating dock: launch / restore / focus apps; dots mark running processes. */
export function Dock() {
  const interactive = useBootStore((s) => isInteractive(s.phase));
  const windows = useWindowStore((s) => s.windows);
  const focused = useWindowStore((s) => s.focused);
  const cameraMode = useUniverseStore((s) => s.cameraMode);
  const activeRegion = useUniverseStore((s) => s.activeRegion);
  const refs = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});

  // Publish icon centres so windows can minimise into the dock.
  useEffect(() => {
    const update = () => {
      for (const id of ORDER) {
        const r = refs.current[id]?.getBoundingClientRect();
        if (r) anchors.dock[id] = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [interactive]);

  const launch = (id: AppId) => {
    const { windows: ws, focused: f, open, minimize } = useWindowStore.getState();
    const w = ws[id];
    if (w && !w.minimized && f === id) return minimize(id);
    open(id, { origin: anchors.dock[id] ?? null });
  };

  return (
    <nav className={`dock ${interactive ? "is-visible" : ""}`} aria-label="Dock">
      <ul className="dock__list">
        <li>
          <button
            type="button"
            className={`dock__item ${cameraMode === "region" && activeRegion === "core" ? "is-active" : ""}`}
            onClick={() => useUniverseStore.getState().navigate("core")}
            disabled={!interactive}
            aria-label="Core — home"
          >
            <AppIcon id="core" />
            <span className="dock__tip">Core</span>
          </button>
        </li>
        <li className="dock__sep" aria-hidden />
        {ORDER.map((id) => {
          const app = APPS.find((a) => a.id === id)!;
          const running = Boolean(windows[id]);
          return (
            <li key={id}>
              <button
                ref={(el) => void (refs.current[id] = el)}
                type="button"
                className={`dock__item ${focused === id && !windows[id]?.minimized ? "is-focused" : ""}`}
                onClick={() => launch(id)}
                disabled={!interactive}
                aria-label={`${app.title}${running ? " (running)" : ""}`}
              >
                <AppIcon id={id} />
                <span className="dock__tip">
                  {app.title}
                  {app.shortcut && <kbd>{app.shortcut}</kbd>}
                </span>
                {running && <span className="dock__dot" aria-hidden />}
              </button>
            </li>
          );
        })}
        <li className="dock__sep" aria-hidden />
        <li>
          <button
            type="button"
            className={`dock__item ${cameraMode === "universe" ? "is-active" : ""}`}
            onClick={() => useUniverseStore.getState().showUniverse()}
            disabled={!interactive}
            aria-label="Universe overview"
          >
            <AppIcon id="universe" />
            <span className="dock__tip">
              Universe <kbd>U</kbd>
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
