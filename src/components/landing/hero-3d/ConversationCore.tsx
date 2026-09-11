"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EasycompChatBotManagerLogo3D } from "./EasycompChatBotManagerLogo3D";
import { HERO_3D_COLORS, INTRO_TIMELINE } from "./hero-3d.config";
import { introFactor, useIntroClock } from "./hero-3d-intro";

export function ConversationCore() {
  const glowRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const lightARef = useRef<THREE.PointLight>(null);
  const lightBRef = useRef<THREE.PointLight>(null);
  const { elapsedRef, reducedMotion } = useIntroClock();

  useFrame((state) => {
    const introT = introFactor(elapsedRef.current, INTRO_TIMELINE.core, 0.6);
    const t = state.clock.elapsedTime;

    const glow = glowRef.current;
    if (glow) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 0.8) * 0.06;
      glow.scale.setScalar(THREE.MathUtils.lerp(0.4, 1.15, introT) * pulse);
      (glow.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
        0,
        0.2,
        introT
      );
    }

    const rim = rimRef.current;
    if (rim) {
      const shimmer = reducedMotion ? 0.5 : 0.5 + Math.sin(t * 0.6) * 0.5;
      rim.scale.setScalar(THREE.MathUtils.lerp(0.5, 1.24, introT));
      (rim.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
        0,
        0.14 + shimmer * 0.08,
        introT
      );
      if (!reducedMotion) rim.rotation.z = t * 0.05;
    }

    if (lightARef.current) lightARef.current.intensity = 0.85 * introT;
    if (lightBRef.current) lightBRef.current.intensity = 0.35 * introT;
  });

  return (
    <group>
      <mesh ref={glowRef} position={[0, 0, -0.35]}>
        <sphereGeometry args={[0.95, 24, 24]} />
        <meshBasicMaterial
          color={HERO_3D_COLORS.violet}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      {/* Subtle shimmering rim halo — reads as premium satin light, not a lid. */}
      <mesh ref={rimRef} position={[0, 0, -0.16]}>
        <ringGeometry args={[0.86, 1.02, 48]} />
        <meshBasicMaterial
          color={HERO_3D_COLORS.cyan}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <EasycompChatBotManagerLogo3D />
      <pointLight
        ref={lightARef}
        color={HERO_3D_COLORS.violet}
        intensity={0}
        distance={4.5}
        decay={2}
        position={[0.2, 0.3, 1.2]}
      />
      <pointLight
        ref={lightBRef}
        color={HERO_3D_COLORS.cyan}
        intensity={0}
        distance={3.5}
        decay={2}
        position={[-0.6, 0.4, 0.8]}
      />
    </group>
  );
}
