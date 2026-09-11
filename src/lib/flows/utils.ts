import type { FlowRunStatus } from "@/lib/bot-api/types";

export const FLOW_RUN_STATUS_LABELS: Record<FlowRunStatus, string> = {
  RUNNING: "En ejecución",
  AWAITING_CUSTOMER: "Esperando cliente",
  AWAITING_AGENT_INPUT: "Esperando agente",
  AWAITING_REVIEW: "En revisión",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  FAILED: "Fallido",
};

export const FLOW_DEFINITION_STATUS_LABELS = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
} as const;

export const FLOW_WEBHOOK_DELIVERY_STATUS_LABELS = {
  PENDING: "Pendiente",
  DELIVERING: "Enviando",
  DELIVERED: "Entregado",
  FAILED: "Fallido",
  DEAD_LETTER: "Abandonado",
} as const;

export function renderFlowTemplate(
  template: string,
  values: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
    const value = values[key.trim()];
    if (value === undefined || value === null) return `{{${key.trim()}}}`;
    return String(value);
  });
}

export function buildAgentInputPreviewValues(
  fields: Array<{ key: string; value?: unknown }>,
  prefilled?: Record<string, unknown>
): Record<string, unknown> {
  const values: Record<string, unknown> = { ...(prefilled ?? {}) };
  for (const field of fields) {
    if (field.value !== undefined && field.value !== null && field.value !== "") {
      values[field.key] = field.value;
    }
  }
  return values;
}
