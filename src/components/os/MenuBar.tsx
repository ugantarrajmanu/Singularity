"use client";

import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/constants/regions";
import { APP_MAP } from "@/os/apps";
import { formatUptime } from "@/os/terminal/commands";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";
import { useWindowStore } from "@/store/windowStore";
import { usePaletteStore } from "./CommandPalette";

/** Live, real system readouts: frame rate, session uptime, local clock. */
function SystemStats() {
  const [stats, setStats] = useState({ fps: 0, uptime: "0s", clock: "" });
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 1000) {
        const now = new Date();
        setStats({
          fps: Math.round((frames * 1000) / (t - last)),
          uptime: formatUptime(performance.now()),
          clock: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="menubar__stats" aria-hidden>
      <span>
        <b>{stats.fps}</b> FPS
      </span>
      <span>UP {stats.uptime}</span>
      <span className="menubar__clock">{stats.clock}</span>
    </div>
  );
}

/** Top system bar: OS menu, active app, Spaces switcher, live stats, launcher. */
export function MenuBar() {
  const interactive = useBootStore((s) => isInteractive(s.phase));
  const focused = useWindowStore((s) => s.focused);
  const activeRegion = useUniverseStore((s) => s.activeRegion);
  const cameraMode = useUniverseStore((s) => s.cameraMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  const activeName = focused ? APP_MAP[focused].title : "Desktop";
  const menuAction = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className={`menubar ${interactive ? "is-visible" : ""}`}>
      <div className="menubar__left" ref={menuRef}>
        <button
          type="button"
          className="menubar__logo"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          disabled={!interactive}
        >
          <span className="brand__mark" aria-hidden />
          <span className="brand__name">SINGULARITY</span>
        </button>
        {menuOpen && (
          <div className="menubar__menu" role="menu">
            <button role="menuitem" type="button" onClick={menuAction(() => useWindowStore.getState().open("about"))}>
              About this engineer
            </button>
            <button
              role="menuitem"
              type="button"
              onClick={menuAction(() => usePaletteStore.getState().setOpen(true))}
            >
              Command palette <kbd>⌘K</kbd>
            </button>
            <hr />
            <button
              role="menuitem"
              type="button"
              onClick={menuAction(() => {
                useWindowStore.getState().closeAll();
                useBootStore.getState().start("full");
              })}
            >
              Restart (replay boot)
            </button>
            <button
              role="menuitem"
              type="button"
              // Full reload so WebGL detection re-runs with ?static.
              onClick={menuAction(() => window.location.assign("/?static"))}
            >
              Static version
            </button>
          </div>
        )}
        <span className="menubar__app">{activeName}</span>
      </div>

      <div className="menubar__spaces" role="group" aria-label="Spaces">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={cameraMode === "region" && activeRegion === r.id ? "is-active" : ""}
            onClick={() => useUniverseStore.getState().navigate(r.id)}
            disabled={!interactive}
            title={`${r.system} space`}
            aria-label={`${r.system} space`}
          >
            <span>{r.system}</span>
          </button>
        ))}
      </div>

      <div className="menubar__right">
        <SystemStats />
        <button
          type="button"
          className="menubar__search"
          onClick={() => usePaletteStore.getState().setOpen(true)}
          disabled={!interactive}
          aria-label="Open command palette"
        >
          <svg viewBox="0 0 16 16" aria-hidden>
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <kbd>⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
