"use client";

// Must run before <Canvas> creates the R3F store (see file for why).
import "@/lib/threeConsole";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { ACESFilmicToneMapping, type Object3D, SRGBColorSpace } from "three";
import { CORE_STYLE, ENABLE_HAZE, PALETTE } from "@/constants/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useQualityTier } from "@/hooks/useQualityTier";
import { isInteractive, useBootStore } from "@/store/bootStore";
import { useWindowStore } from "@/store/windowStore";
import { CameraController } from "./camera/CameraController";
import { BlackHole } from "./core/BlackHole";
import { EnergyCore } from "./core/EnergyCore";
import { CosmicHaze } from "./effects/CosmicHaze";
import { Backdrop } from "./environment/Backdrop";
import { UniverseEnvironment } from "./environment/UniverseEnvironment";
import { ParticleField } from "./particles/ParticleField";
import { RegionProjector } from "./RegionProjector";

/**
 * Warm-up, then mark the scene ready.
 * Frame 1 renders with every hidden object forced visible and frustum culling
 * off (plasma fog, black hole, off-screen regions — all at zero opacity/scale,
 * so nothing shows), which compiles
 * the exact shader variants used through the bloom pipeline. Frame 2 restores
 * visibility and signals ready, so nothing compiles mid-cinematic.
 */
function ReadySignal() {
  const step = useRef(0);
  const forced = useRef<Object3D[]>([]);
  const culled = useRef<Object3D[]>([]);
  useFrame(({ scene }) => {
    if (step.current === 0) {
      scene.traverse((o) => {
        if (!o.visible) {
          forced.current.push(o);
          o.visible = true;
        }
        if (o.frustumCulled) {
          culled.current.push(o);
          o.frustumCulled = false;
        }
      });
      step.current = 1;
    } else if (step.current === 1) {
      forced.current.forEach((o) => (o.visible = false));
      culled.current.forEach((o) => (o.frustumCulled = true));
      forced.current = [];
      culled.current = [];
      step.current = 2;
      requestAnimationFrame(() => useBootStore.getState().setSceneReady());
    }
  });
  return null;
}

/**
 * Stop rendering the universe while a window covers the screen (maximised, or
 * any window on a phone). The last frame stays on the canvas behind the glass,
 * and the browser also stops re-blurring it every frame.
 */
function RenderGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const mobile = useIsMobile();
  const covered = useWindowStore((s) => Object.values(s.windows).some((w) => w && !w.minimized && (w.maximized || mobile)));
  useEffect(() => {
    // "demand" (not "never") so a resize still redraws one frame.
    setFrameloop(covered ? "demand" : "always");
  }, [covered, setFrameloop]);
  return null;
}

/**
 * The single persistent WebGL canvas (roadmap §3, Layer 1). Mounted once for
 * the life of the page; navigation never recreates the renderer.
 */
export default function UniverseCanvas() {
  const tier = useQualityTier();
  const [dpr, setDpr] = useState(tier.initialDpr);
  const setRenderMode = useBootStore((s) => s.setRenderMode);
  const interactive = () => isInteractive(useBootStore.getState().phase);

  return (
    <Canvas
      className="universe-canvas"
      dpr={dpr}
      camera={{ position: [0, 0, 7], fov: 45, near: 0.1, far: 600 }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor(PALETTE.void, 1);
        scene.background = null;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          setRenderMode("fallback");
        });
      }}
      aria-hidden
    >
      <PerformanceMonitor
        // Resolution changes resize every render target (a visible hitch), so
        // only adapt once the cinematic is over.
        onDecline={() => interactive() && setDpr((d) => Math.max(tier.dpr[0], d - 0.25))}
        onIncline={() => interactive() && setDpr((d) => Math.min(tier.dpr[1], d + 0.25))}
        flipflops={3}
      >
        <Suspense fallback={null}>
          <Backdrop stars={tier.stars} />
          <ParticleField count={tier.particles} />
          {CORE_STYLE === "blackhole" ? <BlackHole steps={tier.name === "high" ? 220 : 120} lite={tier.liteCore} /> : <EnergyCore detail={tier.coreDetail} />}
          {ENABLE_HAZE && <CosmicHaze />}
          <UniverseEnvironment />
          <CameraController />
          <RegionProjector />
          <ReadySignal />
          <RenderGate />
        </Suspense>
        {tier.bloom && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.2} radius={0.6} />
          </EffectComposer>
        )}
      </PerformanceMonitor>
    </Canvas>
  );
}
