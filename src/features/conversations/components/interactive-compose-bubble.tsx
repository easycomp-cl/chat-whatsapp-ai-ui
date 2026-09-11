"use client";

import { ChevronDown, List, Plus, Trash2 } from "lucide-react";
import {
  getInteractiveComposeInvalidFields,
  INTERACTIVE_MAX_BODY,
  INTERACTIVE_MAX_BUTTON_TITLE,
  INTERACTIVE_MAX_BUTTONS,
  INTERACTIVE_MAX_LIST_BUTTON_TEXT,
  INTERACTIVE_MAX_LIST_ROW_DESCRIPTION,
  INTERACTIVE_MAX_LIST_ROW_TITLE,
  INTERACTIVE_MAX_LIST_ROWS,
  type InteractiveComposeDraft,
} from "@/lib/conversations/interactive-compose";
import { cn } from "@/lib/utils";

type InteractiveComposeBubbleProps = {
  draft: InteractiveComposeDraft;
  disabled?: boolean;
  showValidation?: boolean;
  onChange: (draft: InteractiveComposeDraft) => void;
};

const accent = "text-[#027eb5]";
const divider = "border-[#00000014]";

const BUTTON_BODY_PLACEHOLDER = "Ej. ¿Cómo prefieres recibir tu pedido?";
const LIST_BODY_PLACEHOLDER = "Ej. Elige el horario de entrega que más te acomode:";
const BUTTON_TITLE_PLACEHOLDERS = ["Ej. Despacho", "Ej. Retiro en tienda", "Ej. Hablar con asesor"];
const LIST_ROW_TITLE_PLACEHOLDERS = ["Ej. Mañana", "Ej. Tarde", "Ej. Noche", "Ej. Coordinar después"];

function fieldClassName(...extra: Array<string | false | undefined>) {
  return cn(
    "w-full bg-transparent outline-none placeholder:text-[#027eb5]/35 focus:bg-white/50 rounded-sm",
    extra
  );
}

function invalidFieldClass(invalid: boolean) {
  return invalid ? "ring-1 ring-red-400/80 bg-red-50/40" : undefined;
}

