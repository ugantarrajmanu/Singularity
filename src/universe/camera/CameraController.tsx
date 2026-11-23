"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Vector3 } from "three";
import { cameraRig } from "@/animation/bootParams";
import { getRegionView, getUniverseView, type CameraView } from "@/constants/regions";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useUniverseStore } from "@/store/universeStore";

const lookTarget = new Vector3();
const offset = new Vector3();
const lookOffset = new Vector3();
const pivotPoint = new Vector3();
const yAxis = new Vector3(0, 1, 0);
const pitchAxis = new Vector3();
const right = new Vector3();
const up = new Vector3();
const panStep = new Vector3();

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3.2;

/**
 * Free-look offsets layered on top of the navigation rig: drag to orbit,
 * right/shift-drag to pan, wheel or pinch to zoom. Navigating anywhere eases
 * them back to zero, so free exploration never fights the guided camera.
 */
const look = {
  yaw: 0,
  pitch: 0,
  zoom: 1,
  pan: new Vector3(),
  target: { yaw: 0, pitch: 0, zoom: 1, pan: new Vector3() },
};

export function resetFreeLook() {
  look.target.yaw = 0;
  look.target.pitch = 0;
  look.target.zoom = 1;
  look.target.pan.set(0, 0, 0);
}

/**
 * Copies the shared camera rig to the real camera every frame, and tweens the
 * rig on navigation. A new navigation always kills the previous tween, so the
 * camera can never get stuck mid-transition (roadmap §13.3).
 */
