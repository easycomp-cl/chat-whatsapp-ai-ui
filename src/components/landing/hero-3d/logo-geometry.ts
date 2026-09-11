import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HERO_3D_COLORS } from "./hero-3d.config";

/**
 * TEMPORARY easycomp-chat-bot-manager emblem, approximated from `easycomp-chat-bot-manager-mark.png`:
 * an outer "C" / speech-bubble frame (opening on the right, tail at
 * ~7–8 o'clock) wrapping five vertical capsule bars (sound-wave motif).
 * Replace with SVG-derived Shapes here once `easycomp-chat-bot-manager-mark.svg` lands —
 * scene wiring in `EasycompChatBotManagerLogo3D` stays untouched.
 *
 * @see LOGO_ASSET_STATUS in hero-3d.config.ts
 */
function roundedCapsule(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const r = halfW;
  const top = cy + halfH - r;
  const bottom = cy - halfH + r;

  shape.moveTo(cx - halfW, bottom);
  shape.lineTo(cx - halfW, top);
  shape.absarc(cx, top, r, Math.PI, 0, false);
  shape.lineTo(cx + halfW, bottom);
  shape.absarc(cx, bottom, r, 0, Math.PI, false);
  return shape;
}

/**
 * Outer "C" / speech-bubble frame: opening centered on the right (~2 to
 * 4 o'clock), sweeping the long way through 12 / 9 / 6 o'clock, with a
 * sharp speech-bubble tail spike near 7–8 o'clock (bottom-left).
 */
function createFrameShape(): THREE.Shape {
  const outerR = 0.95;
  const innerR = 0.71;
  const openingHalf = THREE.MathUtils.degToRad(29);
  const start = openingHalf;
  const end = Math.PI * 2 - openingHalf;
  const steps = 80;

  const outerPts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + ((end - start) * i) / steps;
    outerPts.push(
      new THREE.Vector2(Math.cos(t) * outerR, Math.sin(t) * outerR)
    );
  }

  // Insert the speech-bubble tail as a sharp outward spike along the arc.
  const tailAngle = THREE.MathUtils.degToRad(216);
  const tailIndex = Math.round(((tailAngle - start) / (end - start)) * steps);
  const tailBaseAngle = start + ((end - start) * tailIndex) / steps;
  const tip = new THREE.Vector2(
    Math.cos(tailBaseAngle) * (outerR + 0.42),
    Math.sin(tailBaseAngle) * (outerR + 0.42) - 0.05
  );
  outerPts.splice(tailIndex + 1, 0, tip);

  const shape = new THREE.Shape();
  outerPts.forEach((p, i) => {
    if (i === 0) shape.moveTo(p.x, p.y);
    else shape.lineTo(p.x, p.y);
  });

  for (let i = steps; i >= 0; i--) {
    const t = start + ((end - start) * i) / steps;
    shape.lineTo(Math.cos(t) * innerR, Math.sin(t) * innerR);
  }

  shape.closePath();
  return shape;
}

const FRAME_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.2,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.022,
  bevelSegments: 3,
  curveSegments: 16,
};

const BAR_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  ...FRAME_EXTRUDE,
  depth: 0.24,
};

/** Diagonal brand gradient (violet → blue → cyan), baked as vertex colors. */
function applyDiagonalGradient(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute("position");
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const spanX = Math.max(box.max.x - box.min.x, 0.0001);
  const spanY = Math.max(box.max.y - box.min.y, 0.0001);

  const violet = new THREE.Color(HERO_3D_COLORS.violet);
  const blue = new THREE.Color(HERO_3D_COLORS.blue);
  const cyan = new THREE.Color(HERO_3D_COLORS.cyan);
  const c = new THREE.Color();

  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const nx = (position.getX(i) - box.min.x) / spanX;
    const ny = (position.getY(i) - box.min.y) / spanY;
    // Bias toward x so the tail/left side reads clearly violet, matching
    // the reference mark, while the opening (right) leans cyan.
    const t = THREE.MathUtils.clamp(nx * 0.7 + ny * 0.3, 0, 1);

    if (t < 0.5) c.copy(violet).lerp(blue, t / 0.5);
    else c.copy(blue).lerp(cyan, (t - 0.5) / 0.5);

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

export function createEasycompChatBotManagerLogoGeometry(): THREE.BufferGeometry {
  const frame = new THREE.ExtrudeGeometry(createFrameShape(), FRAME_EXTRUDE);

  // Sound-wave bars: center tallest, tapering outward (≈30% / 60% / 100%).
  const barSpecs: Array<[cx: number, halfH: number]> = [
    [-0.34, 0.145],
    [-0.17, 0.275],
    [0, 0.46],
    [0.17, 0.275],
    [0.34, 0.145],
  ];
  const bars = barSpecs.map(
    ([cx, halfH]) =>
      new THREE.ExtrudeGeometry(roundedCapsule(cx, 0, 0.058, halfH), BAR_EXTRUDE)
  );

  const parts = [frame, ...bars];
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());

  if (!merged) {
    return new THREE.BoxGeometry(1, 1, 0.2);
  }

  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const center = new THREE.Vector3();
  box.getCenter(center);
  merged.translate(-center.x, -center.y, -center.z);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const s = 1.5 / maxDim;
  merged.scale(s, s, s);
  merged.computeVertexNormals();

  applyDiagonalGradient(merged);

  return merged;
}
