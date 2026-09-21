import type { WhatsappTemplate, WhatsappTemplateParameterField } from "@/lib/bot-api/types";
import type { OutboundSenderContext } from "@/lib/conversations/outbound-sender";
import type { Customer, Message } from "@/types/database.types";
import {
  fillTemplatePreview,
  parameterFieldsFor,
  templatePackDefinition,
  templateResolvedBody,
} from "@/features/whatsapp-templates/utils";
import { resolveTemplateButtonUrl } from "@/features/whatsapp-templates/template-cta";

export type TemplateComposeDraft = {
  template: WhatsappTemplate;
  bodyValues: string[];
  buttonValues: string[];
};

export type TemplateComposeContext = {
  customerName?: string;
  businessName?: string;
  agentName?: string;
  orderRef?: string;
  orderStatus?: string;
  productName?: string;
  productDetail?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  paymentRef?: string;
};

export type TemplateFieldKind =
  | "customer"
  | "business"
  | "agent"
  | "order"
  | "orderStatus"
  | "product"
  | "productDetail"
  | "date"
  | "time"
  | "payment"
  | "button"
  | "other";

function looksLikePhone(value: string): boolean {
  const compact = value.replace(/\s/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 8) return false;
  return digits.length / Math.max(compact.length, 1) >= 0.7;
}

function firstToken(value: string): string {
  return value.trim().split(/\s+/)[0] ?? "";
}

export function chatCustomerGivenName(
  customer: Pick<Customer, "display_alias" | "name" | "phone_number"> | null | undefined
): string | undefined {
  const alias = customer?.display_alias?.trim();
  const name = customer?.name?.trim();
  const picked = alias || name;
  if (!picked) return undefined;
  const phone = customer?.phone_number?.replace(/\s/g, "") ?? "";
  if (phone && picked.replace(/\s/g, "") === phone) return undefined;
  if (looksLikePhone(picked)) return undefined;
  return firstToken(picked);
}

export function buildTemplateComposeContext(input: {
  customer?: Customer | null;
  businessName?: string | null;
  agentDisplayName?: string | null;
}): TemplateComposeContext {
  const customerName = chatCustomerGivenName(input.customer);
  const businessName = input.businessName?.trim() || undefined;
  const agentName = input.agentDisplayName?.trim()
    ? firstToken(input.agentDisplayName)
    : undefined;
  return {
    ...(customerName ? { customerName } : {}),
    ...(businessName ? { businessName } : {}),
    ...(agentName ? { agentName } : {}),
  };
}

export function effectiveTemplateFieldLabel(
  template: WhatsappTemplate,
  field: WhatsappTemplateParameterField
): string {
  const label = field.label?.trim() ?? "";
  if (label && !/^variable\s+\d+$/i.test(label)) return label;
  const pack = templatePackDefinition(template.name);
  return pack?.examples[field.index - 1]?.label ?? label ?? `Variable ${field.index}`;
}

export function shortTemplateFieldLabel(label: string): string {
  return label
    .replace(/^nombre del\s+/i, "")
    .replace(/^número de\s+/i, "")
    .replace(/^sufijo del\s+/i, "")
    .replace(/^enlace de\s+/i, "")
    .trim();
}

export function classifyTemplateField(
  field: WhatsappTemplateParameterField,
  label: string
): TemplateFieldKind {
  const haystack = `${label} ${field.component}`.toLowerCase();
  if (String(field.component).toLowerCase() === "button") return "button";
  if (/negocio|empresa|business/.test(haystack)) return "business";
  if (/responsable|asesor/.test(haystack)) return "agent";
  if (/estado/.test(haystack)) return "orderStatus";
  if (/pedido|order/.test(haystack)) return "order";
  if (/referencia|pago|link/.test(haystack)) return "payment";
  if (/detalle/.test(haystack)) return "productDetail";
  if (/producto/.test(haystack)) return "product";
  if (/fecha/.test(haystack)) return "date";
  if (/hora/.test(haystack)) return "time";
  if (/cliente|conversaci/.test(haystack)) return "customer";
  if (/nombre/.test(haystack)) return "customer";
  return "other";
}

