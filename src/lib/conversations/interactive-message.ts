export type InteractiveButtonOption = {
  id: string;
  title: string;
};

export type InteractiveListRow = {
  id: string;
  title: string;
  description?: string;
};

export type InteractiveListSection = {
  title?: string;
  rows: InteractiveListRow[];
};

export type OutboundInteractiveButtons = {
  type: "button";
  body: string;
  buttons: InteractiveButtonOption[];
};

export type OutboundInteractiveList = {
  type: "list";
  body: string;
  buttonText: string;
  sections: InteractiveListSection[];
};

export type OutboundInteractiveMessage = OutboundInteractiveButtons | OutboundInteractiveList;

function isInteractiveButtons(value: unknown): value is OutboundInteractiveButtons {
  if (!value || typeof value !== "object") return false;
  const payload = value as OutboundInteractiveButtons;
  return payload.type === "button" && Array.isArray(payload.buttons);
}

function isInteractiveList(value: unknown): value is OutboundInteractiveList {
  if (!value || typeof value !== "object") return false;
  const payload = value as OutboundInteractiveList;
  return payload.type === "list" && Array.isArray(payload.sections);
}

function unwrapNestedInteractive(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const record = raw as Record<string, unknown>;
  const candidates = [
    record,
    record.interactive,
    record.outbound,
    (record.outbound as Record<string, unknown> | undefined)?.interactive,
    record.action,
    (record.action as Record<string, unknown> | undefined)?.parameters,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const value = candidate as Record<string, unknown>;
    if (value.type === "button" || value.type === "list") {
      return value;
    }
  }

  return raw;
}

export function parseMessageInteractive(raw: unknown): OutboundInteractiveMessage | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return parseMessageInteractive(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }

  const unwrapped = unwrapNestedInteractive(raw);
  if (isInteractiveButtons(unwrapped) || isInteractiveList(unwrapped)) {
    return unwrapped;
  }
  return null;
}

/** Reconstruye un interactivo desde el resumen persistido en `content_text`. */
export function inferInteractiveFromContentText(
  contentText: string
): OutboundInteractiveMessage | null {
  const trimmed = contentText.trim();
  const match = trimmed.match(/^([\s\S]+?)\n\[([^\]]+)\]$/);
  if (!match) return null;

  const body = match[1].trim();
  const labels = match[2]
    .split("·")
    .map((label) => label.trim())
    .filter(Boolean);

  if (!body || labels.length === 0) return null;

  if (labels.length <= 3) {
    return {
      type: "button",
      body,
      buttons: labels.map((title, index) => ({
        id: `inferred-button-${index}`,
        title,
      })),
    };
  }

  return {
    type: "list",
    body,
    buttonText: "Ver opciones",
    sections: [
      {
        rows: labels.map((title, index) => ({
          id: `inferred-row-${index}`,
          title,
        })),
      },
    ],
  };
}

export function resolveMessageInteractive(message: {
  interactive?: unknown;
  content_text?: string | null;
  content_type?: string | null;
}): OutboundInteractiveMessage | null {
  const direct = parseMessageInteractive(message.interactive);
  if (direct) return direct;

  const inferred = inferInteractiveFromContentText(message.content_text ?? "");
  if (inferred) return inferred;

  return null;
}

export function getInteractiveOptionLabels(
  interactive: OutboundInteractiveMessage
): string[] {
  if (interactive.type === "button") {
    return interactive.buttons.map((button) => button.title.trim()).filter(Boolean);
  }

  return interactive.sections
    .flatMap((section) => section.rows.map((row) => row.title.trim()))
    .filter(Boolean);
}

function normalizeInteractiveLabel(value: string): string {
  return value.trim().toLocaleLowerCase("es-CL");
}

export function matchesInteractiveOption(
  selection: string | null | undefined,
  label: string
): boolean {
  if (!selection?.trim()) return false;
  return (
    normalizeInteractiveLabel(selection) === normalizeInteractiveLabel(label)
  );
}

