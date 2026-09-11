"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_3D_COLORS, INTRO_TIMELINE } from "./hero-3d.config";
import { introFactor, useIntroClock } from "./hero-3d-intro";
import type { ResolvedHero3DQuality } from "./hero-3d.types";

type OrbitRingsProps = {
  quality: ResolvedHero3DQuality;
  segments: number;
};

export function OrbitRings({ quality, segments }: OrbitRingsProps) {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const { elapsedRef, reducedMotion } = useIntroClock();
  const tube = quality === "low" ? 0.008 : 0.01;

  useFrame((state) => {
    const introT = introFactor(elapsedRef.current, INTRO_TIMELINE.rings, 0.55);
    const t = state.clock.elapsedTime;
    const s = THREE.MathUtils.lerp(0.55, 1, introT);

    const a = ringA.current;
    if (a) {
      a.scale.setScalar(s);
      (a.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
        0,
        0.35,
        introT
      );
      if (!reducedMotion) {
        a.rotation.z = t * 0.22;
        a.rotation.y = Math.sin(t * 0.1) * 0.12;
        a.rotation.x = 0.55 + Math.sin(t * 0.18) * 0.06;
      } else {
        a.rotation.x = 0.55;
      }
    }

    const b = ringB.current;
    if (b) {
      b.scale.setScalar(s * 1.08);
      (b.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
        0,
        0.28,
        introT
      );
      if (!reducedMotion) {
        b.rotation.z = -t * 0.17;
        b.rotation.y = 0.35 + Math.cos(t * 0.13) * 0.08;
        b.rotation.x = -0.4 + Math.sin(t * 0.11) * 0.05;
      } else {
        b.rotation.x = -0.4;
        b.rotation.y = 0.35;
      }
    }
  });

  return (
    <group>
      <mesh ref={ringA} rotation={[0.55, 0.15, 0]}>
        <torusGeometry args={[1.55, tube, 8, segments]} />
        <meshBasicMaterial
          color={HERO_3D_COLORS.violet}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ringB} rotation={[-0.4, 0.35, 0.2]}>
        <torusGeometry args={[1.85, tube * 0.85, 8, Math.max(32, segments - 16)]} />
        <meshBasicMaterial
          color={HERO_3D_COLORS.cyan}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