function valueForKind(kind: TemplateFieldKind, ctx: TemplateComposeContext): string {
  switch (kind) {
    case "customer":
      return ctx.customerName?.trim() ?? "";
    case "business":
      return ctx.businessName?.trim() ?? "";
    case "agent":
      return ctx.agentName?.trim() ?? "";
    case "order":
      return ctx.orderRef?.trim() ?? "";
    case "orderStatus":
      return ctx.orderStatus?.trim() ?? "";
    case "product":
      return ctx.productName?.trim() ?? "";
    case "productDetail":
      return ctx.productDetail?.trim() ?? "";
    case "date":
      return ctx.appointmentDate?.trim() ?? "";
    case "time":
      return ctx.appointmentTime?.trim() ?? "";
    case "payment":
      return ctx.paymentRef?.trim() ?? "";
    default:
      return "";
  }
}

export function missingReasonForKind(kind: TemplateFieldKind): string | null {
  switch (kind) {
    case "customer":
      return "Este chat no tiene nombre de contacto.";
    case "business":
      return "No se encontró el nombre del negocio.";
    case "agent":
      return "No hay un responsable asociado.";
    case "order":
      return "No hay un pedido asociado a este chat.";
    case "orderStatus":
      return "No hay un estado de pedido en este chat.";
    case "product":
      return "No hay un producto asociado a este chat.";
    case "productDetail":
      return "No hay detalle de producto en este chat.";
    case "date":
      return "No hay una cita con fecha en este chat.";
    case "time":
      return "No hay una cita con hora en este chat.";
    case "payment":
    case "button":
      return "Completa el código del enlace (ej. pedido-1042).";
    default:
      return null;
  }
}

export function resolveTemplateFieldPrefill(
  template: WhatsappTemplate,
  field: WhatsappTemplateParameterField,
  ctx: TemplateComposeContext
): { value: string; missing: string | null } {
  const label = effectiveTemplateFieldLabel(template, field);
  const kind = classifyTemplateField(field, label);
  const value = valueForKind(kind, ctx);
  if (value) return { value, missing: null };
  return { value: "", missing: missingReasonForKind(kind) };
}

function valuesFor(template: WhatsappTemplate, component: "body" | "button", ctx: TemplateComposeContext): string[] {
  return parameterFieldsFor(template, component).map(
    (field) => resolveTemplateFieldPrefill(template, field, ctx).value
  );
}

export function createTemplateComposeDraft(
  template: WhatsappTemplate,
  ctx: TemplateComposeContext = {}
): TemplateComposeDraft {
  return {
    template,
    bodyValues: valuesFor(template, "body", ctx),
    buttonValues: valuesFor(template, "button", ctx),
  };
}

export function templateDraftIsComplete(draft: TemplateComposeDraft): boolean {
  const bodyFields = parameterFieldsFor(draft.template, "body");
  const buttonFields = parameterFieldsFor(draft.template, "button");
  return (
    bodyFields.every((_, index) => Boolean(draft.bodyValues[index]?.trim())) &&
    buttonFields.every((_, index) => Boolean(draft.buttonValues[index]?.trim()))
  );
}

export function templateDraftMissingMessage(draft: TemplateComposeDraft): string | null {
  const bodyFields = parameterFieldsFor(draft.template, "body");
  const buttonFields = parameterFieldsFor(draft.template, "button");
  if (bodyFields.some((_, index) => !draft.bodyValues[index]?.trim())) {
    return "Completa todas las variables de la plantilla.";
  }
  if (buttonFields.some((_, index) => !draft.buttonValues[index]?.trim())) {
    return "Completa el sufijo del botón de la plantilla.";
  }
  return null;
}

export function renderedTemplateBody(draft: TemplateComposeDraft): string {
  return fillTemplatePreview(templateResolvedBody(draft.template), draft.bodyValues);
}

export function buildOptimisticTemplateMessage(input: {
  conversationId: string;
  businessId: string;
  draft: TemplateComposeDraft;
  replyToMessageId?: string | null;
  outboundSender?: OutboundSenderContext;
}): Message {
  return {
    id: `optimistic-template-${Date.now()}`,
    conversation_id: input.conversationId,
    business_id: input.businessId,
    direction: "OUTBOUND",
    sender_type: "HUMAN",
    content_text: renderedTemplateBody(input.draft),
    content_type: "TEMPLATE",
    template_name: input.draft.template.name,
    template_button_url: resolveTemplateButtonUrl(
      templatePackDefinition(input.draft.template.name),
      input.draft.buttonValues.find((value) => value.trim()) ?? null
    ),
    ai_generated: false,
    created_at: new Date().toISOString(),
    whatsapp_delivery_status: "pending",
    reply_to_message_id: input.replyToMessageId ?? null,
    reactions: [],
    sender_user_id: input.outboundSender?.userId ?? null,
    sender_display_name: input.outboundSender?.displayName ?? null,
  };
}
