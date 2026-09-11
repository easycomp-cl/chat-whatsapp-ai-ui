"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_3D_COLORS, INTRO_TIMELINE } from "./hero-3d.config";
import { introFactor, useIntroClock } from "./hero-3d-intro";

type AmbientParticlesProps = {
  count: number;
};

/** Deterministic 0–1 hash (avoids Math.random in render). */
function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function AmbientParticles({ count }: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { elapsedRef, reducedMotion } = useIntroClock();

  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(Math.max(count, 0) * 3);
    const phases = new Float32Array(Math.max(count, 0));
    for (let i = 0; i < count; i++) {
      const r = 1.2 + hash01(i, 1) * 1.6;
      const theta = hash01(i, 2) * Math.PI * 2;
      const y = (hash01(i, 3) - 0.5) * 2.4;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r * 0.55;
      phases[i] = hash01(i, 4) * Math.PI * 2;
    }
    return { positions, phases };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    const pts = pointsRef.current;
    if (!pts || count === 0) return;
    const introT = introFactor(elapsedRef.current, INTRO_TIMELINE.rings, 0.55);
    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.lerp(0, 0.55, introT);

    if (reducedMotion) return;

    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const baseY = positions[i * 3 + 1]!;
      attr.setY(i, baseY + Math.sin(t * 0.35 + phases[i]!) * 0.08);
    }
    attr.needsUpdate = true;
    pts.rotation.y = t * 0.04;
  });

  if (count <= 0) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={HERO_3D_COLORS.softWhite}
        size={0.035}
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
