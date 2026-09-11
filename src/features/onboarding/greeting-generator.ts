import type { OnboardingDraft } from "./types";
import { resolveUseNamedAgent } from "./utils";

const CLIENT_GREETINGS = ["Hola", "Buenas", "Hola, buenas tardes"];

function pickClientGreeting(): string {
  return CLIENT_GREETINGS[0];
}

export function truncatePreviewText(text: string, maxLength = 110): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Genera un saludo sugerido según tono y datos del draft (cliente; sin llamada API). */
export function generateOnboardingGreeting(
  draft: OnboardingDraft,
  options?: { includeBotName?: boolean }
): string {
  const useNamedAgent = resolveUseNamedAgent(draft);
  const includeBotName =
    options?.includeBotName ?? (useNamedAgent && Boolean(draft.bot_identity?.bot_name?.trim()));
  const botName = draft.bot_identity?.bot_name?.trim();
  const businessName = draft.identity?.business_name?.trim();
  const tone = draft.bot_identity?.bot_tone ?? "profesional y cercano";

  if (includeBotName && botName) {
    const who = `soy ${botName}${businessName ? ` de ${businessName}` : ""}`;
    const byTone: Record<string, string> = {
      "profesional y cercano": `Hola, ${who}. ¿En qué te puedo ayudar?`,
      formal: `Buenos días, ${who}. ¿En qué puedo asistirle?`,
      "casual y amigable": `¡Hola! ${who}. ¿En qué te ayudamos?`,
      entusiasta: `¡Hola! ${who} 🙌 ¿Qué te gustaría saber hoy?`,
      empático: `Hola, ${who}. Estoy aquí para ayudarte con lo que necesites.`,
    };
    return truncatePreviewText(byTone[tone] ?? byTone["profesional y cercano"], 160);
  }

  const businessGreetings: Record<string, string> = businessName
    ? {
        "profesional y cercano": `Hola, gracias por contactar a ${businessName}. ¿En qué podemos ayudarte?`,
        formal: `Buenos días, gracias por comunicarse con ${businessName}. ¿En qué podemos asistirle?`,
        "casual y amigable": `¡Hola! Gracias por escribir a ${businessName}. ¿En qué te ayudamos?`,
        entusiasta: `¡Hola! Gracias por contactar a ${businessName} 🙌 ¿Qué te gustaría saber?`,
        empático: `Hola, gracias por escribir a ${businessName}. Estamos para ayudarte con lo que necesites.`,
      }
    : {
        "profesional y cercano": "Hola, gracias por escribirnos. ¿En qué podemos ayudarte?",
        formal: "Buenos días, gracias por comunicarse con nosotros. ¿En qué podemos asistirle?",
        "casual y amigable": "¡Hola! Gracias por escribirnos. ¿En qué te ayudamos?",
        entusiasta: "¡Hola! Gracias por contactarnos 🙌 ¿Qué te gustaría saber?",
        empático: "Hola, gracias por escribirnos. Estamos para ayudarte con lo que necesites.",
      };

  return truncatePreviewText(
    businessGreetings[tone] ?? businessGreetings["profesional y cercano"],
    160
  );
}

export function buildGreetingPreview(draft: OnboardingDraft): {
  clientMessage: string;
  botMessage: string;
} {
  const rawGreeting = draft.bot_identity?.greeting_message?.trim();

  return {
    clientMessage: pickClientGreeting(),
    botMessage: rawGreeting
      ? truncatePreviewText(rawGreeting)
      : generateOnboardingGreeting(draft),
  };
}

export function applyBotNameToGreeting(
  greeting: string,
  botName: string,
  businessName?: string
): string {
  const name = botName.trim();
  if (!name) return greeting;

  if (greeting.includes(name)) return greeting;

  const business = businessName?.trim();
  const suffix = business ? ` de ${business}` : "";
  const insertion = `, soy ${name}${suffix}`;

  if (/^hola\b/i.test(greeting)) {
    return greeting.replace(/^hola[,.!]?\s*/i, `Hola${insertion}. `);
  }

  return `Hola${insertion}. ${greeting}`.trim();
}
