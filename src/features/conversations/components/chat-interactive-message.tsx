"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, List, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppFormattedText } from "@/features/conversations/components/whatsapp-formatted-text";
import {
  matchesInteractiveOption,
  type OutboundInteractiveList,
  type OutboundInteractiveMessage,
} from "@/lib/conversations/interactive-message";

type ChatInteractiveMessageProps = {
  interactive: OutboundInteractiveMessage;
  inbound?: boolean;
  /** Vista previa en el editor del composer (antes de enviar). */
  isComposePreview?: boolean;
  /** Mensaje optimista en el hilo mientras confirma el servidor. */
  isLocalPreview?: boolean;
  /** Respuesta real del cliente a este mensaje interactivo. */
  customerSelection?: string | null;
};

function interactivePillClassName({
  muted = false,
  selected = false,
}: {
  muted?: boolean;
  selected?: boolean;
} = {}) {
  if (selected) {
    return cn(
      "flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 shadow-sm ring-2 ring-[#00a884] bg-[#dff7ed] text-[#00a884]"
    );
  }

  return cn(
    "flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 shadow-sm ring-1 transition-colors",
    muted
      ? "bg-[#f4f5f5] ring-black/6 text-[#8696a0]"
      : "bg-[#eefbf6] ring-[#00a884]/18 text-[#00a884] hover:bg-[#e4f8f0]"
  );
}

function SelectionFooter({
  label,
  selection,
  customerReplied,
}: {
  label: string;
  selection: string;
  customerReplied: boolean;
}) {
  return (
    <p className="mt-2 px-1 text-xs leading-snug text-[#8696a0]">
      {customerReplied ? "Respondió:" : label}{" "}
      <span className="font-medium text-[#667781]">{selection}</span>
    </p>
  );
}

function InteractiveListPanel({
  interactive,
  customerSelection,
}: {
  interactive: OutboundInteractiveList;
  customerSelection?: string | null;
}) {
  const [expanded, setExpanded] = useState(Boolean(customerSelection));
  const [markedOption, setMarkedOption] = useState<string | null>(
    customerSelection ?? null
  );

  useEffect(() => {
    if (!customerSelection) return;
    setMarkedOption(customerSelection);
    setExpanded(true);
  }, [customerSelection]);

  const activeSelection = customerSelection ?? markedOption;
  const accent = "text-[#00a884]";

  return (
    <div className="px-3 pb-2">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className={interactivePillClassName()}
        title="Ver u ocultar opciones de la lista"
      >
        <List className={cn("size-4 shrink-0 opacity-90", accent)} />
        <span className="text-[14px] leading-none font-medium">
          {interactive.buttonText}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-70 transition-transform duration-200",
            accent,
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-1.5">
          {interactive.sections.map((section, sectionIndex) => (
            <div
              key={`${section.title ?? "section"}-${sectionIndex}`}
              className="space-y-1.5"
            >
              {section.title?.trim() && (
                <p className="px-1 text-[10px] font-semibold tracking-wide text-[#667781] uppercase">
                  {section.title}
                </p>
              )}
              {section.rows.map((row) => {
                const isActive = matchesInteractiveOption(
                  activeSelection,
                  row.title
                );

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setMarkedOption(row.title)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left shadow-sm ring-1 transition-colors",
                      isActive
                        ? "bg-[#dff7ed] ring-2 ring-[#00a884]"
                        : "bg-white ring-black/8 hover:bg-[#fafafa]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        isActive
                          ? "border-[#00a884] bg-[#00a884] text-white"
                          : "border-[#00a884]/30 bg-transparent"
                      )}
                    >
                      {isActive && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-[#00a884]" : accent
                        )}
                      >
                        {row.title}
                      </p>
                      {row.description?.trim() && (
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-snug",
                            isActive ? "text-[#667781]" : "text-[#667781]"
                          )}
                        >
                          {row.description}
                        </p>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeSelection && (
        <SelectionFooter
          label="Opción marcada:"
          selection={activeSelection}
          customerReplied={Boolean(customerSelection)}
        />
      )}
    </div>
  );
}

export function ChatInteractiveMessage({
  interactive,
  isComposePreview = false,
  isLocalPreview = false,
  customerSelection,
}: ChatInteractiveMessageProps) {
  const accent = "text-[#00a884]";
  const mutedAccent = "text-[#8696a0]";

  return (
    <div className="min-w-48">
      <div className="px-3 pt-2 pb-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#111b21]">
          <WhatsAppFormattedText text={interactive.body} />
        </p>
      </div>

      {interactive.type === "button" ? (
        <div className="px-3 pb-2">
          <div className="flex flex-col gap-2">
            {interactive.buttons.map((button, index) => {
              const isMuted =
                index === interactive.buttons.length - 1 &&
                /hablar|asesor|alguien/i.test(button.title);
              const isSelected = matchesInteractiveOption(
                customerSelection,
                button.title
              );

              return (
                <div
                  key={button.id}
                  className={interactivePillClassName({
                    muted: isMuted && !isSelected,
                    selected: isSelected,
                  })}
                  title={`Opción enviada al cliente: ${button.title}`}
                >
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0" strokeWidth={3} />
                  ) : (
                    <Reply
                      className={cn(
                        "size-3.5 shrink-0 -scale-x-100",
                        isMuted ? mutedAccent : accent
                      )}
                      strokeWidth={2.25}
                    />
                  )}
                  <span className="text-[14px] leading-none font-medium">
                    {button.title}
                  </span>
                </div>
              );
            })}
          </div>

          {customerSelection && (
            <SelectionFooter
              label="Opción marcada:"
              selection={customerSelection}
              customerReplied
            />
          )}
        </div>
      ) : (
        <InteractiveListPanel
          interactive={interactive}
          customerSelection={customerSelection}
        />
      )}

      {(isComposePreview || isLocalPreview) && (
        <p className="px-3 py-2 text-[10px] text-[#8696a0]">
          {isComposePreview
            ? "Así lo verá el cliente en WhatsApp."
            : "Enviando mensaje interactivo…"}
        </p>
      )}
    </div>
  );
}
