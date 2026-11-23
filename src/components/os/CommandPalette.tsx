"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { REGIONS } from "@/constants/regions";
import { PROJECTS } from "@/content/projects";
import { APPS } from "@/os/apps";
import { useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";
import { useWindowStore } from "@/store/windowStore";

export const usePaletteStore = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

interface Command {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
}

function useCommands(): Command[] {
  return useMemo(() => {
    const win = () => useWindowStore.getState();
    const uni = () => useUniverseStore.getState();
    return [
      ...APPS.map((a) => ({ id: `app-${a.id}`, label: `Open ${a.title}`, group: "Apps", hint: a.process, run: () => win().open(a.id) })),
      ...PROJECTS.map((p) => ({
        id: `project-${p.slug}`,
        label: p.title,
        group: "Projects",
        hint: p.kicker,
        run: () => win().open("projects", { payload: p.slug }),
      })),
      ...REGIONS.map((r) => ({ id: `space-${r.id}`, label: `Go to ${r.system}`, group: "Spaces", hint: r.label, run: () => uni().navigate(r.id) })),
      { id: "universe", label: "Universe overview", group: "System", hint: "U", run: () => uni().showUniverse() },
      { id: "close-all", label: "Close all windows", group: "System", run: () => win().closeAll() },
      {
        id: "replay",
        label: "Restart (replay boot)",
        group: "System",
        run: () => {
          win().closeAll();
          useBootStore.getState().start("full");
        },
      },
    ];
  }, []);
}

/** ⌘K launcher — fuzzy-ish search across apps, projects, spaces and system actions. */
export function CommandPalette() {
  const open = usePaletteStore((s) => s.open);
  const setOpen = usePaletteStore((s) => s.setOpen);
  const commands = useCommands();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint ?? ""} ${c.group}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setQuery("");
    setIndex(0);
  };
  const run = (c: Command | undefined) => {
    if (!c) return;
    close();
    c.run();
  };

  return (
    <div className="palette" role="presentation" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette__panel" role="dialog" aria-label="Command palette">
        <input
          ref={input}
          className="palette__input"
          placeholder="Search apps, projects, spaces…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") close();
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(results.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") run(results[index]);
          }}
          aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
          aria-controls="palette-list"
        />
        <ul className="palette__list" id="palette-list" role="listbox">
          {results.map((c, i) => {
            const header = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <li key={c.id} role="presentation">
                {header && <p className="palette__group">{header}</p>}
                <button
                  id={`cmd-${c.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === index}
                  className={i === index ? "is-active" : ""}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(c)}
                >
                  <span>{c.label}</span>
                  {c.hint && <span className="palette__hint">{c.hint}</span>}
                </button>
              </li>
            );
          })}
          {results.length === 0 && <li className="palette__empty">No matches</li>}
        </ul>
      </div>
    </div>
  );
}
