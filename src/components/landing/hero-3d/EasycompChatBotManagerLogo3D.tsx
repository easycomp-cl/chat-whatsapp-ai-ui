"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND_ASSETS } from "@/lib/brand/constants";
import { HERO_3D_COLORS, INTRO_TIMELINE } from "./hero-3d.config";
import { introFactor, useIntroClock } from "./hero-3d-intro";
import { usePointer } from "./hero-3d-pointer";

/**
 * Official EasyComp mark as a textured plane (transparent PNG).
 */
export function EasycompChatBotManagerLogo3D() {
  const groupRef = useRef<THREE.Group>(null);
  const gaze = useRef({ x: 0, y: 0 });
  const texture = useLoader(THREE.TextureLoader, BRAND_ASSETS.mark);
  const { elapsedRef, reducedMotion } = useIntroClock();
  const { pointerRef } = usePointer();

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
  }, [texture]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [texture]
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
      <mesh material={material} position={[0, 0, 0.02]}>
        <planeGeometry args={[1.55, 1.52]} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[0.82, 48]} />
        <meshBasicMaterial
          color={HERO_3D_COLORS.ink}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
