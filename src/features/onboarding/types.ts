export type BusinessType = "products" | "services" | "both";

export type OnboardingOffering = {
  type: "product" | "service";
  name: string;
  description: string;
  price?: number;
  currency?: string;
};

export type OnboardingIdentity = {
  business_name: string;
  business_type: BusinessType;
  description: string;
};

export const BUSINESS_DESCRIPTION_MIN = 50;
export const BUSINESS_DESCRIPTION_MAX = 1000;

export type OnboardingOperations = {
  schedule: string;
  region?: string;
  /** @deprecated Usar `region`. Se mantiene para compatibilidad con drafts del backend (`city`). */
  city?: string;
  commune?: string;
  address?: string;
  payment_methods: string[];
  delivery_notes?: string;
};

export type OnboardingHumanContact = {
  admin_name: string;
  admin_phone: string;
  notify_on_handoff: boolean;
};

export type OnboardingBotIdentity = {
  /** Si true, el negocio responde con un agente con nombre propio (mascota virtual). */
  use_named_agent?: boolean;
  bot_name: string;
  bot_tone: string;
  greeting_message: string;
};

export type OnboardingDraft = {
  identity?: Partial<OnboardingIdentity>;
  offerings?: OnboardingOffering[];
  operations?: Partial<OnboardingOperations>;
  human_contact?: Partial<OnboardingHumanContact>;
  bot_identity?: Partial<OnboardingBotIdentity>;
};

export type ChecklistItem = {
  done: boolean;
  required: boolean;
};

export type SetupStatus = {
  setup_version: number;
  completed_at: string | null;
  progress_percent: number;
  can_go_live: boolean;
  onboarding_required: boolean;
  bot_global_enabled: boolean;
  checklist: {
    identity: ChecklistItem;
    offerings: ChecklistItem;
    operations: ChecklistItem;
    human_contact: ChecklistItem;
    bot_identity: ChecklistItem;
    whatsapp_channel: ChecklistItem;
    knowledge_indexed: ChecklistItem;
  };
  missing_for_go_live: string[];
  draft: OnboardingDraft;
};

export type OnboardingPatch = Partial<{
  identity: OnboardingIdentity;
  offerings: OnboardingOffering[];
  operations: OnboardingOperations;
  human_contact: OnboardingHumanContact;
  bot_identity: OnboardingBotIdentity;
}>;

export type CompleteOnboardingBody = {
  enable_bot: boolean;
  handoff_on_low_confidence: boolean;
};

export const WIZARD_STEPS = [
  { id: 1, key: "identity", label: "Tu negocio", hint: "Nombre, tipo y descripción" },
  { id: 2, key: "offerings", label: "Qué ofreces", hint: "Productos o servicios" },
  { id: 3, key: "operations", label: "Operación", hint: "Horario y pagos" },
  { id: 4, key: "human_contact", label: "Contacto humano", hint: "Responsable del negocio" },
  { id: 5, key: "bot_identity", label: "Tu asistente", hint: "Tono y vista previa" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  "efectivo",
  "transferencia",
  "tarjeta",
  "webpay",
  "otro",
] as const;

export const PAYMENT_METHOD_LABELS: Record<
  (typeof PAYMENT_METHOD_OPTIONS)[number],
  string
> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta débito/crédito",
  webpay: "Webpay",
  otro: "Otro",
};

export const BOT_TONE_OPTIONS = [
  "profesional y cercano",
  "formal",
  "casual y amigable",
  "entusiasta",
  "empático",
] as const;
