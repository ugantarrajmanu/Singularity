"use client";

import { useSyncExternalStore } from "react";

export const MOBILE_QUERY = "(max-width: 760px)";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** True below the phone breakpoint, where windows open full-screen. */
export const useIsMobile = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
