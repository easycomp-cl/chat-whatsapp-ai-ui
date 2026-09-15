import type { WhatsappTemplate, WhatsappTemplateParameterField } from "@/lib/bot-api/types";
import {
  STANDARD_WHATSAPP_TEMPLATES,
  type StandardTemplateDefinition,
  type TemplateExample,
  type TemplateInternalKind,
} from "./standard-pack";

export const TEMPLATE_STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprobada",
  PENDING: "Pendiente de Meta",
  REJECTED: "Rechazada",
  NOT_CREATED: "Sin crear",
  PAUSED: "Pausada",
  DISABLED: "Deshabilitada",
};

export const TEMPLATE_STATUS_CLASS: Record<string, string> = {
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  NOT_CREATED: "border-slate-200 bg-slate-50 text-slate-600",
  PAUSED: "border-orange-200 bg-orange-50 text-orange-800",
  DISABLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const NON_CUSTOMER_TEMPLATE_NAMES = new Set([
  "verificar_responsable_es",
  "aviso_handoff_es",
]);

export function normalizeTemplateStatus(status?: string | null): string {
  const raw = String(status ?? "NOT_CREATED").toUpperCase();
  if (raw in TEMPLATE_STATUS_LABEL) return raw;
  return "NOT_CREATED";
}

export function templateBodyPreview(template: WhatsappTemplate, fallback = ""): string {
  return (template.body_preview ?? template.bodyPreview ?? fallback).trim();
}

export function templateRejectionReason(template: WhatsappTemplate): string | null {
  const value = template.rejection_reason ?? template.rejectionReason;
  return value?.trim() ? value.trim() : null;
}

export function isApprovedTemplate(template: WhatsappTemplate): boolean {
  return normalizeTemplateStatus(template.status) === "APPROVED";
}

/** Plantillas que se envían al chat del cliente (no OTP ni aviso al responsable). */
export function isCustomerChatTemplate(template: WhatsappTemplate): boolean {
  if (NON_CUSTOMER_TEMPLATE_NAMES.has(template.name)) return false;
  if (String(template.category ?? "").toUpperCase() === "AUTHENTICATION") return false;
  return true;
}

export function fillTemplatePreview(body: string, values: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, rawIndex: string) => {
    const index = Number(rawIndex) - 1;
    const value = values[index]?.trim();
    return value || `{{${rawIndex}}}`;
  });
}

export type TemplateBodyPart =
  | { type: "text"; value: string }
  | { type: "variable"; index: number };

