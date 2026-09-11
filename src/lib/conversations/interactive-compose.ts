import {
  type OutboundInteractiveMessage,
  summarizeInteractiveMessage,
} from "@/lib/conversations/interactive-message";

export const INTERACTIVE_MAX_BUTTONS = 3;
export const INTERACTIVE_MAX_LIST_ROWS = 10;
export const INTERACTIVE_MAX_BUTTON_TITLE = 20;
export const INTERACTIVE_MAX_LIST_ROW_TITLE = 24;
export const INTERACTIVE_MAX_LIST_ROW_DESCRIPTION = 72;
export const INTERACTIVE_MAX_LIST_BUTTON_TEXT = 20;
export const INTERACTIVE_MAX_BODY = 1024;

export type InteractiveComposeVariant = "button" | "list";

export type InteractiveButtonDraft = {
  title: string;
};

export type InteractiveListRowDraft = {
  title: string;
  description: string;
};

export type InteractiveComposeDraft = {
  variant: InteractiveComposeVariant;
  body: string;
  buttonText: string;
  sectionTitle: string;
  buttons: InteractiveButtonDraft[];
  rows: InteractiveListRowDraft[];
};

export type InteractiveComposeInvalidFields = {
  body: boolean;
  buttonText: boolean;
  buttonIndexes: number[];
  rowIndexes: number[];
};

export function createInteractiveComposeDraft(
  variant: InteractiveComposeVariant
): InteractiveComposeDraft {
  if (variant === "button") {
    return {
      variant,
      body: "",
      buttonText: "",
      sectionTitle: "",
      buttons: [{ title: "" }],
      rows: [],
    };
  }

  return {
    variant,
    body: "",
    buttonText: "",
    sectionTitle: "",
    buttons: [],
    rows: [{ title: "", description: "" }],
  };
}

function truncateInteractiveText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

export function slugInteractiveId(value: string, index: number): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 200);

  return normalized || `option_${index + 1}`;
}

export function getInteractiveComposeInvalidFields(
  draft: InteractiveComposeDraft
): InteractiveComposeInvalidFields {
  const body = !draft.body.trim();

  if (draft.variant === "button") {
    const buttonIndexes = draft.buttons
      .map((button, index) => (!button.title.trim() ? index : -1))
      .filter((index) => index >= 0);

    return {
      body,
      buttonText: false,
      buttonIndexes,
      rowIndexes: [],
    };
  }

  const buttonText = !draft.buttonText.trim();
  const rowIndexes = draft.rows
    .map((row, index) => (!row.title.trim() ? index : -1))
    .filter((index) => index >= 0);

  return {
    body,
    buttonText,
    buttonIndexes: [],
    rowIndexes,
  };
}

export function buildInteractiveFromDraft(
  draft: InteractiveComposeDraft
): OutboundInteractiveMessage | null {
  const result = validateInteractiveComposeDraft(draft);
  return result.ok ? result.interactive : null;
}

export function validateInteractiveComposeDraft(
  draft: InteractiveComposeDraft
): { ok: true; interactive: OutboundInteractiveMessage } | { ok: false; error: string } {
  const body = draft.body.trim();
  if (!body) {
    return { ok: false, error: "Escribe el cuerpo del mensaje." };
  }
  if (body.length > INTERACTIVE_MAX_BODY) {
    return {
      ok: false,
      error: `El cuerpo no puede superar ${INTERACTIVE_MAX_BODY} caracteres.`,
    };
  }

  if (draft.variant === "button") {
    if (draft.buttons.length === 0) {
      return { ok: false, error: "Añade al menos un botón." };
    }

    const emptyButton = draft.buttons.find((button) => !button.title.trim());
    if (emptyButton) {
      return { ok: false, error: "Completa el texto de todos los botones." };
    }

    if (draft.buttons.length > INTERACTIVE_MAX_BUTTONS) {
      return { ok: false, error: `Máximo ${INTERACTIVE_MAX_BUTTONS} botones.` };
    }

    const buttons = draft.buttons.map((button, index) => {
      const title = button.title.trim();
      return {
        id: slugInteractiveId(title, index),
        title: truncateInteractiveText(title, INTERACTIVE_MAX_BUTTON_TITLE),
      };
    });

    return {
      ok: true,
      interactive: {
        type: "button",
        body: truncateInteractiveText(body, INTERACTIVE_MAX_BODY),
        buttons,
      },
    };
  }

  const buttonText = draft.buttonText.trim();
  if (!buttonText) {
    return { ok: false, error: "Escribe el texto del botón de la lista." };
  }
  if (buttonText.length > INTERACTIVE_MAX_LIST_BUTTON_TEXT) {
    return {
      ok: false,
      error: `El texto del botón de lista no puede superar ${INTERACTIVE_MAX_LIST_BUTTON_TEXT} caracteres.`,
    };
  }

  if (draft.rows.length === 0) {
    return { ok: false, error: "Añade al menos una opción a la lista." };
  }

  const emptyRow = draft.rows.find((row) => !row.title.trim());
  if (emptyRow) {
    return { ok: false, error: "Completa el título de todas las opciones de la lista." };
  }

  if (draft.rows.length > INTERACTIVE_MAX_LIST_ROWS) {
    return { ok: false, error: `Máximo ${INTERACTIVE_MAX_LIST_ROWS} filas en la lista.` };
  }

  const rows = draft.rows.map((row, index) => {
    const title = row.title.trim();
    const description = row.description.trim();
    return {
      id: slugInteractiveId(title, index),
      title: truncateInteractiveText(title, INTERACTIVE_MAX_LIST_ROW_TITLE),
      ...(description
        ? {
            description: truncateInteractiveText(
              description,
              INTERACTIVE_MAX_LIST_ROW_DESCRIPTION
            ),
          }
        : {}),
    };
  });

  const sectionTitle = draft.sectionTitle.trim();

  return {
    ok: true,
    interactive: {
      type: "list",
      body: truncateInteractiveText(body, INTERACTIVE_MAX_BODY),
      buttonText: truncateInteractiveText(buttonText, INTERACTIVE_MAX_LIST_BUTTON_TEXT),
      sections: [
        {
          ...(sectionTitle ? { title: sectionTitle } : {}),
          rows,
        },
      ],
    },
  };
}

export function summarizeInteractiveDraft(draft: InteractiveComposeDraft): string {
  const interactive = buildInteractiveFromDraft(draft);
  return interactive ? summarizeInteractiveMessage(interactive) : draft.body.trim();
}
