import Link from "next/link";
import { PROFILE } from "@/content/profile";
import { PROJECTS, type ProjectStatus } from "@/content/projects";

/**
 * Region content rendered as plain, semantic HTML. Used inside the 3D panels
 * and in the no-WebGL fallback, so essential content never depends on WebGL.
 */

const STATUS_LABEL: Record<ProjectStatus, string> = {
  shipped: "SHIPPED",
  "in-progress": "IN PROGRESS",
  planned: "PLANNED",
};

export function StatusTag({ status }: { status: ProjectStatus }) {
  return <span className={`status-tag status-tag--${status}`}>{STATUS_LABEL[status]}</span>;
}

export function AboutSection() {
  return (
    <div className="section-body">
      <p className="lede">{PROFILE.intro}</p>

      <h3 className="mono-heading">Philosophy</h3>
      <ul className="plain-list">
        {PROFILE.philosophy.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <h3 className="mono-heading">Interests</h3>
      <ul className="chip-list">
        {PROFILE.interests.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>

      <h3 className="mono-heading">Toolbox</h3>
      <dl className="skill-grid">
        {Object.entries(PROFILE.skills).map(([group, items]) => (
          <div key={group}>
            <dt>{group}</dt>
            <dd>{items.join(" · ")}</dd>
          </div>
        ))}
      </dl>

      {PROFILE.education.length > 0 && (
        <>
          <h3 className="mono-heading">Education</h3>
          <ul className="plain-list">
            {PROFILE.education.map((e) => (
              <li key={e.institution}>
                {e.degree}, {e.institution} <span className="muted">{e.period}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ProjectsSection() {
  const featured = PROJECTS.filter((p) => p.featured);
  const rest = PROJECTS.filter((p) => !p.featured);
  return (
    <div className="section-body">
      <ul className="project-list">
        {featured.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`} className="project-card">
              <div className="project-card__top">
                <span className="mono-label">{p.kicker}</span>
                <StatusTag status={p.status} />
              </div>
              <span className="project-card__title">{p.title}</span>
              <span className="project-card__summary">{p.summary}</span>
              <span className="project-card__stack">{p.stack.join(" / ")}</span>
            </Link>
          </li>
        ))}
      </ul>
      <h3 className="mono-heading">More repositories</h3>
      <ul className="file-list">
        {rest.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`}>
              <span className="file-list__name">{p.title}</span>
              <span className="file-list__meta">{p.kicker}</span>
              <StatusTag status={p.status} />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/projects" className="text-link">
        Browse all projects →
      </Link>
    </div>
  );
}

const LAB_ITEMS: { name: string; detail: string; status: ProjectStatus }[] = [
  { name: "YUlanG Compiler Lab", detail: "Write YUlanG in the browser; C interpreter compiled to WebAssembly.", status: "planned" },
  { name: "AST Explorer", detail: "Watch source become tokens, then a syntax tree.", status: "planned" },
  { name: "CPU Scheduler", detail: "FCFS, SJF, Round Robin — visualised timelines.", status: "planned" },
  { name: "Memory Manager", detail: "Paging, allocation and fragmentation, step by step.", status: "planned" },
  { name: "N-Body Gravity", detail: "Interactive orbital simulation.", status: "planned" },
  { name: "Falling Sand", detail: "Cellular automaton physics (from The Experiment).", status: "shipped" },
];

export function LabSection() {
  return (
    <div className="section-body">
      <p className="lede">
        Running processes. Each experiment loads on demand and runs in isolation — nothing here slows down the rest of
        the universe.
      </p>
      <ul className="process-table" role="list">
        {LAB_ITEMS.map((item, i) => (
          <li key={item.name}>
            <span className="process-table__pid">PID {String(100 + i * 7)}</span>
            <span className="process-table__name">{item.name}</span>
            <span className="process-table__detail">{item.detail}</span>
            <StatusTag status={item.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContactSection() {
  const { email, github, linkedin, resume } = PROFILE.contact;
  const links = [
    { label: "Email", value: email, href: `mailto:${email}` },
    { label: "GitHub", value: github.replace("https://", ""), href: github },
    linkedin && { label: "LinkedIn", value: linkedin.replace("https://", ""), href: linkedin },
    resume && { label: "Resume", value: "Download PDF", href: resume },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  return (
    <div className="section-body">
      <p className="lede">Open a connection — collaborations, roles and questions about the work are all welcome.</p>
      <ul className="connection-list">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <span className="mono-label">{l.label}</span>
              <span className="connection-list__value">{l.value}</span>
              <span aria-hidden>↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