export function CameraController() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const canvas = useThree((s) => s.gl.domElement);
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const reducedMotion = usePrefersReducedMotion();

  // Navigation → camera tween.
  useEffect(() => {
    const flyTo = (view: CameraView, duration: number) => {
      const { setTransitioning } = useUniverseStore.getState();
      gsap.killTweensOf(cameraRig.position);
      gsap.killTweensOf(cameraRig.target);
      gsap.killTweensOf(cameraRig.pivot);
      const pivot = view.pivot ?? view.target;
      if (duration === 0) {
        cameraRig.position.set(...view.position);
        cameraRig.target.set(...view.target);
        cameraRig.pivot.set(...pivot);
        setTransitioning(false);
        return;
      }
      setTransitioning(true);
      const ease = "power3.inOut";
      gsap.to(cameraRig.target, { x: view.target[0], y: view.target[1], z: view.target[2], duration, ease });
      gsap.to(cameraRig.pivot, { x: pivot[0], y: pivot[1], z: pivot[2], duration, ease });
      gsap.to(cameraRig.position, {
        x: view.position[0],
        y: view.position[1],
        z: view.position[2],
        duration,
        ease,
        onComplete: () => setTransitioning(false),
        onInterrupt: () => setTransitioning(false),
      });
    };

    return useUniverseStore.subscribe((state, prev) => {
      if (state.navToken === prev.navToken) return;
      const boot = useBootStore.getState();
      if (!isInteractive(boot.phase)) return;
      if (boot.phase === "welcome") boot.setPhase("exploring");
      resetFreeLook();
      const aspect = window.innerWidth / window.innerHeight;
      const view = state.cameraMode === "universe" ? getUniverseView(aspect) : getRegionView(state.activeRegion, aspect);
      const distance = cameraRig.position.distanceTo(new Vector3(...view.position));
      const duration = reducedMotion ? 0 : Math.min(3.2, 1.4 + distance / 40);
      flyTo(view, duration);
    });
  }, [reducedMotion]);

  // Re-frame on resize once interactive.
  useEffect(() => {
    const { phase } = useBootStore.getState();
    if (!isInteractive(phase)) return;
    const { cameraMode, activeRegion, isTransitioning } = useUniverseStore.getState();
    if (isTransitioning) return;
    const aspect = size.width / size.height;
    const view = cameraMode === "universe" ? getUniverseView(aspect) : getRegionView(activeRegion, aspect);
    gsap.to(cameraRig.position, { x: view.position[0], y: view.position[1], z: view.position[2], duration: 0.6 });
    gsap.to(cameraRig.target, { x: view.target[0], y: view.target[1], z: view.target[2], duration: 0.6 });
    const pivot = view.pivot ?? view.target;
    gsap.to(cameraRig.pivot, { x: pivot[0], y: pivot[1], z: pivot[2], duration: 0.6 });
  }, [size.width, size.height]);

  // Responsive field of view: wider on portrait screens.
  useEffect(() => {
    if ("fov" in camera) {
      camera.fov = size.width / size.height < 0.9 ? 62 : 45;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Free look: drag / right-drag / wheel / pinch / double-click / arrow keys.
  useEffect(() => {
    const pointers = new Map<number, { x: number; y: number }>();
    let mode: "orbit" | "pan" | null = null;
    let pinchDistance = 0;
    const enabled = () => isInteractive(useBootStore.getState().phase);
    const radius = () => cameraRig.position.distanceTo(cameraRig.pivot) * look.zoom;

    const pan = (dx: number, dy: number) => {
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      up.setFromMatrixColumn(camera.matrixWorld, 1);
      const k = (radius() * 1.1) / window.innerHeight;
      panStep.copy(right).multiplyScalar(-dx * k).addScaledVector(up, dy * k);
      look.target.pan.add(panStep);
      // Keep panning within a sane distance of the guided view.
      look.target.pan.clampLength(0, 80);
    };

    const onDown = (e: PointerEvent) => {
      if (!enabled()) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        mode = "pan";
      } else {
        mode = e.button === 2 || e.shiftKey ? "pan" : "orbit";
      }
      document.body.classList.add("is-dragging");
    };

    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev || !mode) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDistance > 0) {
          look.target.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, look.target.zoom * (pinchDistance / d)));
        }
        pinchDistance = d;
        pan(dx / 2, dy / 2);
        return;
      }
      if (mode === "orbit") {
        look.target.yaw -= (dx / window.innerWidth) * Math.PI * 1.4;
        look.target.pitch = Math.max(-1.2, Math.min(1.2, look.target.pitch - (dy / window.innerHeight) * Math.PI * 0.9));
      } else {
        pan(dx, dy);
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (pointers.size === 0) {
        mode = null;
        document.body.classList.remove("is-dragging");
      }
      pinchDistance = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (!enabled()) return;
      e.preventDefault();
      const factor = Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012));
      look.target.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, look.target.zoom * factor));
    };

    const onDoubleClick = () => enabled() && resetFreeLook();
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!enabled() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      const step = 0.18;
      if (e.key === "ArrowLeft") look.target.yaw += step;
      else if (e.key === "ArrowRight") look.target.yaw -= step;
      else if (e.key === "ArrowUp") look.target.pitch = Math.min(1.2, look.target.pitch + step);
      else if (e.key === "ArrowDown") look.target.pitch = Math.max(-1.2, look.target.pitch - step);
      else if (e.key === "+" || e.key === "=") look.target.zoom = Math.max(ZOOM_MIN, look.target.zoom / 1.15);
      else if (e.key === "-" || e.key === "_") look.target.zoom = Math.min(ZOOM_MAX, look.target.zoom * 1.15);
      else if (e.key === "0") resetFreeLook();
      else return;
      e.preventDefault();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDoubleClick);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDoubleClick);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-dragging");
    };
  }, [camera, canvas]);

  useFrame((_, delta) => {
    // Damped free-look offsets.
    const d = reducedMotion ? 1 : Math.min(1, delta * 6);
    look.yaw += (look.target.yaw - look.yaw) * d;
    look.pitch += (look.target.pitch - look.pitch) * d;
    look.zoom += (look.target.zoom - look.zoom) * d;
    look.pan.lerp(look.target.pan, d);

    // Subtle mouse parallax (suppressed while dragging).
    const p = pointer.current;
    const k = Math.min(1, delta * 2);
    const strength = reducedMotion || document.body.classList.contains("is-dragging") ? 0 : 0.35;
    p.sx += (p.x * strength - p.sx) * k;
    p.sy += (p.y * strength - p.sy) * k;

    // Orbit + zoom both the camera and its look target around the pivot (the
    // subject), so the subject stays put on screen while you move around it.
    pivotPoint.copy(cameraRig.pivot).add(look.pan);
    offset.copy(cameraRig.position).sub(cameraRig.pivot);
    lookOffset.copy(cameraRig.target).sub(cameraRig.pivot);
    offset.applyAxisAngle(yAxis, look.yaw);
    lookOffset.applyAxisAngle(yAxis, look.yaw);
    pitchAxis.crossVectors(yAxis, offset).normalize();
    if (pitchAxis.lengthSq() > 0) {
      // Clamp so we never flip over the poles.
      const elevation = Math.asin(Math.max(-1, Math.min(1, offset.y / offset.length())));
      const pitch = Math.max(-1.45 - elevation, Math.min(1.45 - elevation, look.pitch));
      offset.applyAxisAngle(pitchAxis, -pitch);
      lookOffset.applyAxisAngle(pitchAxis, -pitch);
    }
    offset.multiplyScalar(look.zoom);
    lookOffset.multiplyScalar(look.zoom);
    lookTarget.copy(pivotPoint).add(lookOffset);

    camera.position.copy(pivotPoint).add(offset);
    camera.position.x += p.sx;
    camera.position.y -= p.sy;
    camera.lookAt(lookTarget);
  });

  return null;
}