export function InteractiveComposeBubble({
  draft,
  disabled,
  showValidation = false,
  onChange,
}: InteractiveComposeBubbleProps) {
  const isButtons = draft.variant === "button";
  const invalidFields = showValidation ? getInteractiveComposeInvalidFields(draft) : null;

  function updateButtons(nextButtons: InteractiveComposeDraft["buttons"]) {
    onChange({ ...draft, buttons: nextButtons });
  }

  function updateRows(nextRows: InteractiveComposeDraft["rows"]) {
    onChange({ ...draft, rows: nextRows });
  }

  return (
    <div
        className={cn(
        "inline-block w-fit max-w-[min(100%,17.5rem)] min-w-[11rem] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-2.5 text-sm text-[#111b21] ring-1 ring-[#b8e8b0]/80",
        !isButtons && "min-w-[13rem]"
      )}
    >
      <textarea
        value={draft.body}
        disabled={disabled}
        maxLength={INTERACTIVE_MAX_BODY}
        rows={isButtons ? 2 : 3}
        onChange={(event) => onChange({ ...draft, body: event.target.value })}
        placeholder={isButtons ? BUTTON_BODY_PLACEHOLDER : LIST_BODY_PLACEHOLDER}
        aria-invalid={invalidFields?.body || undefined}
        className={fieldClassName(
          "block min-h-[2.5rem] w-full resize-none leading-relaxed text-[#111b21] placeholder:text-[#667781]/70 [field-sizing:content]",
          invalidFieldClass(Boolean(invalidFields?.body))
        )}
      />

      {isButtons ? (
        <div className={cn("mt-1.5 -mx-0.5 overflow-hidden rounded-md border", divider)}>
          {draft.buttons.map((button, index) => (
            <div
              key={`button-${index}`}
              className={cn("group flex items-center gap-0.5 px-0.5", index > 0 && "border-t", divider)}
            >
              <input
                value={button.title}
                disabled={disabled}
                maxLength={INTERACTIVE_MAX_BUTTON_TITLE}
                onChange={(event) => {
                  const next = [...draft.buttons];
                  next[index] = { title: event.target.value };
                  updateButtons(next);
                }}
                placeholder={BUTTON_TITLE_PLACEHOLDERS[index] ?? `Botón ${index + 1}`}
                aria-invalid={invalidFields?.buttonIndexes.includes(index) || undefined}
                className={fieldClassName(
                  "px-2 py-2 text-center text-sm font-medium",
                  accent,
                  invalidFieldClass(Boolean(invalidFields?.buttonIndexes.includes(index)))
                )}
              />
              <button
                type="button"
                disabled={disabled || draft.buttons.length <= 1}
                onClick={() => updateButtons(draft.buttons.filter((_, i) => i !== index))}
                className="shrink-0 rounded p-1 text-[#8696a0] opacity-60 hover:text-red-600 disabled:hidden"
                aria-label={`Quitar botón ${index + 1}`}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {draft.buttons.length < INTERACTIVE_MAX_BUTTONS && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => updateButtons([...draft.buttons, { title: "" }])}
              className={cn(
                "flex w-full items-center justify-center gap-1 border-t px-2 py-1.5 text-[11px] font-medium",
                divider,
                accent
              )}
            >
              <Plus className="size-3" />
              Añadir botón
            </button>
          )}
        </div>
      ) : (
        <div className={cn("mt-1.5 -mx-0.5 overflow-hidden rounded-md border", divider)}>
          <div className={cn("flex items-center justify-between gap-1 border-b px-1.5 py-0.5", divider)}>
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <List className="size-3.5 shrink-0 text-[#027eb5] opacity-80" />
              <input
                value={draft.buttonText}
                disabled={disabled}
                maxLength={INTERACTIVE_MAX_LIST_BUTTON_TEXT}
                onChange={(event) => onChange({ ...draft, buttonText: event.target.value })}
                placeholder="Ej. Ver opciones"
                aria-invalid={invalidFields?.buttonText || undefined}
                className={fieldClassName(
                  "py-1 text-sm font-medium",
                  accent,
                  invalidFieldClass(Boolean(invalidFields?.buttonText))
                )}
              />
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-[#027eb5] opacity-70" />
          </div>

          <div className="border-b border-[#00000014] bg-black/3 px-1.5 py-0.5">
            <input
              value={draft.sectionTitle}
              disabled={disabled}
              onChange={(event) => onChange({ ...draft, sectionTitle: event.target.value })}
              placeholder="Ej. Horarios (opcional)"
              className={fieldClassName(
                "py-0.5 text-[10px] font-semibold tracking-wide text-[#667781] uppercase placeholder:normal-case placeholder:font-normal"
              )}
            />
          </div>

          {draft.rows.map((row, index) => (
            <div
              key={`row-${index}`}
              className={cn(
                "group flex items-start gap-0.5 px-1.5 py-1",
                index > 0 && "border-t",
                divider
              )}
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <input
                  value={row.title}
                  disabled={disabled}
                  maxLength={INTERACTIVE_MAX_LIST_ROW_TITLE}
                  onChange={(event) => {
                    const next = [...draft.rows];
                    next[index] = { ...next[index], title: event.target.value };
                    updateRows(next);
                  }}
                  placeholder={LIST_ROW_TITLE_PLACEHOLDERS[index] ?? `Opción ${index + 1}`}
                  aria-invalid={invalidFields?.rowIndexes.includes(index) || undefined}
                  className={fieldClassName(
                    "py-0.5 text-sm font-medium",
                    accent,
                    invalidFieldClass(Boolean(invalidFields?.rowIndexes.includes(index)))
                  )}
                />
                <input
                  value={row.description}
                  disabled={disabled}
                  maxLength={INTERACTIVE_MAX_LIST_ROW_DESCRIPTION}
                  onChange={(event) => {
                    const next = [...draft.rows];
                    next[index] = { ...next[index], description: event.target.value };
                    updateRows(next);
                  }}
                  placeholder="Ej. 09:00 – 13:00"
                  className={fieldClassName("py-0.5 text-[11px] text-[#667781]")}
                />
              </div>
              <button
                type="button"
                disabled={disabled || draft.rows.length <= 1}
                onClick={() => updateRows(draft.rows.filter((_, i) => i !== index))}
                className="shrink-0 rounded p-1 text-[#8696a0] opacity-60 hover:text-red-600 disabled:hidden"
                aria-label={`Quitar fila ${index + 1}`}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}

          {draft.rows.length < INTERACTIVE_MAX_LIST_ROWS && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => updateRows([...draft.rows, { title: "", description: "" }])}
              className={cn(
                "flex w-full items-center justify-center gap-1 border-t px-2 py-1.5 text-[11px] font-medium",
                divider,
                accent
              )}
            >
              <Plus className="size-3" />
              Añadir opción
            </button>
          )}
        </div>
      )}
    </div>
  );
}
