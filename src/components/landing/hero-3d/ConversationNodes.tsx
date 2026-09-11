"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { HERO_3D_COLORS } from "./hero-3d.config";
import { NODE_INTRO_STARTS, introFactor, useIntroClock } from "./hero-3d-intro";
import { getOrbitAngleOffset, orbitPosition } from "./hero-3d-orbit";
import type { NodeKey, NodeLayout, ResolvedHero3DQuality } from "./hero-3d.types";

type ConversationNodesProps = {
  layouts: NodeLayout[];
  quality: ResolvedHero3DQuality;
  progress: number;
};

/**
 * Short, on-brand copy for each orbiting node — what it represents in a
 * real easycomp-chat-bot-manager flow (messages / AI business capabilities), not generic
 * "3D demo" labels. Only shown at "full" detail (medium/high quality).
 */
const NODE_LABELS: Record<NodeKey, string> = {
  incoming: "Mensaje del cliente",
  intent: "Intención con IA",
  knowledge: "Base de conocimiento",
  response: "Respuesta automática",
  handoff: "Equipo humano",
  inbox: "Bandeja unificada",
};

const NODE_LABEL_OFFSET_Y: Record<NodeKey, number> = {
  incoming: -0.26,
  intent: -0.32,
  knowledge: -0.24,
  response: -0.26,
  handoff: -0.36,
  inbox: -0.38,
};

/**
 * Drives two independent motions per node:
 * - `outerRef` orbits the node bodily around the core (shared angle, same
 *   formula `ConnectionLines` uses for its endpoints — keeps every link
 *   perfectly attached while the whole ring revolves).
 * - `innerRef` keeps the small breathing/float "alive" wobble on top.
 */
function useNodeMotion(
  outerRef: React.RefObject<THREE.Group | null>,
  innerRef: React.RefObject<THREE.Group | null>,
  phase: number,
  baseScale: number,
  nodeKey: NodeKey,
  progress: number,
  basePosition: readonly [number, number, number]
) {
  const { elapsedRef, reducedMotion } = useIntroClock();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    const outer = outerRef.current;
    if (outer) {
      const angleOffset = getOrbitAngleOffset(t, reducedMotion);
      orbitPosition(basePosition, angleOffset, outer.position);
    }

    const inner = innerRef.current;
    if (!inner) return;
    let visibility = introFactor(elapsedRef.current, NODE_INTRO_STARTS[nodeKey], 0.4);
    if (nodeKey === "inbox") visibility = Math.min(1, visibility + progress * 0.05);

    const appear = THREE.MathUtils.smoothstep(visibility, 0, 1);
    const breath = reducedMotion ? 1 : 1 + Math.sin(t * 0.7 + phase) * 0.035;
    const floatY = reducedMotion ? 0 : Math.sin(t * 0.55 + phase) * 0.04;
    inner.scale.setScalar(baseScale * appear * breath);
    inner.position.y = floatY;
    inner.visible = appear > 0.02;
  });
}

