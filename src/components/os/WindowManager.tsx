"use client";

import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { AppId } from "@/os/apps";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useWindowStore } from "@/store/windowStore";
import { FilesApp } from "./apps/FilesApp";
import { AboutApp, ContactApp, LabApp } from "./apps/SimpleApps";
import { TerminalApp } from "./apps/TerminalApp";
import { Window } from "./Window";

/**
 * App contents are memoised on what they actually depend on, so moving,
 * resizing or focusing a window never re-renders the app inside it.
 */
const AppContent = memo(function AppContent({ id, payload, nonce }: { id: AppId; payload: string | null; nonce: number }) {
  switch (id) {
    case "about":
      return <AboutApp />;
    case "projects":
      return <FilesApp payload={payload} nonce={nonce} />;
    case "lab":
      return <LabApp />;
    case "contact":
      return <ContactApp />;
    case "terminal":
      return <TerminalApp />;
  }
});

/** Subscribes to one window only: dragging it doesn't re-render its siblings. */
function WindowSlot({ id, mobile }: { id: AppId; mobile: boolean }) {
  const win = useWindowStore((s) => s.windows[id]);
  if (!win) return null;
  return (
    <Window win={win} mobile={mobile}>
      <AppContent id={id} payload={win.payload} nonce={win.nonce} />
    </Window>
  );
}

/** Renders every open window. Minimised windows stay mounted but hidden, so their state is kept. */
export function WindowManager() {
  const ids = useWindowStore(useShallow((s) => (Object.keys(s.windows) as AppId[]).filter((id) => s.windows[id])));
  const interactive = useBootStore((s) => isInteractive(s.phase));
  const mobile = useIsMobile();
  if (!interactive) return null;

  return (
    <div className="window-layer">
      {ids.map((id) => (
        <WindowSlot key={id} id={id} mobile={mobile} />
      ))}
    </div>
  );
}
