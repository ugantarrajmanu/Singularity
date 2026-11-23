import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/content/projects";
import { StatusTag } from "@/features/sections";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  return project ? { title: `${project.title} — Singularity`, description: project.summary } : {};
}

/** Case-study template (roadmap §5.3 / Sprint G). */
export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <div className="page">
      <nav className="page__crumbs mono-label" aria-label="Breadcrumb">
        <Link href="/">~</Link> / <Link href="/projects">filesystem</Link> / {project.slug}
      </nav>
      <header className="case-hero">
        <div className="case-hero__meta">
          <span className="mono-label">{project.kicker}</span>
          <StatusTag status={project.status} />
        </div>
        <h1 className="case-hero__title">{project.title}</h1>
        <p className="lede">{project.summary}</p>
        <div className="welcome__actions">
          {project.repo && (
            <a className="btn btn--primary" href={project.repo} target="_blank" rel="noreferrer">
              Repository ↗
            </a>
          )}
          {project.demo && (
            <a className="btn" href={project.demo} target="_blank" rel="noreferrer">
              Live demo ↗
            </a>
          )}
        </div>
        <ul className="chip-list">
          {project.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </header>
      <div className="case-body">
        {project.sections.map((s) => (
          <section key={s.heading} className="case-section">
            <h2 className="mono-heading">{s.heading}</h2>
            {s.body.map((para) => (
              <p key={para}>
                {para.split(/`([^`]+)`/).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