function SoftCard({
  color,
  width,
  height,
  depth = 0.06,
}: {
  color: string;
  width: number;
  height: number;
  depth?: number;
}) {
  return (
    <mesh>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={color}
        metalness={0.12}
        roughness={0.45}
        emissive={color}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

function IncomingMessage({ detail }: { detail: "simple" | "full" }) {
  return (
    <group>
      <SoftCard color={HERO_3D_COLORS.blue} width={0.72} height={0.32} />
      {detail === "full" ? (
        <>
          <mesh position={[-0.12, 0.04, 0.04]}>
            <boxGeometry args={[0.36, 0.035, 0.01]} />
            <meshBasicMaterial color="#dbe7ff" />
          </mesh>
          <mesh position={[-0.02, -0.05, 0.04]}>
            <boxGeometry args={[0.48, 0.028, 0.01]} />
            <meshBasicMaterial color="#c5d7ff" />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function IntentNode() {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial
          color={HERO_3D_COLORS.violet}
          emissive={HERO_3D_COLORS.violet}
          emissiveIntensity={0.45}
          metalness={0.2}
          roughness={0.35}
        />
      </mesh>
      <mesh scale={1.55}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial
          color={HERO_3D_COLORS.violet}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function KnowledgeNode({ detail }: { detail: "simple" | "full" }) {
  const dots = useMemo(
    () =>
      [
        [-0.16, 0.1, 0],
        [0.14, 0.12, 0.04],
        [0.02, -0.12, -0.02],
        [-0.08, -0.02, 0.06],
      ] as const,
    []
  );

  return (
    <group>
      {dots.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[detail === "full" ? 0.055 : 0.05, 12, 12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? HERO_3D_COLORS.blue : HERO_3D_COLORS.violet}
            metalness={0.15}
            roughness={0.4}
          />
        </mesh>
      ))}
      {detail === "full"
        ? dots.slice(0, -1).map((p, i) => {
            const next = dots[i + 1]!;
            const a = new THREE.Vector3(...p);
            const b = new THREE.Vector3(...next);
            const mid = a.clone().add(b).multiplyScalar(0.5);
            const dir = b.clone().sub(a);
            const len = dir.length();
            const quat = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              dir.clone().normalize()
            );
            return (
              <mesh key={`l-${i}`} position={mid} quaternion={quat}>
                <cylinderGeometry args={[0.008, 0.008, len, 6]} />
                <meshBasicMaterial
                  color={HERO_3D_COLORS.softWhite}
                  transparent
                  opacity={0.5}
                />
              </mesh>
            );
          })
        : null}
    </group>
  );
}

function AIResponse({ detail }: { detail: "simple" | "full" }) {
  return (
    <group>
      <SoftCard color={HERO_3D_COLORS.violet} width={0.7} height={0.3} depth={0.07} />
      {detail === "full" ? (
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.42, 0.04, 0.012]} />
          <meshBasicMaterial color="#e8e4ff" />
        </mesh>
      ) : null}
      <pointLight
        color={HERO_3D_COLORS.violet}
        intensity={0.25}
        distance={1.2}
        position={[0, 0, 0.4]}
      />
    </group>
  );
}

function HumanHandoff() {
  return (
    <group>
      <mesh>
        <capsuleGeometry args={[0.09, 0.12, 6, 12]} />
        <meshStandardMaterial
          color={HERO_3D_COLORS.cyan}
          emissive={HERO_3D_COLORS.cyan}
          emissiveIntensity={0.25}
          metalness={0.18}
          roughness={0.38}
        />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={HERO_3D_COLORS.cyan}
          metalness={0.15}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function InboxPanel({
  detail,
  progress,
}: {
  detail: "simple" | "full";
  progress: number;
}) {
  const rows = detail === "full" ? 3 : 2;
  const width = 0.85 + progress * 0.05;

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, 0.55, 0.05]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.05}
          roughness={0.55}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.18, 0.03]}>
        <boxGeometry args={[width * 0.7, 0.03, 0.01]} />
        <meshBasicMaterial color="#c8ccd8" />
      </mesh>
      {Array.from({ length: rows }).map((_, i) => (
        <group key={i} position={[0, 0.05 - i * 0.14, 0.035]}>
          <mesh position={[-width * 0.28, 0, 0]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial
              color={i === 0 ? "#00a884" : HERO_3D_COLORS.violet}
            />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[width * 0.45, 0.028, 0.008]} />
            <meshBasicMaterial color="#d6d9e4" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NodeHost({
  layout,
  quality,
  progress,
  phase,
}: {
  layout: NodeLayout;
  quality: ResolvedHero3DQuality;
  progress: number;
  phase: number;
}) {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  useNodeMotion(
    outerRef,
    innerRef,
    phase,
    layout.scale,
    layout.key,
    progress,
    layout.position
  );
  const detail = quality === "low" ? "simple" : "full";

  return (
    <group ref={outerRef} position={layout.position}>
      <group ref={innerRef}>
        {layout.key === "incoming" ? <IncomingMessage detail={detail} /> : null}
        {layout.key === "intent" ? <IntentNode /> : null}
        {layout.key === "knowledge" ? <KnowledgeNode detail={detail} /> : null}
        {layout.key === "response" ? <AIResponse detail={detail} /> : null}
        {layout.key === "handoff" ? <HumanHandoff /> : null}
        {layout.key === "inbox" ? (
          <InboxPanel detail={detail} progress={progress} />
        ) : null}
        {detail === "full" ? (
          <Text
            position={[0, NODE_LABEL_OFFSET_Y[layout.key], 0.08]}
            fontSize={0.086}
            lineHeight={1.15}
            color={HERO_3D_COLORS.ink}
            outlineWidth={0.006}
            outlineColor="#ffffff"
            outlineOpacity={0.85}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.9}
            textAlign="center"
          >
            {NODE_LABELS[layout.key]}
          </Text>
        ) : null}
      </group>
    </group>
  );
}

export function ConversationNodes({
  layouts,
  quality,
  progress,
}: ConversationNodesProps) {
  return (
    <group>
      {layouts.map((layout, i) => (
        <NodeHost
          key={layout.key}
          layout={layout}
          quality={quality}
          progress={progress}
          phase={i * 0.85}
        />
      ))}
    </group>
  );
}
