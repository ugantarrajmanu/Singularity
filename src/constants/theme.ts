/** Locked Singularity palette (roadmap §2.1). Keep in sync with globals.css. */
export const PALETTE = {
  void: "#090914",
  deepSpace: "#17142B",
  violet: "#7654DB",
  softPurple: "#A78BFA",
  lavender: "#D8D2F5",
  white: "#FFFFFF",
} as const;

/** Visual style of the central singularity. Switch to "energy" for the plasma core. */
export const CORE_STYLE: "blackhole" | "energy" = "blackhole";

/** The opaque primordial plasma "cloud" after the Big Bang. */
export const ENABLE_HAZE = true;
