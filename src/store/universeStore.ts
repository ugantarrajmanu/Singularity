import { create } from "zustand";
import type { CameraMode, SystemRegion } from "@/types/universe";

interface UniverseState {
  activeRegion: SystemRegion;
  activeApplication: string | null;
  cameraMode: CameraMode;
  isTransitioning: boolean;
  navigationEnabled: boolean;
  /** Incremented on every navigation request so the camera re-targets even for the same region. */
  navToken: number;

  navigate: (region: SystemRegion) => void;
  showUniverse: () => void;
  setTransitioning: (value: boolean) => void;
  setNavigationEnabled: (value: boolean) => void;
  openApplication: (id: string | null) => void;
  reset: () => void;
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  activeRegion: "core",
  activeApplication: null,
  cameraMode: "region",
  isTransitioning: false,
  navigationEnabled: false,
  navToken: 0,

  navigate: (region) => {
    if (!get().navigationEnabled) return;
    set((s) => ({
      activeRegion: region,
      cameraMode: "region",
      activeApplication: null,
      navToken: s.navToken + 1,
    }));
  },
  showUniverse: () => {
    if (!get().navigationEnabled) return;
    set((s) => ({ cameraMode: "universe", activeApplication: null, navToken: s.navToken + 1 }));
  },
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  setNavigationEnabled: (navigationEnabled) => set({ navigationEnabled }),
  openApplication: (activeApplication) => set({ activeApplication }),
  reset: () =>
    set((s) => ({
      activeRegion: "core",
      activeApplication: null,
      cameraMode: "region",
      isTransitioning: false,
      navigationEnabled: false,
      navToken: s.navToken + 1,
    })),
}));
