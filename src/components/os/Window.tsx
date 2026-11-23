"use client";

import { type PointerEvent as ReactPointerEvent, type ReactNode, useLayoutEffect, useRef } from "react";
import { APP_MAP, formatPid } from "@/os/apps";
import { anchors, type Point } from "@/os/anchors";
import { prefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { type WindowState, useWindowStore } from "@/store/windowStore";
import { AppIcon } from "./icons";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function flyKeyframes(el: HTMLElement, rect: { x: number; y: number; w: number; h: number }, to: Point) {
  const dx = to.x - (rect.x + rect.w / 2);
  const dy = to.y - (rect.y + rect.h / 2);
  return [
    { transform: "none", opacity: 1, filter: "blur(0px)" },
    { transform: `translate(${dx}px, ${dy}px) scale(0.06)`, opacity: 0, filter: "blur(6px)" },
  ];
}

/**
 * Holographic glass window: frosted violet surface, glowing corner brackets,
 * process name + PID in the title bar. Drag by the title bar, resize from the
 * edges/corner, double-click the title to maximise.
 */
export function Window({ win, mobile, children }: { win: WindowState; mobile: boolean; children: ReactNode }) {
  const app = APP_MAP[win.id];
  const ref = useRef<HTMLElement>(null);
  const focused = useWindowStore((s) => s.focused === win.id);
  const { focus, close, minimize, toggleMaximize, setRect } = useWindowStore.getState();
  const animating = useRef(false);

  // Materialise from the origin (3D region or dock icon) on open / restore.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || win.minimized) return;
    // Restoring the terminal should put you straight back at the prompt.
    if (win.id === "terminal") el.querySelector("input")?.focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    const from = win.origin;
    if (from) {
      el.animate(flyKeyframes(el, win, from).reverse(), { duration: 520, easing: EASE });
    } else {
      el.animate(
        [
          { transform: "scale(0.94)", opacity: 0, filter: "blur(6px)" },
          { transform: "none", opacity: 1, filter: "blur(0px)" },
        ],
        { duration: 360, easing: EASE },
      );
    }
    // Re-run only when the window is (re)opened, not on every move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.nonce, win.minimized]);

  const animateOut = (to: Point | null, done: () => void) => {
    const el = ref.current;
    if (!el || animating.current || prefersReducedMotion()) return done();
    animating.current = true;
    const frames = to
      ? flyKeyframes(el, win, to)
      : [
          { transform: "none", opacity: 1 },
          { transform: "scale(0.94)", opacity: 0 },
        ];
    const a = el.animate(frames, { duration: to ? 420 : 220, easing: to ? "cubic-bezier(0.7, 0, 0.84, 0)" : "ease-in", fill: "forwards" });
    a.onfinish = () => {
      animating.current = false;
      done();
      a.cancel();
    };
  };

  const onMinimize = () => animateOut(anchors.dock[win.id] ?? null, () => minimize(win.id));
  const onClose = () => animateOut(null, () => close(win.id));

  // ── Drag & resize ───────────────────────────────────────────────
  const startGesture = (e: ReactPointerEvent, kind: "move" | "e" | "s" | "se") => {
    if (mobile || e.button !== 0) return;
    e.preventDefault();
    focus(win.id);
    const start = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, w: win.w, h: win.h };
    const wasMax = win.maximized;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    document.body.classList.add("is-window-dragging");

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      if (kind === "move") {
        // Dragging a maximised window restores it under the cursor.
        if (wasMax) {
          setRect(win.id, { x: ev.clientX - start.w / 2, y: ev.clientY - 18 });
          return;
        }
        setRect(win.id, { x: start.x + dx, y: start.y + dy });
      } else {
        setRect(win.id, {
          w: kind === "s" ? start.w : start.w + dx,
          h: kind === "e" ? start.h : start.h + dy,
        });
      }
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("is-window-dragging");
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  };

  const style = mobile || win.maximized ? { zIndex: win.z } : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <section
      ref={ref}
      className={`os-window ${focused ? "is-focused" : ""} ${win.maximized ? "is-maximized" : ""} ${mobile ? "is-mobile" : ""}`}
      style={style}
      role="dialog"
      // Minimised windows stay mounted (hidden) so app state — terminal
      // scrollback, history, cwd — survives a minimise/restore.
      hidden={win.minimized}
      aria-labelledby={`win-title-${win.id}`}
      onPointerDownCapture={() => focus(win.id)}
    >
      <span className="os-window__corner os-window__corner--tl" aria-hidden />
      <span className="os-window__corner os-window__corner--tr" aria-hidden />
      <span className="os-window__corner os-window__corner--bl" aria-hidden />
      <span className="os-window__corner os-window__corner--br" aria-hidden />

      <header
        className="os-window__titlebar"
        onPointerDown={(e) => startGesture(e, "move")}
        onDoubleClick={() => !mobile && toggleMaximize(win.id)}
      >
        <span className="os-window__glyph" aria-hidden>
          <AppIcon id={win.id} size={14} />
        </span>
        <h2 id={`win-title-${win.id}`} className="os-window__title">
          {app.process}
        </h2>
        <span className="os-window__pid">PID {formatPid(app.pid)}</span>
        <div className="os-window__controls" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" onClick={onMinimize} aria-label={`Minimise ${app.title}`} title="Minimise">
            <svg viewBox="0 0 12 12" aria-hidden><path d="M2 6h8" /></svg>
          </button>
          {!mobile && (
            <button
              type="button"
              onClick={() => toggleMaximize(win.id)}
              aria-label={win.maximized ? `Restore ${app.title}` : `Maximise ${app.title}`}
              title={win.maximized ? "Restore" : "Maximise"}
            >
              <svg viewBox="0 0 12 12" aria-hidden><rect x="2.5" y="2.5" width="7" height="7" /></svg>
            </button>
          )}
          <button type="button" className="is-close" onClick={onClose} aria-label={`Close ${app.title}`} title="Close">
            <svg viewBox="0 0 12 12" aria-hidden><path d="M3 3l6 6M9 3l-6 6" /></svg>
          </button>
        </div>
      </header>

      <div className="os-window__body">{children}</div>

      {!mobile && !win.maximized && (
        <>
          <span className="os-window__resize os-window__resize--e" onPointerDown={(e) => startGesture(e, "e")} aria-hidden />
          <span className="os-window__resize os-window__resize--s" onPointerDown={(e) => startGesture(e, "s")} aria-hidden />
          <span className="os-window__resize os-window__resize--se" onPointerDown={(e) => startGesture(e, "se")} aria-hidden />
        </>
      )}
    </section>
  );
}
