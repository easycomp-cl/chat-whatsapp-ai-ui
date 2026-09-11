/** Nombres de objetos en la escena Spline — deben coincidir con SPLINE_SCENE_SPEC.md */
export const SPLINE_OBJECTS = {
  core: "EasycompChatBotManagerCore",
  incomingMessage: "IncomingMessage",
  intentNode: "IntentNode",
  knowledgeNodes: "KnowledgeNodes",
  aiResponse: "AIResponse",
  humanHandoff: "HumanHandoff",
  dashboard: "DashboardPanel",
  whatsAppChannel: "WhatsAppChannel",
  futureChannels: "FutureChannels",
  ambientParticles: "AmbientParticles",
  mainCamera: "MainCamera",
} as const;

export type SplineObjectKey = keyof typeof SPLINE_OBJECTS;

export function getSplineSceneUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL?.trim();
  return url && url.length > 0 ? url : null;
}
