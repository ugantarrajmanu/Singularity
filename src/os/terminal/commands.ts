import { PROFILE } from "@/content/profile";
import { PROJECTS } from "@/content/projects";
import { APPS, type AppId } from "@/os/apps";
import { type FsNode, HOME, displayPath, lookup, resolvePath } from "./fs";

export type LineKind = "input" | "output" | "error" | "accent" | "muted";
export interface Line {
  kind: LineKind;
  text: string;
}

export interface ShellContext {
  cwd: string;
  fs: FsNode;
  history: string[];
  bootedAt: number;
  openApp: (id: AppId, payload?: string) => void;
  showUniverse: () => void;
  clear: () => void;
  exit: () => void;
}

export interface CommandResult {
  lines: Line[];
  cwd?: string;
}

const out = (text: string, kind: LineKind = "output"): Line => ({ kind, text });

export function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
}

const HELP: [string, string][] = [
  ["help", "list commands"],
  ["ls [path]", "list directory (try ls projects)"],
  ["cd <path>", "change directory"],
  ["cat <file>", "print a file (try cat about.md)"],
  ["open <app|project>", "launch an app or project (open yulang)"],
  ["projects", "list projects with status"],
  ["whoami", "who runs this system"],
  ["neofetch", "system information"],
  ["universe", "zoom out to the whole universe"],
  ["pwd · echo · date · uptime · history · clear · exit", ""],
];

const NEOFETCH_ART = [
  "      .  *  .       ",
  "   *  .-~~~-.  .    ",
  "  .  /  ___  \\   *  ",
  "    |  (   )  |     ",
  "  *  \\  ---  /  .   ",
  "   .  '-...-'   *   ",
  "      *  .  .       ",
];

export const COMMAND_NAMES = ["help", "ls", "cd", "cat", "open", "projects", "whoami", "neofetch", "universe", "pwd", "echo", "date", "uptime", "history", "clear", "exit", "sudo", "ll"];

const ALIASES: Record<string, string> = { ll: "ls -a" };

export function runCommand(input: string, ctx: ShellContext): CommandResult {
  const [first, ...rest] = input.trim().split(/\s+/);
  const [cmd, ...args] = ALIASES[first] ? [...ALIASES[first].split(" "), ...rest] : [first, ...rest];
  const arg = args.join(" ");

  switch (cmd) {
    case "":
      return { lines: [] };
    case "help":
      return {
        lines: [
          out("Singularity shell — available commands", "accent"),
          ...HELP.map(([c, d]) => out(d ? `  ${c.padEnd(22)} ${d}` : `  ${c}`)),
        ],
      };
    case "pwd":
      return { lines: [out(ctx.cwd)] };
    case "whoami":
      return { lines: [out(`${PROFILE.name.toLowerCase()} — ${PROFILE.roles.join(", ")}`), out(PROFILE.tagline, "muted")] };
    case "echo":
      return { lines: [out(arg)] };
    case "date":
      return { lines: [out(new Date().toString())] };
    case "uptime":
      return { lines: [out(`up ${formatUptime(Date.now() - ctx.bootedAt)}`)] };
    case "history":
      return { lines: ctx.history.map((h, i) => out(`${String(i + 1).padStart(4)}  ${h}`)) };
    case "clear":
      ctx.clear();
      return { lines: [] };
    case "exit":
      ctx.exit();
      return { lines: [] };
    case "sudo":
      return { lines: [out("yug is not in the sudoers file. This incident will be reported.", "error")] };
    case "universe":
      ctx.showUniverse();
      return { lines: [out("zooming out…", "muted")] };

    case "ls": {
      const flags = args.filter((a) => a.startsWith("-")).join("");
      const target = args.find((a) => !a.startsWith("-"));
      const path = resolvePath(ctx.cwd, target);
      const node = lookup(ctx.fs, path);
      if (!node) return { lines: [out(`ls: ${target}: No such file or directory`, "error")] };
      if (node.type === "file") return { lines: [out(target ?? path)] };
      const names = Object.entries(node.children)
        .filter(([n]) => flags.includes("a") || !n.startsWith("."))
        .map(([n, c]) => (c.type === "dir" ? `${n}/` : n));
      return { lines: names.length ? [out(names.join("    "))] : [] };
    }
    case "cd": {
      const path = arg ? resolvePath(ctx.cwd, arg) : HOME; // bare `cd` goes home
      const node = lookup(ctx.fs, path);
      if (!node) return { lines: [out(`cd: ${arg}: No such file or directory`, "error")] };
      if (node.type !== "dir") return { lines: [out(`cd: ${arg}: Not a directory`, "error")] };
      return { lines: [], cwd: path };
    }
    case "cat": {
      if (!arg) return { lines: [out("usage: cat <file>", "error")] };
      const node = lookup(ctx.fs, resolvePath(ctx.cwd, arg));
      if (!node) return { lines: [out(`cat: ${arg}: No such file or directory`, "error")] };
      if (node.type === "dir") return { lines: [out(`cat: ${arg}: Is a directory`, "error")] };
      return { lines: node.content.split("\n").map((l) => out(l, l.startsWith("#") ? "accent" : "output")) };
    }
    case "projects":
      return {
        lines: PROJECTS.map((p) => out(`  ${p.slug.padEnd(24)} ${p.status.toUpperCase().padEnd(12)} ${p.kicker}`)),
      };
    case "open": {
      if (!arg) return { lines: [out("usage: open <app|project>   apps: " + APPS.map((a) => a.id).join(", "), "error")] };
      const name = arg.replace(/\.md$/, "").split("/").pop()!.toLowerCase();
      const app = APPS.find((a) => a.id === name || a.title.toLowerCase() === name);
      if (app) {
        ctx.openApp(app.id);
        return { lines: [out(`launching ${app.process}…`, "muted")] };
      }
      const project = PROJECTS.find((p) => p.slug === name || p.title.toLowerCase() === name);
      if (project) {
        ctx.openApp("projects", project.slug);
        return { lines: [out(`opening ${project.title} in filesystem.app…`, "muted")] };
      }
      return { lines: [out(`open: ${arg}: no such app or project (try: projects)`, "error")] };
    }
    case "neofetch": {
      const info = [
        `${PROFILE.name.toLowerCase()}@singularity`,
        "-------------",
        "OS       Singularity — युग",
        "Kernel   singularity (ray-traced)",
        `Uptime   ${formatUptime(Date.now() - ctx.bootedAt)}`,
        "Shell    ysh",
        `Display  ${window.innerWidth}x${window.innerHeight} @ ${window.devicePixelRatio}x`,
        "Renderer WebGL · React Three Fiber",
        "Theme    Void Violet",
        `Projects ${PROJECTS.length}`,
      ];
      const rows = Math.max(NEOFETCH_ART.length, info.length);
      return {
        lines: Array.from({ length: rows }, (_, i) => out(`${(NEOFETCH_ART[i] ?? "").padEnd(22)}${info[i] ?? ""}`, i < 2 ? "accent" : "output")),
      };
    }
    default:
      return { lines: [out(`ysh: command not found: ${cmd}  (type help)`, "error")] };
  }
}

