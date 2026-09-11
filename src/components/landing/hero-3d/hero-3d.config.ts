import type {
  Hero3DBreakpoint,
  Hero3DQuality,
  NodeLayout,
  QualitySettings,
  ResolvedHero3DQuality,
} from "./hero-3d.types";

/** Brand palette — local to the module; does not mutate global tokens. */
export const HERO_3D_COLORS = {
  violet: "#6D5EF5",
  violetDeep: "#4438CA",
  blue: "#397BFF",
  cyan: "#3EE6D0",
  white: "#FFFFFF",
  ink: "#111326",
  softWhite: "#F4F6FF",
} as const;

/**
 * TEMPORARY emblem geometry.
 * Official easycomp-chat-bot-manager mark SVG is not in the repo yet
 * (`docs/LANDING_ASSETS_REQUIRED.md`). Replace via `EasycompChatBotManagerLogo3D` /
 * `logo-geometry.ts` when `easycomp-chat-bot-manager-mark.svg` arrives — scene wiring stays.
 */
export const LOGO_ASSET_STATUS = {
  hasOfficialSvg: false,
  markPng: "/easycomp-chat-bot-manager-mark.png",
  requiredSvg: "public/easycomp-chat-bot-manager-mark.svg",
  temporaryEmblem: true,
} as const;

export const INTRO_TIMELINE = {
  core: 0.0,
  rings: 0.3,
  incoming: 0.6,
  firstConnection: 0.9,
  intent: 1.1,
  knowledge: 1.35,
  response: 1.6,
  handoff: 1.9,
  inbox: 2.2,
  done: 2.8,
} as const;

export const QUALITY_PRESETS: Record<ResolvedHero3DQuality, QualitySettings> = {
  low: {
    dpr: [1, 1],
    particleCount: 0,
    ringSegments: 48,
    nodeDetail: "simple",
    shadows: false,
    antialias: false,
  },
  medium: {
    dpr: [1, 1.25],
    particleCount: 18,
    ringSegments: 64,
    nodeDetail: "full",
    shadows: false,
    antialias: true,
  },
  high: {
    dpr: [1, 1.5],
    particleCount: 36,
    ringSegments: 96,
    nodeDetail: "full",
    shadows: false,
    antialias: true,
  },
};

export function resolveQuality(
  quality: Hero3DQuality,
  opts: {
    width: number;
    dpr: number;
    reducedMotion: boolean;
  }
): ResolvedHero3DQuality {
  if (quality !== "auto") return quality;
  if (opts.reducedMotion) return "low";
  if (opts.width < 640) return "low";
  if (opts.width < 1024 || opts.dpr > 2) return "medium";
  return "high";
}

export function resolveBreakpoint(width: number): Hero3DBreakpoint {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/** Base node layouts (desktop). Compacted for tablet/mobile in getNodeLayouts. */
const DESKTOP_NODES: NodeLayout[] = [
  { key: "incoming", position: [-1.55, 0.95, 0.15], scale: 1 },
  { key: "intent", position: [1.45, 0.75, -0.1], scale: 0.95 },
  { key: "knowledge", position: [1.55, -0.15, 0.2], scale: 0.9 },
  { key: "response", position: [-1.4, -0.55, 0.1], scale: 1 },
  { key: "handoff", position: [0.95, -1.05, 0.25], scale: 0.9 },
  { key: "inbox", position: [0, -1.45, 0.05], scale: 1 },
];

export function getNodeLayouts(
  breakpoint: Hero3DBreakpoint,
  progress = 0
): NodeLayout[] {
  const spread = 1 + Math.min(Math.max(progress, 0), 1) * 0.12;
  const compact =
    breakpoint === "mobile" ? 0.62 : breakpoint === "tablet" ? 0.78 : 1;

  return DESKTOP_NODES.map((node) => {
    const [x, y, z] = node.position;
    let nx = x * compact * spread;
    let ny = y * compact * spread;
    const nz = z;

    if (breakpoint === "mobile") {
      // Slightly more circular / vertical stacking
      ny = y * compact * spread * 1.05;
      nx = x * compact * spread * 0.9;
    }

    return {
      ...node,
      position: [nx, ny, nz] as [number, number, number],
      scale: node.scale * (breakpoint === "mobile" ? 0.85 : 1),
    };
  });
}

export function clampProgress(progress?: number): number {
  if (typeof progress !== "number" || Number.isNaN(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}
