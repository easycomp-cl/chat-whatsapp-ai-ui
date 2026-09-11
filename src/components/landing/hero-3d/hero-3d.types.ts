export type Hero3DQuality = "low" | "medium" | "high" | "auto";

export type ResolvedHero3DQuality = Exclude<Hero3DQuality, "auto">;

export type Hero3DBreakpoint = "mobile" | "tablet" | "desktop";

export type EasycompChatBotManagerHero3DProps = {
  className?: string;
  reducedMotion?: boolean;
  quality?: Hero3DQuality;
  /** 0–1 external progress for subtle future scroll variations */
  progress?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
};

export type Hero3DSceneProps = {
  quality: ResolvedHero3DQuality;
  breakpoint: Hero3DBreakpoint;
  reducedMotion: boolean;
  progress: number;
  introPlaying: boolean;
  onReady?: () => void;
};

export type NodeKey =
  | "incoming"
  | "intent"
  | "knowledge"
  | "response"
  | "handoff"
  | "inbox";

export type NodeLayout = {
  key: NodeKey;
  position: [number, number, number];
  scale: number;
};

export type QualitySettings = {
  dpr: [number, number];
  particleCount: number;
  ringSegments: number;
  nodeDetail: "simple" | "full";
  shadows: boolean;
  antialias: boolean;
};
