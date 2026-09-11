import type { OnboardingDraft, OnboardingOffering } from "./types";
import { PAYMENT_METHOD_LABELS } from "./types";
import { buildGreetingPreview, truncatePreviewText } from "./greeting-generator";

export type PreviewTextMessage = {
  kind: "text";
  from: "client" | "bot";
  text: string;
  time: string;
};

export type PreviewProductMessage = {
  kind: "product";
  from: "bot";
  offering: OnboardingOffering;
  intro: string;
  time: string;
};

export type PreviewReplyButtonsMessage = {
  kind: "reply_buttons";
  from: "bot";
  text: string;
  options: string[];
  time: string;
};

export type PreviewMessage =
  | PreviewTextMessage
  | PreviewProductMessage
  | PreviewReplyButtonsMessage;

function formatNaturalList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function formatPaymentMethodsForPreview(methods: string[]): string[] {
  return methods
    .filter((method) => method !== "otro")
    .map((method) => {
      const label =
        PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS];
      if (!label) return method;
      return label.charAt(0).toLowerCase() + label.slice(1);
    });
}

function pickFeaturedOffering(draft: OnboardingDraft): OnboardingOffering | null {
  return draft.offerings?.find((o) => o.name.trim()) ?? null;
}

function buildScheduleSnippet(schedule: string): string {
  const firstBlock = schedule.split("|")[0]?.trim() || schedule.trim();
  return truncatePreviewText(`Atendemos ${firstBlock}`, 95);
}

function buildPaymentSnippet(draft: OnboardingDraft): string {
  const methods = formatPaymentMethodsForPreview(
    draft.operations?.payment_methods ?? []
  );

  if (methods.length === 0) {
    return "Consulta con nosotros los medios de pago disponibles.";
  }

  return truncatePreviewText(
    `Puedes pagar con ${formatNaturalList(methods)}.`,
    90
  );
}

/** Guión de conversación demo con datos reales del wizard. */
export function buildConversationPreview(draft: OnboardingDraft): PreviewMessage[] {
  const { clientMessage, botMessage } = buildGreetingPreview(draft);
  const offering = pickFeaturedOffering(draft);
  const schedule = draft.operations?.schedule?.trim();

  const messages: PreviewMessage[] = [
    { kind: "text", from: "client", text: clientMessage, time: "10:14" },
    { kind: "text", from: "bot", text: botMessage, time: "10:14" },
  ];

  if (offering) {
    const productAsk = offering.price
      ? `¿Cuánto sale la ${offering.name}?`
      : `¿Tienen ${offering.name}?`;

    messages.push({
      kind: "text",
      from: "client",
      text: productAsk,
      time: "10:15",
    });

    messages.push({
      kind: "product",
      from: "bot",
      offering,
      intro: truncatePreviewText(
        `¡Sí! ${offering.description}`,
        85
      ),
      time: "10:15",
    });
  } else {
    messages.push({
      kind: "text",
      from: "client",
      text: "¿Qué productos tienen?",
      time: "10:15",
    });
    messages.push({
      kind: "text",
      from: "bot",
      text: truncatePreviewText(
        draft.identity?.description?.trim() ||
          "Te puedo contar sobre nuestros productos y precios.",
        100
      ),
      time: "10:15",
    });
  }

  messages.push({
    kind: "text",
    from: "client",
    text: schedule ? "¿Cuál es su horario?" : "¿Cómo puedo pagar?",
    time: "10:16",
  });

  messages.push({
    kind: "text",
    from: "bot",
    text: schedule ? buildScheduleSnippet(schedule) : buildPaymentSnippet(draft),
    time: "10:16",
  });

  if (schedule && (draft.operations?.payment_methods?.length ?? 0) > 0) {
    messages.push({
      kind: "text",
      from: "client",
      text: "¿Y formas de pago?",
      time: "10:17",
    });
    messages.push({
      kind: "text",
      from: "bot",
      text: buildPaymentSnippet(draft),
      time: "10:17",
    });
  }

  messages.push({
    kind: "text",
    from: "client",
    text: offering ? "Me interesa, ¿cómo lo recibo?" : "¿Qué más me puedes contar?",
    time: "10:18",
  });

  messages.push({
    kind: "reply_buttons",
    from: "bot",
    text: offering
      ? "¿Cómo prefieres recibir tu pedido?"
      : "¿En qué más te puedo ayudar?",
    options: offering
      ? ["Despacho", "Retiro en tienda", "Hablar con asesor"]
      : ["Ver catálogo", "Horario", "Hablar con alguien"],
    time: "10:18",
  });

  return messages;
}
