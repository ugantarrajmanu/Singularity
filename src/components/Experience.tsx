"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect } from "react";
import { SystemHUD } from "@/components/hud/SystemHUD";
import { WelcomeInterface } from "@/components/hud/WelcomeInterface";
import { CommandPalette } from "@/components/os/CommandPalette";
import { Dock } from "@/components/os/Dock";
import { MenuBar } from "@/components/os/MenuBar";
import { OsShortcuts, SkipIntro } from "@/components/os/OsShortcuts";
import { WindowManager } from "@/components/os/WindowManager";
import { useBootStore } from "@/store/bootStore";
import { BootSequence } from "@/universe/BootSequence";

const UniverseCanvas = dynamic(() => import("@/universe/UniverseCanvas"), { ssr: false });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Client root. Chooses WebGL or the static fallback, then layers the
 * persistent canvas, boot controller, HUD, navigation and panels.
 * `fallback` is server-rendered HTML with all essential content.
 */
export function Experience({ fallback }: { fallback: ReactNode }) {
  const renderMode = useBootStore((s) => s.renderMode);
  const setRenderMode = useBootStore((s) => s.setRenderMode);

  useEffect(() => {
    const forceStatic = new URLSearchParams(window.location.search).has("static");
    setRenderMode(!forceStatic && supportsWebGL() ? "webgl" : "fallback");
  }, [setRenderMode]);

  if (renderMode !== "webgl") {
    return <div className={renderMode === "pending" ? "fallback-pending" : undefined}>{fallback}</div>;
  }

  return (
    <div className="experience">
      <UniverseCanvas />
      <div className="vignette" aria-hidden />
      <BootSequence />
      <OsShortcuts />
      <SystemHUD />
      <main id="content">
        <WelcomeInterface />
        <WindowManager />
      </main>
      <MenuBar />
      <Dock />
      <CommandPalette />
      <SkipIntro />
    </div>
  );
}