function commonPrefix(words: string[]) {
  let p = words[0] ?? "";
  for (const w of words) while (!w.startsWith(p)) p = p.slice(0, -1);
  return p;
}

export interface Completion {
  value: string;
  /** Candidates to print when the input is ambiguous (bash-style). */
  options: string[];
}

/** Tab completion for commands (first word) and paths / open targets (later words). */
export function complete(input: string, ctx: Pick<ShellContext, "cwd" | "fs">): Completion {
  const parts = input.split(/\s+/);
  const finish = (candidates: string[], base: string, stem: string, suffix: (c: string) => string): Completion => {
    if (candidates.length === 0) return { value: input, options: [] };
    if (candidates.length === 1) {
      return { value: [...parts.slice(0, -1), base + candidates[0] + suffix(candidates[0])].join(" "), options: [] };
    }
    const prefix = commonPrefix(candidates);
    if (prefix.length > stem.length) return { value: [...parts.slice(0, -1), base + prefix].join(" "), options: [] };
    return { value: input, options: candidates.map((c) => c + suffix(c).trim()) };
  };

  if (parts.length === 1) {
    return finish(COMMAND_NAMES.filter((c) => c.startsWith(parts[0])), "", parts[0], () => " ");
  }

  const partial = parts[parts.length - 1];
  if (parts[0] === "open") {
    const names = [...APPS.map((a) => a.id), ...PROJECTS.map((p) => p.slug)].filter((n) => n.startsWith(partial));
    return finish([...new Set(names)], "", partial, () => "");
  }

  const slash = partial.lastIndexOf("/");
  const base = slash >= 0 ? partial.slice(0, slash + 1) : "";
  const stem = slash >= 0 ? partial.slice(slash + 1) : partial;
  const node = lookup(ctx.fs, resolvePath(ctx.cwd, base || "."));
  if (!node || node.type !== "dir") return { value: input, options: [] };
  const dirsOnly = parts[0] === "cd";
  const names = Object.entries(node.children)
    .filter(([n, c]) => n.startsWith(stem) && (stem.startsWith(".") || !n.startsWith(".")) && (!dirsOnly || c.type === "dir"))
    .map(([n]) => n);
  return finish(names, base, stem, (n) => (node.children[n].type === "dir" ? "/" : ""));
}

export const prompt = (cwd: string) => `yug@singularity ${displayPath(cwd)} $`;
export { HOME };
