import type { OnboardingDraft, OnboardingPatch, OnboardingOffering } from "./types";
import { BUSINESS_DESCRIPTION_MAX, BUSINESS_DESCRIPTION_MIN } from "./types";
import { validateScheduleString } from "./schedule-utils";
import { TWC_SAMPLE_OFFERINGS } from "./twc-sample-data";

export function createEmptyOffering(): OnboardingOffering {
  return {
    type: "product",
    name: "",
    description: "",
    currency: "CLP",
  };
}

export function resolveUseNamedAgent(draft: OnboardingDraft): boolean {
  if (draft.bot_identity?.use_named_agent != null) {
    return draft.bot_identity.use_named_agent;
  }
  return Boolean(draft.bot_identity?.bot_name?.trim());
}

export function createEmptyDraft(): OnboardingDraft {
  const offerings =
    process.env.NODE_ENV === "development"
      ? TWC_SAMPLE_OFFERINGS.map((o) => ({ ...o }))
      : [createEmptyOffering()];

  return {
    identity: {
      business_name: process.env.NODE_ENV === "development" ? "The Wood Club" : "",
      business_type: "products",
      description: "",
    },
    offerings,
    operations: { schedule: "", payment_methods: [] },
    human_contact: { admin_name: "", admin_phone: "", notify_on_handoff: true },
    bot_identity: {
      use_named_agent: process.env.NODE_ENV === "development",
      bot_name: process.env.NODE_ENV === "development" ? "Woody" : "",
      bot_tone: "profesional y cercano",
      greeting_message:
        process.env.NODE_ENV === "development"
          ? "Hola, soy Woody de The Wood Club. ¿En qué te ayudo?"
          : "",
    },
  };
}

export function mergeDraft(
  base: OnboardingDraft,
  patch: OnboardingPatch | Partial<OnboardingDraft>
): OnboardingDraft {
  const mergedOps = { ...base.operations, ...patch.operations };
  const region =
    mergedOps.region ??
    mergedOps.city ??
    base.operations?.region ??
    base.operations?.city;

  return {
    identity: { ...base.identity, ...patch.identity },
    offerings: patch.offerings ?? base.offerings,
    operations: {
      ...mergedOps,
      region,
      city: region,
    },
    human_contact: { ...base.human_contact, ...patch.human_contact },
    bot_identity: { ...base.bot_identity, ...patch.bot_identity },
  };
}

export function validateStep(step: number, draft: OnboardingDraft): string | null {
  switch (step) {
    case 1: {
      const name = draft.identity?.business_name?.trim() ?? "";
      const desc = draft.identity?.description?.trim() ?? "";
      if (!name) return "El nombre del negocio es obligatorio.";
      if (name.length < 2) return "El nombre del negocio debe tener al menos 2 caracteres.";
      if (!draft.identity?.business_type) return "Selecciona el tipo de negocio.";
      if (desc.length < BUSINESS_DESCRIPTION_MIN)
        return `La descripción debe tener al menos ${BUSINESS_DESCRIPTION_MIN} caracteres.`;
      if (desc.length > BUSINESS_DESCRIPTION_MAX)
        return `La descripción no puede superar ${BUSINESS_DESCRIPTION_MAX} caracteres.`;
      return null;
    }
    case 2: {
      const items = draft.offerings ?? [];
      if (items.length < 1) return "Agrega al menos un producto o servicio.";
      for (const item of items) {
        if (!item.name.trim()) return "Cada ítem necesita un nombre.";
        if (item.description.trim().length < 10)
          return "La descripción de cada ítem debe tener al menos 10 caracteres.";
      }
      return null;
    }
    case 3: {
      const scheduleError = validateScheduleString(draft.operations?.schedule ?? "");
      if (scheduleError) return scheduleError;
      if ((draft.operations?.payment_methods?.length ?? 0) < 1)
        return "Selecciona al menos un medio de pago.";
      return null;
    }
    case 4: {
      if (!draft.human_contact?.admin_name?.trim()) return "El nombre del responsable es obligatorio.";
      const phone = draft.human_contact?.admin_phone?.trim() ?? "";
      if (!/^\+[1-9]\d{6,14}$/.test(phone))
        return "El teléfono debe estar en formato E.164 (ej. +56912345678).";
      return null;
    }
    case 5: {
      if (resolveUseNamedAgent(draft) && !draft.bot_identity?.bot_name?.trim()) {
        return "El nombre del agente es obligatorio.";
      }
      const greeting = draft.bot_identity?.greeting_message?.trim() ?? "";
      if (!greeting) return "El mensaje de saludo es obligatorio.";
      if (greeting.length < 10) {
        return "El saludo debe tener al menos 10 caracteres.";
      }
      return null;
    }
    default:
      return null;
  }
}

export function buildStepPatch(step: number, draft: OnboardingDraft): OnboardingPatch {
  switch (step) {
    case 1:
      return {
        identity: {
          business_name: draft.identity!.business_name!.trim(),
          business_type: draft.identity!.business_type!,
          description: draft.identity!.description!.trim(),
        },
      };
    case 2:
      return {
        offerings: (draft.offerings ?? []).map((o) => ({
          ...o,
          name: o.name.trim(),
          description: o.description.trim(),
          ...(o.price != null && o.price > 0 ? { price: o.price, currency: o.currency ?? "CLP" } : {}),
        })),
      };
    case 3:
      return {
        operations: {
          schedule: draft.operations!.schedule!.trim(),
          city:
            draft.operations?.region?.trim() ||
            draft.operations?.city?.trim() ||
            undefined,
          commune: draft.operations?.commune?.trim() || undefined,
          address: draft.operations?.address?.trim() || undefined,
          payment_methods: draft.operations!.payment_methods!,
          delivery_notes: draft.operations?.delivery_notes?.trim() || undefined,
        },
      };
    case 4:
      return {
        human_contact: {
          admin_name: draft.human_contact!.admin_name!.trim(),
          admin_phone: draft.human_contact!.admin_phone!.trim(),
          notify_on_handoff: draft.human_contact!.notify_on_handoff ?? true,
        },
      };
    case 5: {
      const useNamedAgent = resolveUseNamedAgent(draft);
      return {
        bot_identity: {
          use_named_agent: useNamedAgent,
          bot_name: useNamedAgent ? draft.bot_identity!.bot_name!.trim() : "",
          bot_tone: draft.bot_identity!.bot_tone!.trim(),
          greeting_message: draft.bot_identity?.greeting_message?.trim() ?? "",
        },
      };
    }
    default:
      return {};
  }
}

export function buildBotPreviewAnswer(draft: OnboardingDraft): string {
  const desc = draft.identity?.description?.trim();
  const offerings = draft.offerings?.filter((o) => o.name.trim()) ?? [];

  const parts: string[] = [];
  if (desc) parts.push(desc);

  if (offerings.length > 0) {
    const list = offerings
      .map((o) => {
        const price =
          o.price != null && o.price > 0
            ? ` ($${o.price.toLocaleString("es-CL")} ${o.currency ?? "CLP"})`
            : "";
        return `• ${o.name}${price}: ${o.description}`;
      })
      .join("\n");
    parts.push(`Ofrecemos:\n${list}`);
  }

  return parts.join("\n\n") || "Aún no hay información suficiente para generar una respuesta.";
}