export function splitTemplateBody(body: string): TemplateBodyPart[] {
  const parts: TemplateBodyPart[] = [];
  const pattern = /\{\{(\d+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    parts.push({ type: "variable", index: Number(match[1]) });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts;
}

export function inferInternalKind(name: string, productUse?: string | null): TemplateInternalKind {
  const haystack = `${name} ${productUse ?? ""}`.toLowerCase();
  if (/otp|verif|auth|codigo|responsable/.test(haystack)) return "autenticacion";
  if (/pago|pay|link_pago/.test(haystack)) return "pago";
  if (/pedido|order/.test(haystack)) return "pedido";
  if (/producto|muestra|catalog/.test(haystack)) return "producto";
  if (/cita|recordatorio|aviso(?!_handoff)|notific/.test(haystack)) return "notificacion";
  if (/handoff|humano|servicio/.test(haystack)) return "servicio";
  if (/consulta|seguimiento|reabrir/.test(haystack)) return "consulta";
  return "otro";
}

export type TemplatePreviewContext = {
  businessName: string;
  userFirstName: string;
  customerName: string;
  productName: string;
  productDetail: string;
  orderRef: string;
  appointmentDate: string;
  appointmentTime: string;
};

function slotValueFromLabel(
  label: string,
  fallback: string,
  ctx: TemplatePreviewContext
): string {
  const haystack = label.toLowerCase();
  if (/negocio|empresa|business/.test(haystack)) return ctx.businessName;
  if (/responsable|asesor/.test(haystack)) return ctx.userFirstName;
  if (/otp|c[oó]digo/.test(haystack)) return fallback;
  if (/producto/.test(haystack)) return ctx.productName;
  if (/detalle/.test(haystack)) return ctx.productDetail;
  if (/pedido|referencia/.test(haystack)) return ctx.orderRef;
  if (/fecha/.test(haystack)) return ctx.appointmentDate;
  if (/hora/.test(haystack)) return ctx.appointmentTime;
  if (/estado/.test(haystack)) return fallback;
  if (/conversaci|cliente/.test(haystack)) return ctx.customerName;
  if (/nombre/.test(haystack)) return ctx.customerName;
  return fallback;
}

function packExamplesForContext(
  pack: StandardTemplateDefinition,
  ctx: TemplatePreviewContext
): TemplateExample[] {
  switch (pack.name) {
    case "verificar_responsable_es":
      return pack.examples;
    case "aviso_handoff_es":
      return [
        { label: "Nombre del responsable", value: ctx.userFirstName },
        { label: "Nombre del negocio", value: ctx.businessName },
        { label: "Cliente", value: ctx.customerName },
      ];
    case "seguimiento_asesor_es":
    case "reabrir_conversacion_es":
      return [
        { label: "Nombre del cliente", value: ctx.customerName },
        { label: "Nombre del negocio", value: ctx.businessName },
      ];
    case "pedido_actualizacion_es":
      return [
        { label: "Nombre del cliente", value: ctx.customerName },
        { label: "Número de pedido", value: ctx.orderRef },
        { label: "Estado", value: "En preparación" },
      ];
    case "recordatorio_cita_es":
      return [
        { label: "Nombre del cliente", value: ctx.customerName },
        { label: "Fecha", value: ctx.appointmentDate },
        { label: "Hora", value: ctx.appointmentTime },
      ];
    case "link_pago_es":
      return [
        { label: "Nombre del cliente", value: ctx.customerName },
        { label: "Referencia", value: `Pedido ${ctx.orderRef}` },
      ];
    case "muestra_producto_es":
      return [
        { label: "Nombre del cliente", value: ctx.customerName },
        { label: "Producto", value: ctx.productName },
        { label: "Detalle", value: ctx.productDetail },
      ];
    default:
      return pack.examples.map((example) => ({
        ...example,
        value: slotValueFromLabel(example.label, example.value, ctx),
      }));
  }
}

export function exampleValuesFor(
  template: WhatsappTemplate,
  pack?: StandardTemplateDefinition,
  ctx?: TemplatePreviewContext
): TemplateExample[] {
  if (pack && ctx) return packExamplesForContext(pack, ctx);
  if (pack?.examples?.length) {
    if (!ctx) return pack.examples;
    return pack.examples.map((example) => ({
      ...example,
      value: slotValueFromLabel(example.label, example.value, ctx),
    }));
  }

  const fields = parameterFieldsFor(template, "body");
  const base =
    fields.length > 0
      ? fields.map((field) => ({
          label: field.label || `Variable ${field.index}`,
          value: field.example?.trim() || `Valor ${field.index}`,
        }))
      : Array.from(
          {
            length:
              template.variable_count ??
              (templateBodyPreview(template).match(/\{\{\d+\}\}/g)?.length ?? 0),
          },
          (_, i) => ({
            label: `Variable ${i + 1}`,
            value: `Valor ${i + 1}`,
          })
        );

  if (!ctx) return base;
  return base.map((example) => ({
    ...example,
    value: slotValueFromLabel(example.label, example.value, ctx),
  }));
}

export function parameterFieldsFor(
  template: WhatsappTemplate,
  component: "body" | "button"
): WhatsappTemplateParameterField[] {
  const fields = template.parameter_fields ?? [];
  const matched = fields
    .filter((field) => String(field.component ?? "body").toLowerCase() === component)
    .sort((a, b) => a.index - b.index);
  if (matched.length > 0) return matched;

  if (component !== "body") return [];

  const count =
    template.variable_count ??
    (templateBodyPreview(template).match(/\{\{\d+\}\}/g)?.length ?? 0);
  return Array.from({ length: count }, (_, i) => ({
    component: "body",
    index: i + 1,
    label: `Variable ${i + 1}`,
    example: null,
  }));
}

export function templateDisplayTitle(template: WhatsappTemplate): string {
  const pack = STANDARD_WHATSAPP_TEMPLATES.find((item) => item.name === template.name);
  return pack?.title ?? template.product_use ?? template.name;
}
