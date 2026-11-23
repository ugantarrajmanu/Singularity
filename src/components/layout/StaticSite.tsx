import { REGION_MAP } from "@/constants/regions";
import { PROFILE } from "@/content/profile";
import { AboutSection, ContactSection, LabSection, ProjectsSection } from "@/features/sections";

/**
 * Complete portfolio as static HTML: used without WebGL, without JS, with
 * `?static`, and by crawlers. The 3D universe is an enhancement on top.
 */
export function StaticSite() {
  const sections = [
    { id: "memory" as const, body: <AboutSection /> },
    { id: "filesystem" as const, body: <ProjectsSection /> },
    { id: "process" as const, body: <LabSection /> },
    { id: "network" as const, body: <ContactSection /> },
  ];
  return (
    <div className="static-site">
      <header className="static-hero">
        <p className="mono-label">Singularity — static mode</p>
        <h1 className="welcome__name">{PROFILE.name}</h1>
        <p className="welcome__tagline">{PROFILE.tagline}</p>
        <ul className="welcome__roles">
          {PROFILE.roles.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <nav aria-label="Sections" className="static-nav">
          {sections.map(({ id }) => (
            <a key={id} href={`#${id}`}>
              0{REGION_MAP[id].index} {REGION_MAP[id].label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        {sections.map(({ id, body }) => (
          <section key={id} id={id} className="static-section" aria-labelledby={`static-${id}`}>
            <p className="mono-label">
              0{REGION_MAP[id].index} / {REGION_MAP[id].system}
            </p>
            <h2 id={`static-${id}`} className="region-panel__title">
              {REGION_MAP[id].label}
            </h2>
            {body}
          </section>
        ))}
      </main>
    </div>
  );
}
