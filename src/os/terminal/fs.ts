import { PROFILE } from "@/content/profile";
import { PROJECTS } from "@/content/projects";

export type FsNode = { type: "dir"; children: Record<string, FsNode> } | { type: "file"; content: string };

const file = (content: string): FsNode => ({ type: "file", content });
const dir = (children: Record<string, FsNode>): FsNode => ({ type: "dir", children });

export const HOME = "/home/yug";

/** Read-only virtual filesystem generated from the portfolio content. */
export function buildFs(): FsNode {
  const projects: Record<string, FsNode> = {};
  for (const p of PROJECTS) {
    const lines = [
      `# ${p.title}`,
      `${p.kicker}`,
      ``,
      `status: ${p.status}`,
      `stack:  ${p.stack.join(", ")}`,
      p.repo ? `repo:   ${p.repo}` : null,
      p.demo ? `demo:   ${p.demo}` : null,
      ``,
      p.summary,
      ...p.sections.flatMap((s) => [``, `## ${s.heading}`, ...s.body]),
    ].filter((l) => l !== null);
    projects[`${p.slug}.md`] = file(lines.join("\n"));
  }

  const { contact } = PROFILE;
  return dir({
    home: dir({
      yug: dir({
        "about.md": file(
          [`# ${PROFILE.name}`, PROFILE.tagline, ``, PROFILE.intro, ``, `## Philosophy`, ...PROFILE.philosophy.map((p) => `- ${p}`), ``, `## Interests`, ...PROFILE.interests.map((i) => `- ${i}`)].join("\n"),
        ),
        "skills.txt": file(Object.entries(PROFILE.skills).map(([k, v]) => `${k.padEnd(10)} ${v.join(", ")}`).join("\n")),
        "contact.txt": file(
          [`email     ${contact.email}`, `github    ${contact.github}`, contact.linkedin && `linkedin  ${contact.linkedin}`, contact.resume && `resume    ${contact.resume}`]
            .filter(Boolean)
            .join("\n"),
        ),
        projects: dir(projects),
        ".yshrc": file(`# ysh config\nexport PS1="yug@singularity"\nalias ll="ls -a"`),
      }),
    }),
    sys: dir({
      kernel: dir({ "singularity.ko": file("[binary: black hole kernel module]") }),
    }),
  });
}

export function resolvePath(cwd: string, input = ""): string {
  if (!input || input === ".") return cwd;
  if (input === "~") return HOME;
  const raw = input.startsWith("~") ? HOME + input.slice(1) : input.startsWith("/") ? input : `${cwd}/${input}`;
  const parts: string[] = [];
  for (const seg of raw.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return "/" + parts.join("/");
}

export function lookup(root: FsNode, path: string): FsNode | null {
  let node: FsNode = root;
  for (const seg of path.split("/").filter(Boolean)) {
    if (node.type !== "dir" || !node.children[seg]) return null;
    node = node.children[seg];
  }
  return node;
}

export const displayPath = (path: string) => (path.startsWith(HOME) ? "~" + path.slice(HOME.length) : path);
