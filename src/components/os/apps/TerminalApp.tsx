"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HOME, buildFs } from "@/os/terminal/fs";
import { type Line, complete, prompt, runCommand } from "@/os/terminal/commands";
import { useUniverseStore } from "@/store/universeStore";
import { useWindowStore } from "@/store/windowStore";

const BOOTED_AT = typeof performance !== "undefined" ? Date.now() - performance.now() : Date.now();

const MAX_LINES = 400;

const WELCOME: Line[] = [
  { kind: "accent", text: "Singularity shell (ysh) — Engineering Beyond Limits." },
  { kind: "muted", text: "Type `help` to list commands. Try `neofetch`, `ls projects`, `open yulang`." },
  { kind: "output", text: "" },
];

export function TerminalApp() {
  const fs = useMemo(() => buildFs(), []);
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [cwd, setCwd] = useState(HOME);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  const submit = () => {
    const cmd = value;
    const entry: Line = { kind: "input", text: `${prompt(cwd)} ${cmd}` };
    if (cmd.trim()) history.current.push(cmd);
    historyIndex.current = -1;
    setValue("");

    let cleared = false;
    const result = runCommand(cmd, {
      cwd,
      fs,
      history: history.current,
      bootedAt: BOOTED_AT,
      openApp: (id, payload) => useWindowStore.getState().open(id, { payload }),
      showUniverse: () => useUniverseStore.getState().showUniverse(),
      clear: () => {
        cleared = true;
      },
      exit: () => useWindowStore.getState().close("terminal"),
    });
    if (result.cwd) setCwd(result.cwd);
    // Keep the scrollback bounded so long sessions stay cheap to render.
    setLines((prev) => (cleared ? [] : [...prev, entry, ...result.lines].slice(-MAX_LINES)));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const { value: next, options } = complete(value, { cwd, fs });
      if (options.length) {
        const echo: Line[] = [{ kind: "input", text: `${prompt(cwd)} ${value}` }, { kind: "muted", text: options.join("    ") }];
        setLines((prev) => [...prev, ...echo].slice(-MAX_LINES));
      }
      setValue(next);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      let i = historyIndex.current === -1 ? h.length : historyIndex.current;
      i = e.key === "ArrowUp" ? Math.max(0, i - 1) : i + 1;
      if (i >= h.length) {
        historyIndex.current = -1;
        setValue("");
      } else {
        historyIndex.current = i;
        setValue(h[i]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === "c" && e.ctrlKey) {
      // Like a real shell: abandon the current line.
      e.preventDefault();
      setLines((prev) => [...prev, { kind: "input" as const, text: `${prompt(cwd)} ${value}^C` }].slice(-MAX_LINES));
      setValue("");
      historyIndex.current = -1;
    } else if (e.key === "u" && e.ctrlKey) {
      e.preventDefault();
      setValue("");
    }
    // Keep plain keys (Escape, digits…) from reaching global shortcuts while
    // typing, but let system chords like ⌘K through.
    if (!e.metaKey && !e.ctrlKey) e.stopPropagation();
  };

  return (
    <div className="terminal" onClick={() => input.current?.focus({ preventScroll: true })}>
      <div className="terminal__scroll" ref={scroller} aria-live="polite">
        {lines.map((l, i) => (
          <pre key={i} className={`terminal__line terminal__line--${l.kind}`}>
            {l.text || " "}
          </pre>
        ))}
        <div className="terminal__prompt">
          <span className="terminal__ps1">{prompt(cwd)}</span>
          <input
            ref={input}
            className="terminal__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal input"
          />
        </div>
      </div>
    </div>
  );
}
