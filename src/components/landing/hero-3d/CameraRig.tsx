"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useIntroClock } from "./hero-3d-intro";
import { usePointer } from "./hero-3d-pointer";
import type { Hero3DBreakpoint } from "./hero-3d.types";

type CameraRigProps = {
  breakpoint: Hero3DBreakpoint;
  progress: number;
};

/**
 * Depth-only parallax: the camera drifts a few degrees toward the cursor
 * with damped interpolation and a limited max angle. No OrbitControls, no
 * zoom/pan — reads as depth, not as an object the user manipulates.
 */
export function CameraRig({ breakpoint, progress }: CameraRigProps) {
  const size = useThree((s) => s.size);
  const { reducedMotion } = useIntroClock();
  const { pointerRef, isTouchRef } = usePointer();
  const target = useRef(new THREE.Vector3(0, 0.05, 0));
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const camera = state.camera;
    const baseZ = breakpoint === "mobile" ? 5.2 : breakpoint === "tablet" ? 4.6 : 4.2;
    // Frontal by default — no resting yaw offset. Only the cursor nudges it.
    const baseX = 0;
    const baseY = 0.08 + progress * 0.08;

    const maxYaw =
      !reducedMotion && breakpoint !== "mobile" && !isTouchRef.current
        ? 0.18
        : 0;
    const maxPitch = maxYaw * 0.55;

    const lookX = baseX + pointerRef.current.x * maxYaw;
    const lookY = baseY - pointerRef.current.y * maxPitch;

    // Higher damp lambda = quicker convergence to the cursor target, which
    // reads as fluid tracking instead of a laggy drift.
    target.current.x = THREE.MathUtils.damp(target.current.x, lookX, 6, delta);
    target.current.y = THREE.MathUtils.damp(target.current.y, lookY, 6, delta);

    desired.current.set(
      baseX + pointerRef.current.x * maxYaw * 0.35,
      baseY + pointerRef.current.y * maxPitch * 0.2,
      baseZ - progress * 0.15
    );

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      desired.current.x,
      5,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      desired.current.y,
      5,
      delta
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      desired.current.z,
      5,
      delta
    );

    lookAt.current.set(
      baseX * 0.3 + target.current.x * 0.4,
      0.05 + target.current.y * 0.4,
      0
    );
    camera.lookAt(lookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = size.width / Math.max(size.height, 1);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
