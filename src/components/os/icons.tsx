import type { AppId } from "@/os/apps";

/** Line icons for the OS apps — one stroke weight, drawn on a 24px grid. */
export function AppIcon({ id, size = 24 }: { id: AppId | "universe" | "core"; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "about": // memory: linked nodes
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="13" r="2.4" />
          <circle cx="7" cy="18.5" r="1.6" />
          <circle cx="17.5" cy="18" r="1.6" />
          <path d="M7.6 8.3l2.8 3M16.4 7.4l-2.9 4M10.4 14.6l-2.3 2.6M13.8 14.7l2.5 2.2M8 7h8" />
        </svg>
      );
    case "projects": // filesystem: folder with stack
      return (
        <svg {...common}>
          <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9.5A1.5 1.5 0 0 0 19.5 8H12l-2-2.5H4.5A1.5 1.5 0 0 0 3 7Z" />
          <path d="M7 12.5h10M7 15.5h6" />
        </svg>
      );
    case "lab": // process: chip
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
          <rect x="9.5" y="9.5" width="5" height="5" />
          <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
        </svg>
      );
    case "terminal":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
          <path d="M7 10l3 2.5L7 15M12.5 15.5H17" />
        </svg>
      );
    case "contact": // network: portal + relays
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5.5" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="12" cy="3.2" r="1.2" />
          <circle cx="20" cy="15.5" r="1.2" />
          <circle cx="4" cy="15.5" r="1.2" />
          <path d="M12 4.4v2.1M18.9 14.9l-2-0.9M5.1 14.9l2-0.9" />
        </svg>
      );
    case "universe": // orbit overview
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-18 12 12)" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="19.5" cy="8.6" r="1.1" />
          <circle cx="4.8" cy="15.6" r="0.9" />
        </svg>
      );
    case "core": // singularity
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="12" rx="9" ry="3.2" />
          <path d="M5 8.5a8 8 0 0 1 14 0" />
        </svg>
      );
  }
}
