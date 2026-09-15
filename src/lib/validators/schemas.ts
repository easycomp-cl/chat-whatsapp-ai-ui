import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const faqSchema = z.object({
  question: z.string().min(1, "La pregunta es requerida"),
  answer: z.string().min(1, "La respuesta es requerida"),
  category: z.string().optional(),
  priority: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  alternate_phrases: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export const agentSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  role: z.string().default("collaborator"),
  notify_on_handoff: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const knowledgeSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  raw_text: z.string().min(1, "El contenido es requerido"),
  source_type: z.enum(["MANUAL", "TXT", "PDF", "DOCX"]).default("MANUAL"),
  auto_index: z.boolean().optional(),
});

export const knowledgeSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  top_k: z.coerce.number().int().min(1).max(20).optional(),
  chunk_size: z.coerce.number().int().min(100).max(2000).optional(),
  chunk_overlap: z.coerce.number().int().min(0).max(500).optional(),
  min_confidence: z.coerce.number().min(0).max(1).optional(),
  faq_similarity_threshold: z.coerce.number().min(0).max(1).optional(),
  auto_index_on_create: z.boolean().optional(),
});

export const shopifyConnectSchema = z.object({
  shop_domain: z.string().min(1, "Dominio requerido"),
  access_token: z.string().min(1, "Token requerido"),
});

export const settingsSchema = z.object({
  bot_global_enabled: z.boolean().optional(),
  confidence_threshold: z.coerce.number().min(0).max(1).optional(),
  default_ai_model: z.string().optional(),
  timezone: z.string().optional(),
  greeting_message: z.string().optional(),
  handoff_message: z.string().optional(),
  out_of_hours_message: z.string().optional(),
  knowledge: knowledgeSettingsSchema.optional(),
});

export const notePastelColorSchema = z.enum([
  "mint",
  "peach",
  "lemon",
  "lavender",
  "sky",
  "rose",
]);

export const noteSchema = z.object({
  note: z.string().min(1, "La nota es requerida"),
  color: notePastelColorSchema.optional().default("lemon"),
});

export const interactiveButtonOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
});

export const interactiveListRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export const interactiveListSectionSchema = z.object({
  title: z.string().optional(),
  rows: z.array(interactiveListRowSchema).min(1).max(10),
});

export const outboundInteractiveSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("button"),
    body: z.string().min(1).max(1024),
    buttons: z.array(interactiveButtonOptionSchema).min(1).max(3),
  }),
  z.object({
    type: z.literal("list"),
    body: z.string().min(1).max(1024),
    buttonText: z.string().min(1).max(20),
    sections: z.array(interactiveListSectionSchema).min(1).max(1),
  }),
]);

export const interactiveReplySchema = z.object({
  interactive: outboundInteractiveSchema,
  reply_to_message_id: z.string().optional(),
});

export const replySchema = z.object({
  text: z.string().min(1, "Escribe un mensaje"),
  reply_to_message_id: z.string().optional(),
});

export const templateReplySchema = z.object({
  template_name: z.string().min(1),
  language_code: z.string().min(1).default("es"),
  body_parameters: z.array(z.string()).default([]),
  button_parameters: z.array(z.string()).optional(),
  reply_to_message_id: z.string().optional(),
});

export const editMessageSchema = z.object({
  text: z.string().min(1, "Escribe un mensaje"),
});

export const deliveryRegionSchema = z.object({
  name: z.string().min(1, "Selecciona una región"),
  courier: z.string().min(1, "Indica el courier"),
  default_price: z.coerce.number().int().min(0, "Precio inválido"),
  active: z.boolean().default(true),
  seed_communes: z.boolean().default(true),
});

export const deliveryRegionPatchSchema = z.object({
  name: z.string().min(1).optional(),
  courier: z.string().min(1).optional(),
  default_price: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const deliveryCommunePatchSchema = z.object({
  price_override: z.coerce.number().int().min(0).nullable().optional(),
  active: z.boolean().optional(),
});

export const createFlowSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  template: z.enum(["default", "wood_quote"]).default("wood_quote"),
});

export const flowAgentInputSchema = z.object({
  values: z.record(z.string(), z.unknown()),
});

export const resolveFlowReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  notes: z.string().optional(),
});

export const flowWebhookIntegrationSchema = z.object({
  url: z.string().url("URL inválida"),
  enabled: z.boolean().default(true),
  events: z.array(z.string()).optional(),
  rotate_secret: z.boolean().optional(),
});

export const simulateFlowSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["customer", "agent", "system"]),
      content: z.string().min(1),
    })
  ),
  version_id: z.string().optional(),
  use_ai: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
export type KnowledgeInput = z.infer<typeof knowledgeSchema>;
export type KnowledgeSettingsInput = z.infer<typeof knowledgeSettingsSchema>;
export type ShopifyConnectInput = z.infer<typeof shopifyConnectSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type InteractiveReplyInput = z.infer<typeof interactiveReplySchema>;
export type TemplateReplyInput = z.infer<typeof templateReplySchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type DeliveryRegionInput = z.infer<typeof deliveryRegionSchema>;
export type DeliveryRegionPatchInput = z.infer<typeof deliveryRegionPatchSchema>;
export type DeliveryCommunePatchInput = z.infer<typeof deliveryCommunePatchSchema>;
export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type FlowAgentInput = z.infer<typeof flowAgentInputSchema>;
export type ResolveFlowReviewInput = z.infer<typeof resolveFlowReviewSchema>;
export type FlowWebhookIntegrationInput = z.infer<typeof flowWebhookIntegrationSchema>;
export type SimulateFlowInput = z.infer<typeof simulateFlowSchema>;
