"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_3D_COLORS, INTRO_TIMELINE } from "./hero-3d.config";
import { introFactor, useIntroClock } from "./hero-3d-intro";
import { usePointer } from "./hero-3d-pointer";
import { createEasycompChatBotManagerLogoGeometry } from "./logo-geometry";

/**
 * The brand mark — protagonist of the scene. Idles with a slow float/turn,
 * and subtly "looks" toward the cursor (damped, limited amplitude) so the
 * whole core reads as alive without feeling like a manipulable object.
 */
export function EasycompChatBotManagerLogo3D() {
  const groupRef = useRef<THREE.Group>(null);
  const gaze = useRef({ x: 0, y: 0 });
  const geometry = useMemo(() => createEasycompChatBotManagerLogoGeometry(), []);
  const { elapsedRef, reducedMotion } = useIntroClock();
  const { pointerRef } = usePointer();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: 0.34,
        roughness: 0.26,
        envMapIntensity: 0.75,
        emissive: new THREE.Color(HERO_3D_COLORS.violet),
        emissiveIntensity: 0.07,
      }),
    []
  );

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    const introT = introFactor(elapsedRef.current, INTRO_TIMELINE.core, 0.6);
    g.scale.setScalar(THREE.MathUtils.lerp(0.32, 1, introT));
    g.visible = introT > 0.01;

    if (reducedMotion) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
      return;
    }

    gaze.current.x = THREE.MathUtils.damp(
      gaze.current.x,
      pointerRef.current.x,
      7,
      delta
    );
    gaze.current.y = THREE.MathUtils.damp(
      gaze.current.y,
      pointerRef.current.y,
      7,
      delta
    );

    g.position.y = Math.sin(t * 0.45) * 0.05;
    g.rotation.y = Math.sin(t * 0.22) * 0.1 + gaze.current.x * 0.22;
    g.rotation.x = Math.cos(t * 0.18) * 0.04 - gaze.current.y * 0.14;
  });

  return (
    <group ref={groupRef} dispose={null}>
      <mesh geometry={geometry} material={material} castShadow={false} />
    </group>
  );
}
