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
  role: z.string().default("agent"),
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

export const noteSchema = z.object({
  note: z.string().min(1, "La nota es requerida"),
});

export const replySchema = z.object({
  text: z.string().min(1, "Escribe un mensaje"),
  reply_to_message_id: z.string().optional(),
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