export function isInteractiveReplySelection(
  replyText: string | null | undefined,
  parentMessage?: {
    interactive?: unknown;
    content_text?: string | null;
    content_type?: string | null;
  } | null
): boolean {
  const selection = replyText?.trim();
  if (!selection || !parentMessage) return false;

  const interactive = resolveMessageInteractive(parentMessage);
  if (!interactive) return false;

  const normalizedSelection = normalizeInteractiveLabel(selection);
  return getInteractiveOptionLabels(interactive).some(
    (label) => normalizeInteractiveLabel(label) === normalizedSelection
  );
}

export function findCustomerSelectionForInteractive(
  messageId: string,
  messageById: Map<string, {
    direction?: string;
    reply_to_message_id?: string | null;
    content_text?: string | null;
  }>,
  parentMessage: {
    interactive?: unknown;
    content_text?: string | null;
    content_type?: string | null;
  }
): string | null {
  for (const candidate of messageById.values()) {
    if (candidate.direction !== "INBOUND") continue;
    if (candidate.reply_to_message_id !== messageId) continue;
    if (isInteractiveReplySelection(candidate.content_text, parentMessage)) {
      return candidate.content_text?.trim() ?? null;
    }
  }
  return null;
}

export function summarizeInteractiveMessage(interactive: OutboundInteractiveMessage): string {
  if (interactive.type === "button") {
    const labels = interactive.buttons.map((button) => button.title).join(" · ");
    return labels ? `${interactive.body}\n[${labels}]` : interactive.body;
  }

  const rows = interactive.sections.flatMap((section) => section.rows.map((row) => row.title));
  const labels = rows.join(" · ");
  return labels ? `${interactive.body}\n[${labels}]` : interactive.body;
}

export const DEMO_INTERACTIVE_BUTTONS: OutboundInteractiveButtons = {
  type: "button",
  body: "¿Cómo prefieres recibir tu pedido?",
  buttons: [
    { id: "delivery", title: "Despacho" },
    { id: "pickup", title: "Retiro en tienda" },
    { id: "advisor", title: "Hablar con asesor" },
  ],
};

export const DEMO_INTERACTIVE_LIST: OutboundInteractiveList = {
  type: "list",
  body: "Elige el horario de entrega que más te acomode:",
  buttonText: "Ver opciones",
  sections: [
    {
      title: "Horarios",
      rows: [
        { id: "morning", title: "Mañana", description: "09:00 – 13:00" },
        { id: "afternoon", title: "Tarde", description: "14:00 – 18:00" },
        { id: "evening", title: "Noche", description: "18:00 – 21:00" },
        { id: "flex", title: "Coordinar después", description: "Te contactamos" },
      ],
    },
  ],
};

export function buildOptimisticInteractiveMessage(params: {
  conversationId: string;
  businessId: string;
  interactive: OutboundInteractiveMessage;
  senderUserId?: string | null;
  senderDisplayName?: string | null;
}): import("@/types/database.types").Message {
  return {
    id: `optimistic-interactive-${Date.now()}`,
    conversation_id: params.conversationId,
    business_id: params.businessId,
    direction: "OUTBOUND",
    sender_type: "HUMAN",
    content_text: summarizeInteractiveMessage(params.interactive),
    content_type: "INTERACTIVE",
    ai_generated: false,
    created_at: new Date().toISOString(),
    whatsapp_delivery_status: "sent",
    reactions: [],
    interactive: params.interactive,
    sender_user_id: params.senderUserId ?? null,
    sender_display_name: params.senderDisplayName ?? null,
  };
}

/** @deprecated Usar editor interactivo + buildOptimisticInteractiveMessage */
export function buildOptimisticInteractivePreviewMessage(params: {
  conversationId: string;
  businessId: string;
  variant: "button" | "list";
}): import("@/types/database.types").Message {
  const interactive =
    params.variant === "button" ? DEMO_INTERACTIVE_BUTTONS : DEMO_INTERACTIVE_LIST;

  return buildOptimisticInteractiveMessage({
    conversationId: params.conversationId,
    businessId: params.businessId,
    interactive,
  });
}

export function isInteractivePreviewMessage(message: { id: string }): boolean {
  return message.id.startsWith("optimistic-interactive-");
}
