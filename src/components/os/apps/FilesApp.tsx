"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PROJECTS, type Project, type ProjectStatus } from "@/content/projects";
import { StatusTag } from "@/features/sections";

type Folder = "all" | "featured" | ProjectStatus;

const FOLDERS: { id: Folder; label: string }[] = [
  { id: "all", label: "All projects" },
  { id: "featured", label: "Featured" },
  { id: "shipped", label: "Shipped" },
  { id: "in-progress", label: "In progress" },
  { id: "planned", label: "Planned" },
];

const filterBy = (folder: Folder) => (p: Project) =>
  folder === "all" ? true : folder === "featured" ? p.featured : p.status === folder;

function FileGlyph({ project }: { project: Project }) {
  return (
    <svg viewBox="0 0 40 40" className="files__glyph" aria-hidden>
      <path d="M8 6h16l8 8v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <path d="M24 6v8h8" />
      <text x="19" y="29" textAnchor="middle">
        {project.title.slice(0, 2).toUpperCase()}
      </text>
    </svg>
  );
}

/**
 * filesystem.app — a file explorer over /home/yug/projects. Selecting a
 * project opens its case study inline; `payload` (from the terminal or the
 * command palette) selects a project directly.
 */
export function FilesApp({ payload, nonce }: { payload: string | null; nonce: number }) {
  const [folder, setFolder] = useState<Folder>("all");
  // `payload` is re-applied whenever the window is (re)opened with one.
  const [selection, setSelection] = useState<{ slug: string | null; nonce: number }>({ slug: payload, nonce });
  const slug = selection.nonce === nonce ? selection.slug : payload;
  const select = (s: string | null) => setSelection({ slug: s, nonce });

  const items = useMemo(() => PROJECTS.filter(filterBy(folder)), [folder]);
  const project = slug ? PROJECTS.find((p) => p.slug === slug) : null;
  const path = `~/projects${project ? `/${project.slug}` : folder === "all" ? "" : `/${folder}`}`;

  return (
    <div className="files">
      <aside className="files__sidebar" aria-label="Folders">
        <p className="files__heading">Locations</p>
        <ul>
          {FOLDERS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={folder === f.id && !project ? "is-active" : ""}
                onClick={() => {
                  setFolder(f.id);
                  select(null);
                }}
              >
                {f.label}
                <span className="files__count">{PROJECTS.filter(filterBy(f.id)).length}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="files__main">
        <div className="files__toolbar">
          <button type="button" className="files__back" onClick={() => select(null)} disabled={!project} aria-label="Back">
            <svg viewBox="0 0 16 16" aria-hidden><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <span className="files__path">{path}</span>
        </div>

        {project ? (
          <article className="files__detail">
            <div className="files__detail-meta">
              <span className="mono-label">{project.kicker}</span>
              <StatusTag status={project.status} />
            </div>
            <h3 className="files__detail-title">{project.title}</h3>
            <p className="lede">{project.summary}</p>
            <ul className="chip-list">
              {project.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {project.sections.map((s) => (
              <section key={s.heading}>
                <h4 className="mono-heading">{s.heading}</h4>
                {s.body.map((para) => (
                  <p key={para} className="files__para">
                    {para.split(/`([^`]+)`/).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
                  </p>
                ))}
              </section>
            ))}
            <div className="welcome__actions files__actions">
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
              <Link className="btn" href={`/projects/${project.slug}`}>
                Full case study
              </Link>
            </div>
          </article>
        ) : (
          <ul className="files__grid">
            {items.map((p) => (
              <li key={p.slug}>
                <button type="button" className="files__item" onClick={() => select(p.slug)} onDoubleClick={() => select(p.slug)}>
                  <FileGlyph project={p} />
                  <span className="files__name">{p.slug}.md</span>
                  <span className="files__kicker">{p.kicker}</span>
                  <StatusTag status={p.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="files__statusbar">
          {project ? `${project.title} — ${project.stack.length} technologies` : `${items.length} items`}
        </div>
      </div>
    </div>
  );
}
