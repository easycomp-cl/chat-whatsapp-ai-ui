"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AmbientParticles } from "./AmbientParticles";
import { CameraRig } from "./CameraRig";
import { ConnectionLines } from "./ConnectionLines";
import { ConversationCore } from "./ConversationCore";
import { ConversationNodes } from "./ConversationNodes";
import { IntroClockProvider } from "./hero-3d-intro";
import { PointerProvider } from "./hero-3d-pointer";
import { OrbitRings } from "./OrbitRings";
import { QUALITY_PRESETS, getNodeLayouts } from "./hero-3d.config";
import type { Hero3DSceneProps } from "./hero-3d.types";

export function EasycompChatBotManagerScene({
  quality,
  breakpoint,
  reducedMotion,
  progress,
  introPlaying,
  onReady,
}: Hero3DSceneProps) {
  const settings = QUALITY_PRESETS[quality];
  const groupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const readySent = useRef(false);

  const layouts = useMemo(
    () => getNodeLayouts(breakpoint, progress),
    [breakpoint, progress]
  );

  useEffect(() => {
    if (readySent.current) return;
    readySent.current = true;
    onReady?.();
  }, [onReady]);

  // Whole-composition sway + a slowly drifting key light — cheap, premium
  // "alive" touch that doesn't depend on the intro/pointer contexts.
  useFrame((state) => {
    const g = groupRef.current;
    const light = keyLightRef.current;
    if (reducedMotion) {
      if (g) g.rotation.y = 0;
      return;
    }
    const t = state.clock.elapsedTime;
    if (g) g.rotation.y = Math.sin(t * 0.12) * 0.05;
    if (light) {
      light.position.x = 2.5 + Math.sin(t * 0.2) * 0.6;
      light.position.y = 3.2 + Math.cos(t * 0.15) * 0.4;
    }
  });

  const pointerEnabled = !reducedMotion && breakpoint !== "mobile";

  return (
    <IntroClockProvider reducedMotion={reducedMotion} introPlaying={introPlaying}>
      <PointerProvider enabled={pointerEnabled}>
        <ambientLight intensity={0.55} />
        <directionalLight
          ref={keyLightRef}
          position={[2.5, 3.2, 2]}
          intensity={0.85}
          color="#ffffff"
        />
        <directionalLight position={[-2, 1.5, -1]} intensity={0.28} color="#9eb6ff" />

        <CameraRig breakpoint={breakpoint} progress={progress} />

        <group ref={groupRef} position={[0, 0.05, 0]}>
          <ConversationCore />
          <OrbitRings quality={quality} segments={settings.ringSegments} />
          <ConnectionLines layouts={layouts} progress={progress} />
          <ConversationNodes
            layouts={layouts}
            quality={quality}
            progress={progress}
          />
          <AmbientParticles count={settings.particleCount} />
        </group>
      </PointerProvider>
    </IntroClockProvider>
  );
}
