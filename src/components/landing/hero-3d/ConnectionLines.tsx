"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_3D_COLORS, INTRO_TIMELINE } from "./hero-3d.config";
import { NODE_INTRO_STARTS, introFactor, useIntroClock } from "./hero-3d-intro";
import {
  getOrbitAngleOffset,
  orbitPosition,
  quadraticBezierPoint,
} from "./hero-3d-orbit";
import type { NodeKey, NodeLayout } from "./hero-3d.types";

type ConnectionLinesProps = {
  layouts: NodeLayout[];
  progress: number;
};

const FLOW: Array<[NodeKey, NodeKey]> = [
  ["incoming", "intent"],
  ["intent", "knowledge"],
  ["knowledge", "response"],
  ["response", "handoff"],
  ["handoff", "inbox"],
];

/** Points sampled per curve — enough for a smooth arc, cheap to rewrite every frame. */
const SEGMENTS = 24;

export function ConnectionLines({ layouts, progress }: ConnectionLinesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const { elapsedRef, reducedMotion } = useIntroClock();

  const byKey = useMemo(() => {
    const map = new Map<NodeKey, NodeLayout>();
    layouts.forEach((l) => map.set(l.key, l));
    return map;
  }, [layouts]);

  const links = useMemo(() => {
    return FLOW.map(([from, to]) => {
      const a = byKey.get(from);
      const b = byKey.get(to);
      if (!a || !b) return null;
      return { from, to, aPos: a.position, bPos: b.position };
    }).filter(Boolean) as Array<{
      from: NodeKey;
      to: NodeKey;
      aPos: readonly [number, number, number];
      bPos: readonly [number, number, number];
    }>;
  }, [byKey]);

  // Positions orbit every frame, so the line geometries are just reusable
  // point buffers we overwrite in place (no per-frame allocation/rebuild).
  // Built as real THREE.Line objects (via <primitive>) rather than the
  // lowercase `<line>` JSX tag, which collides with SVG's intrinsic `line`.
  const lineObjects = useMemo(
    () =>
      links.map((_, i) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(SEGMENTS * 3), 3)
        );
        const mat = new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? HERO_3D_COLORS.blue : HERO_3D_COLORS.cyan,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          toneMapped: false,
        });
        return new THREE.Line(geo, mat);
      }),
    [links]
  );

  useEffect(() => {
    return () => {
      lineObjects.forEach((line) => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
    };
  }, [lineObjects]);

  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const elapsed = elapsedRef.current;
    const angleOffset = getOrbitAngleOffset(t, reducedMotion);
    const connectionStrength =
      introFactor(elapsed, INTRO_TIMELINE.firstConnection, 0.5) *
      (0.75 + progress * 0.25);

    links.forEach((link, i) => {
      orbitPosition(link.aPos, angleOffset, a);
      orbitPosition(link.bPos, angleOffset, b);
      mid.copy(a).add(b).multiplyScalar(0.5);
      mid.z += 0.35;
      mid.y += 0.15;

      const line = lineObjects[i];
      const attr = line?.geometry.getAttribute("position") as
        | THREE.BufferAttribute
        | undefined;
      if (line && attr) {
        for (let s = 0; s < SEGMENTS; s++) {
          const u = s / (SEGMENTS - 1);
          quadraticBezierPoint(a, mid, b, u, p);
          attr.setXYZ(s, p.x, p.y, p.z);
        }
        attr.needsUpdate = true;
        line.geometry.computeBoundingSphere();

        const visFrom = introFactor(elapsed, NODE_INTRO_STARTS[link.from], 0.4);
        const visTo = introFactor(elapsed, NODE_INTRO_STARTS[link.to], 0.4);
        const ready = Math.min(visFrom, visTo);
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = ready * connectionStrength * 0.65;
        line.visible = mat.opacity > 0.02;
      }

      const pulse = pulseRefs.current[i];
      if (pulse) {
        const visFrom = introFactor(elapsed, NODE_INTRO_STARTS[link.from], 0.4);
        const visTo = introFactor(elapsed, NODE_INTRO_STARTS[link.to], 0.4);
        const ready = Math.min(visFrom, visTo);
        if (ready < 0.2 || connectionStrength < 0.05) {
          pulse.visible = false;
          return;
        }
        pulse.visible = true;
        const u = reducedMotion
          ? 0.5
          : (Math.sin(t * 0.85 + i * 1.1) * 0.5 + 0.5) * 0.85 + 0.05;
        quadraticBezierPoint(a, mid, b, u, p);
        pulse.position.copy(p);
        (pulse.material as THREE.MeshBasicMaterial).opacity =
          0.7 * ready * connectionStrength;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {lineObjects.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      {links.map((_, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={(el) => {
            if (el) pulseRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial
            color={HERO_3D_COLORS.cyan}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
