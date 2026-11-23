import { create } from "zustand";
import { APP_MAP, type AppId } from "@/os/apps";
import type { Point } from "@/os/anchors";
import { useUniverseStore } from "./universeStore";

export const MENUBAR_H = 36;
export const DOCK_SPACE = 92;

export interface WindowRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowState extends WindowRect {
  id: AppId;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Where the open animation starts (a 3D region or dock icon), if any. */
  origin: Point | null;
  /** App-specific argument, e.g. a project slug for Files. `nonce` changes on every open. */
  payload: string | null;
  nonce: number;
}

interface WindowManagerState {
  windows: Partial<Record<AppId, WindowState>>;
  focused: AppId | null;
  zTop: number;

  open: (id: AppId, opts?: { origin?: Point | null; payload?: string | null; fly?: boolean }) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  minimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  setRect: (id: AppId, rect: Partial<WindowRect>) => void;
  closeAll: () => void;
}

function initialRect(id: AppId, openCount: number): WindowRect {
  const app = APP_MAP[id];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(app.size.w, vw - 32);
  const h = Math.min(app.size.h, vh - MENUBAR_H - DOCK_SPACE - 24);
  const cascade = (openCount % 5) * 28;
  const x =
    app.anchor === "right"
      ? Math.max(16, vw - w - Math.max(32, vw * 0.05) - cascade)
      : Math.max(16, (vw - w) / 2 + cascade);
  const y = MENUBAR_H + Math.max(16, (vh - MENUBAR_H - DOCK_SPACE - h) / 2) + cascade * 0.6;
  return { x, y, w, h };
}

/** Keep windows reachable: the title bar can never leave the screen. */
export function clampRect(r: WindowRect): WindowRect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(320, Math.min(r.w, vw - 16));
  const h = Math.max(220, Math.min(r.h, vh - MENUBAR_H - 16));
  return {
    w,
    h,
    x: Math.min(Math.max(r.x, -w + 120), vw - 120),
    y: Math.min(Math.max(r.y, MENUBAR_H + 4), vh - 64),
  };
}

export const useWindowStore = create<WindowManagerState>((set, get) => ({
  windows: {},
  focused: null,
  zTop: 10,

  open: (id, opts = {}) => {
    const { windows, zTop } = get();
    const existing = windows[id];
    const z = zTop + 1;
    const openCount = Object.values(windows).filter((w) => w && !w.minimized).length;
    const next: WindowState = existing
      ? {
          ...existing,
          minimized: false,
          z,
          origin: existing.minimized ? (opts.origin ?? existing.origin) : null,
          payload: opts.payload ?? existing.payload,
          nonce: existing.nonce + 1,
        }
      : {
          id,
          ...initialRect(id, openCount),
          z,
          minimized: false,
          maximized: false,
          origin: opts.origin ?? null,
          payload: opts.payload ?? null,
          nonce: 1,
        };
    set({ windows: { ...windows, [id]: next }, focused: id, zTop: z });
    // Launching an app travels to its Space.
    if (opts.fly !== false) useUniverseStore.getState().navigate(APP_MAP[id].region);
  },

  close: (id) => {
    const windows = { ...get().windows };
    delete windows[id];
    set({ windows, focused: topmost(windows) });
  },

  focus: (id) => {
    const { windows, zTop, focused } = get();
    const w = windows[id];
    if (!w || (focused === id && w.z === zTop)) return;
    const z = zTop + 1;
    set({ windows: { ...windows, [id]: { ...w, z } }, focused: id, zTop: z });
  },

  minimize: (id) => {
    const windows = get().windows;
    const w = windows[id];
    if (!w) return;
    const next = { ...windows, [id]: { ...w, minimized: true } };
    set({ windows: next, focused: topmost(next) });
  },

  toggleMaximize: (id) => {
    const windows = get().windows;
    const w = windows[id];
    if (!w) return;
    set({ windows: { ...windows, [id]: { ...w, maximized: !w.maximized } } });
  },

  setRect: (id, rect) => {
    const windows = get().windows;
    const w = windows[id];
    if (!w) return;
    set({ windows: { ...windows, [id]: { ...w, ...clampRect({ ...w, ...rect }), maximized: false } } });
  },

  closeAll: () => set({ windows: {}, focused: null }),
}));

function topmost(windows: Partial<Record<AppId, WindowState>>): AppId | null {
  let best: WindowState | null = null;
  for (const w of Object.values(windows)) {
    if (w && !w.minimized && (!best || w.z > best.z)) best = w;
  }
  return best?.id ?? null;
}

export const hasVisibleWindows = (s: WindowManagerState) =>
  Object.values(s.windows).some((w) => w && !w.minimized);
