import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { StatusTag } from "@/features/sections";

export const metadata: Metadata = {
  title: "Filesystem — Singularity",
  description: "Projects and repositories: compilers, systems software and full-stack products.",
};

export default function ProjectsPage() {
  return (
    <div className="page">
      <nav className="page__crumbs mono-label" aria-label="Breadcrumb">
        <Link href="/">~</Link> / filesystem
      </nav>
      <h1 className="case-hero__title">Filesystem</h1>
      <p className="lede">Every repository, with an honest status.</p>
      <ul className="file-list file-list--page">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`}>
              <span className="file-list__name">{p.title}</span>
              <span className="file-list__meta">{p.kicker}</span>
              <StatusTag status={p.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
