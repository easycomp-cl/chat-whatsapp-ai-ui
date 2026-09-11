import * as THREE from "three";

/**
 * Shared orbital-motion math for conversation nodes and their connecting
 * lines. Kept pure/stateless so `ConversationNodes` and `ConnectionLines`
 * can each derive the exact same live position from `(layout, angleOffset)`
 * every frame without sharing refs or context — one source of truth, zero
 * cross-component coupling.
 */

/** Radians/second. One full revolution every ~45s — visible, never dizzying. */
export const ORBIT_ANGULAR_SPEED = 0.14;

/** Current rotation offset for the whole node ring, given elapsed seconds. */
export function getOrbitAngleOffset(
  elapsedTime: number,
  reducedMotion: boolean
): number {
  return reducedMotion ? 0 : elapsedTime * ORBIT_ANGULAR_SPEED;
}

/** Polar coordinates (around the core, on the XY/view plane) for a base layout position. */
export function toPolar(position: readonly [number, number, number]): {
  radius: number;
  baseAngle: number;
} {
  const [x, y] = position;
  return { radius: Math.hypot(x, y), baseAngle: Math.atan2(y, x) };
}

/** Live orbiting position for a node, given its rest layout and the shared angle offset. */
export function orbitPosition(
  position: readonly [number, number, number],
  angleOffset: number,
  out: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  const { radius, baseAngle } = toPolar(position);
  const angle = baseAngle + angleOffset;
  out.set(radius * Math.cos(angle), radius * Math.sin(angle), position[2]);
  return out;
}

/** Point on the quadratic Bézier (a → mid → b) at t ∈ [0,1], written into `out`. */
export function quadraticBezierPoint(
  a: THREE.Vector3,
  mid: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
  out: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  const it = 1 - t;
  const w0 = it * it;
  const w1 = 2 * it * t;
  const w2 = t * t;
  out.set(
    a.x * w0 + mid.x * w1 + b.x * w2,
    a.y * w0 + mid.y * w1 + b.y * w2,
    a.z * w0 + mid.z * w1 + b.z * w2
  );
  return out;
}
