export type ProjectStatus = "shipped" | "in-progress" | "planned";

export interface Project {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  status: ProjectStatus;
  stack: string[];
  repo?: string;
  demo?: string;
  featured: boolean;
  /** Case-study sections. Keep every claim true — planned work is labelled as planned. */
  sections: { heading: string; body: string[] }[];
}

/**
 * Sourced from public repositories at github.com/ugantarrajmanu.
 * Personal projects only. N-Body text is deliberately generic until you add details.
 */
export const PROJECTS: Project[] = [
  {
    slug: "yulang",
    title: "YUlanG",
    kicker: "Toy programming language & interpreter",
    summary:
      "An interpreted esoteric language with Hinglish keywords, built on a Flex lexer and a Bison parser that builds an annotated parse tree and evaluates it.",
    status: "shipped",
    stack: ["C", "Flex", "Bison"],
    repo: "https://github.com/ugantarrajmanu/YUlanG",
    demo: "https://yulang-front.vercel.app/",
    featured: true,
    sections: [
      {
        heading: "Language design",
        body: [
          'Programs read like spoken Hinglish: `yug "Hello Butterflies" likhna hai` prints a string, `arey yug a = 5 int hai` declares an integer.',
          "Supports int and string types, if / else (`agar … hai to { } nahi to { }`) and ranged for loops (`yug i ko 0 se 5 tak lejana hai`).",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Flex tokenises source into lexemes; Bison grammar rules build an annotated parse tree; the interpreter evaluates statements line by line, so execution proceeds until the first error.",
        ],
      },
      {
        heading: "Next",
        body: [
          "Planned: compile the C interpreter to WebAssembly with Emscripten so it runs in the Engineering Lab, with token and AST visualisation.",
        ],
      },
    ],
  },
  {
    slug: "unbound",
    title: "UnBound",
    kicker: "Android tablet as a true extended Mac display",
    summary:
      "A genuine second desktop — not mirroring — streamed from a virtual display on the Mac to an Android tablet over USB-C or Wi-Fi, with touch, mouse, scroll and keyboard input sent back.",
    status: "shipped",
    stack: ["Swift", "Kotlin", "ScreenCaptureKit", "VideoToolbox", "MediaCodec", "Android Open Accessory"],
    repo: "https://github.com/ugantarrajmanu/UnBound",
    featured: true,
    sections: [
      {
        heading: "Pipeline",
        body: [
          "CGVirtualDisplay → ScreenCaptureKit → VideoToolbox H.264 → USB-C (AOA) or Wi-Fi → MediaCodec → SurfaceView.",
          "Input travels the other way: touch, mouse and keyboard events from the tablet are injected on the Mac as CGEvents.",
        ],
      },
      {
        heading: "Release",
        body: [
          "Version 1.0.0, tested on Apple Silicon with a Galaxy Tab S10 FE. Ships as a one-line Mac installer plus a signed APK — no developer mode needed on the tablet.",
        ],
      },
    ],
  },
  {
    slug: "the-experiment",
    title: "The Experiment",
    kicker: "Falling-sand simulation",
    summary: "A rough cellular simulation of falling sand running in the browser.",
    status: "shipped",
    stack: ["JavaScript", "Canvas"],
    repo: "https://github.com/ugantarrajmanu/The-Experiment",
    demo: "https://the-experiment-sigma.vercel.app",
    featured: false,
    sections: [
      { heading: "Idea", body: ["Grid-based particle rules produce emergent sand behaviour — a seed for the Physics Lab."] },
    ],
  },
  {
    slug: "explit",
    title: "Explit",
    kicker: "Expense splitter with smart settlements",
    summary:
      "Full-stack expense sharing with equal, exact and percentage splits, and settlements that offset debts across different groups.",
    status: "shipped",
    stack: ["Next.js", "Convex", "Clerk", "Tailwind CSS"],
    repo: "https://github.com/ugantarrajmanu/Explit",
    demo: "https://explit-beta.vercel.app",
    featured: false,
    sections: [
      {
        heading: "Smart settlements",
        body: [
          "Balances are computed per group and globally: if you owe someone in one group and they owe you in another, the debts cancel.",
        ],
      },
    ],
  },
  {
    slug: "credit-report-analyzer",
    title: "Credit Report Analyzer",
    kicker: "MERN XML report pipeline",
    summary: "Parses soft-credit-pull XML into structured JSON, stores it in MongoDB and renders an interactive report dashboard.",
    status: "shipped",
    stack: ["React", "Express", "MongoDB", "xml2js"],
    repo: "https://github.com/ugantarrajmanu/Credit-Account-Report-generator",
    demo: "https://credit-account-report-generator.vercel.app",
    featured: false,
    sections: [{ heading: "Pipeline", body: ["Multer upload → xml2js parsing → validation → MongoDB → REST API → React dashboard."] }],
  },
  {
    slug: "crypto-fetcher",
    title: "Crypto Market Fetcher",
    kicker: "FastAPI market data service",
    summary: "Authenticated REST API over CoinGecko that aggregates market data in INR and CAD, with tests, Ruff linting and Docker.",
    status: "shipped",
    stack: ["Python", "FastAPI", "pytest", "Docker"],
    repo: "https://github.com/ugantarrajmanu/CryptoFetcher",
    featured: false,
    sections: [{ heading: "Design", body: ["Bearer-token auth, a dedicated CoinGecko client service, Pydantic config and mocked unit tests."] }],
  },
  {
    slug: "n-body",
    title: "N-Body Gravity Simulator",
    kicker: "Numerical physics in C++",
    summary: "Gravitational interaction between many bodies, with an interactive 3D visualisation planned for the Physics Lab.",
    status: "in-progress",
    stack: ["C++"],
    featured: false,
    sections: [
      // TODO: add repository link and real details (integrator, body count, optimisations).
      { heading: "Status", body: ["Repository not yet public. Case study to follow."] },
    ],
  },
  {
    slug: "os-development",
    title: "Operating System",
    kicker: "Future engineering project",
    summary: "A from-scratch OS: boot process, kernel, memory management, scheduling, filesystem and system calls.",
    status: "planned",
    stack: ["C", "Assembly", "Rust"],
    featured: false,
    sections: [{ heading: "Status", body: ["Planned. Progress will be documented here as it happens — nothing is presented as done before it is."] }],
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
