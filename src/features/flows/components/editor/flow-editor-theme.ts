/** Paleta del editor visual (inspirada en canvas tipo workflow industrial). */
export const flowEditorTheme = {
  /** Fondo del canvas — verde petróleo */
  canvas: "#1A4543",
  /** Líneas métricas de fondo (sin números) */
  canvasGridMinor: "rgba(143, 196, 190, 0.14)",
  canvasGridMajor: "rgba(143, 196, 190, 0.34)",
  /** Paneles laterales */
  panel: "#E8EEED",
  panelBorder: "#B8C9C6",
  panelMuted: "#4F5F5C",
  panelAccent: "#D8E8E5",
  /** Cabeceras y texto */
  ink: "#2D2E32",
  /** Acción principal (guardar, etc.) */
  primary: "#F47C20",
  primaryHover: "#E06A10",
  /** Conexiones entre nodos */
  edge: "#38BDF8",
  edgeSelected: "#0EA5E9",
  /** Selección de nodo */
  selectionRing: "#F47C20",
  handle: "#38BDF8",
} as const;

/** Bordes e iconos por tipo de nodo (fondo siempre blanco en el nodo). */
export const flowNodeTypeTheme: Record<
  string,
  { border: string; accent: string; iconBg: string }
> = {
  start: { border: "#10B981", accent: "#059669", iconBg: "#D1FAE5" },
  message: { border: "#3B82F6", accent: "#2563EB", iconBg: "#DBEAFE" },
  collect_fields: { border: "#8B5CF6", accent: "#7C3AED", iconBg: "#EDE9FE" },
  choice: { border: "#F59E0B", accent: "#D97706", iconBg: "#FEF3C7" },
  condition: { border: "#F97316", accent: "#EA580C", iconBg: "#FFEDD5" },
  review: { border: "#EC4899", accent: "#DB2777", iconBg: "#FCE7F3" },
  action: { border: "#6366F1", accent: "#4F46E5", iconBg: "#E0E7FF" },
  handoff: { border: "#EF4444", accent: "#DC2626", iconBg: "#FEE2E2" },
  confirmation: { border: "#14B8A6", accent: "#0D9488", iconBg: "#CCFBF1" },
  emit_event: { border: "#D946EF", accent: "#C026D3", iconBg: "#FAE8FF" },
  end: { border: "#64748B", accent: "#475569", iconBg: "#E2E8F0" },
  wait: { border: "#06B6D4", accent: "#0891B2", iconBg: "#CFFAFE" },
};

export const FLOW_EDITOR_DEFAULT_ZOOM = 1.35;
export const FLOW_EDITOR_MIN_ZOOM = 0.45;
export const FLOW_EDITOR_MAX_ZOOM = 2.2;

/** Cuadrícula métrica: celda menor y bloque mayor (5×5 celdas) */
export const FLOW_EDITOR_GRID_MINOR = 20;
export const FLOW_EDITOR_GRID_MAJOR = 100;
