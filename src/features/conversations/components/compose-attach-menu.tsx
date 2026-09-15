"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, FileText, Image, LayoutGrid, LayoutTemplate, List, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  COMPOSE_EXCEL_ACCEPT,
  COMPOSE_IMAGE_ACCEPT,
  COMPOSE_PDF_ACCEPT,
  COMPOSE_WORD_ACCEPT,
  type ComposeAttachCategory,
  validateComposeMediaFile,
} from "@/lib/conversations/message-media";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ComposeAttachMenuProps = {
  disabled?: boolean;
  sessionClosed?: boolean;
  onFileSelected: (file: File) => void;
  onInteractivePreview?: (variant: "button" | "list") => void;
  onWhatsappTemplate?: () => void;
};

type FileAttachOption = {
  kind: "file";
  id: ComposeAttachCategory;
  label: string;
  accept: string;
  icon: typeof Image;
  iconClassName: string;
  circleClassName: string;
};

type PreviewAttachOption = {
  kind: "preview";
  id: "interactive-buttons" | "interactive-list";
  label: string;
  variant: "button" | "list";
  icon: typeof LayoutGrid;
  iconClassName: string;
  circleClassName: string;
};

type AttachOption = FileAttachOption | PreviewAttachOption;

const FILE_ATTACH_OPTIONS: FileAttachOption[] = [
  {
    kind: "file",
    id: "image",
    label: "Imágenes",
    accept: COMPOSE_IMAGE_ACCEPT,
    icon: Image,
    iconClassName: "text-sky-300",
    circleClassName: "bg-[#0b8bd6]",
  },
  {
    kind: "file",
    id: "pdf",
    label: "PDF",
    accept: COMPOSE_PDF_ACCEPT,
    icon: FileText,
    iconClassName: "text-red-300",
    circleClassName: "bg-[#e53935]",
  },
  {
    kind: "file",
    id: "excel",
    label: "Excel",
    accept: COMPOSE_EXCEL_ACCEPT,
    icon: FileSpreadsheet,
    iconClassName: "text-emerald-300",
    circleClassName: "bg-[#1e8e3e]",
  },
  {
    kind: "file",
    id: "word",
    label: "Word",
    accept: COMPOSE_WORD_ACCEPT,
    icon: FileText,
    iconClassName: "text-blue-300",
    circleClassName: "bg-[#2b579a]",
  },
];

const PREVIEW_ATTACH_OPTIONS: PreviewAttachOption[] = [
  {
    kind: "preview",
    id: "interactive-buttons",
    label: "Botones WA",
    variant: "button",
    icon: LayoutGrid,
    iconClassName: "text-cyan-200",
    circleClassName: "bg-[#027eb5]",
  },
  {
    kind: "preview",
    id: "interactive-list",
    label: "Lista WA",
    variant: "list",
    icon: List,
    iconClassName: "text-teal-200",
    circleClassName: "bg-[#00a884]",
  },
];

const TEMPLATE_ATTACH_OPTION = {
  id: "whatsapp-template",
  label: "Plantilla WA",
  icon: LayoutTemplate,
  iconClassName: "text-violet-200",
  circleClassName: "bg-[#7678ed]",
} as const;

function AttachOptionButton({
  option,
  disabled,
  onClick,
}: {
  option: AttachOption;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl p-1 transition-colors hover:bg-white/5 disabled:opacity-50"
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-105",
          option.circleClassName
        )}
      >
        <Icon className={cn("size-6", option.iconClassName)} strokeWidth={2} />
      </span>
      <span className="text-center text-xs font-medium text-[#e9edef]">{option.label}</span>
    </button>
  );
}

export function ComposeAttachMenu({
  disabled,
  sessionClosed,
  onFileSelected,
  onInteractivePreview,
  onWhatsappTemplate,
}: ComposeAttachMenuProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCategoryRef = useRef<ComposeAttachCategory | null>(null);
  const sessionOnlyDisabled = Boolean(disabled || sessionClosed);

  function openPicker(category: ComposeAttachCategory, accept: string) {
    const input = inputRef.current;
    if (!input) return;
    pendingCategoryRef.current = category;
    input.accept = accept;
    input.value = "";
    setOpen(false);
    input.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const category = pendingCategoryRef.current;
    event.target.value = "";
    pendingCategoryRef.current = null;
    if (!file || !category) return;

    const validation = validateComposeMediaFile(file, category);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    onFileSelected(file);
  }

  function handleInteractivePreview(variant: "button" | "list") {
    if (!onInteractivePreview) return;
    setOpen(false);
    onInteractivePreview(variant);
  }

  function handleWhatsappTemplate() {
    if (!onWhatsappTemplate) return;
    setOpen(false);
    onWhatsappTemplate();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={sessionOnlyDisabled}
        onChange={handleFileChange}
      />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <button
              type="button"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d1d7db] bg-white text-[#667781] shadow-sm transition-colors",
                "hover:bg-[#f0f2f5] hover:text-[#111b21] disabled:cursor-not-allowed disabled:opacity-50",
                "data-popup-open:bg-[#e9edef] data-popup-open:text-[#111b21]"
              )}
              aria-label="Adjuntar archivo"
              title="Adjuntar archivo"
            />
          }
        >
          <Plus className="size-5" strokeWidth={2.25} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={10}
          className="min-w-[220px] rounded-2xl border-0 bg-[#1f2c34] p-4 shadow-xl ring-1 ring-white/10"
        >
          <div className="grid grid-cols-2 gap-3">
            {FILE_ATTACH_OPTIONS.map((option) => (
              <AttachOptionButton
                key={option.id}
                option={option}
                disabled={sessionOnlyDisabled}
                onClick={() => openPicker(option.id, option.accept)}
              />
            ))}
          </div>

          {onWhatsappTemplate && (
            <>
              <p className="mt-4 mb-2 text-[10px] font-semibold tracking-wide text-[#8696a0] uppercase">
                Plantilla WhatsApp
              </p>
              <p className="mb-3 text-[10px] leading-snug text-[#667781]">
                {sessionClosed
                  ? "La ventana de 24 h está cerrada. Solo una plantilla aprobada llega al cliente."
                  : "Útil para recontactar o avisar con un texto ya aprobado por Meta."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <AttachOptionButton
                  option={{
                    kind: "preview",
                    id: "interactive-buttons",
                    label: TEMPLATE_ATTACH_OPTION.label,
                    variant: "button",
                    icon: TEMPLATE_ATTACH_OPTION.icon,
                    iconClassName: TEMPLATE_ATTACH_OPTION.iconClassName,
                    circleClassName: TEMPLATE_ATTACH_OPTION.circleClassName,
                  }}
                  disabled={disabled}
                  onClick={handleWhatsappTemplate}
                />
              </div>
            </>
          )}

          {onInteractivePreview && (
            <>
              <p className="mt-4 mb-2 text-[10px] font-semibold tracking-wide text-[#8696a0] uppercase">
                Mensaje interactivo
              </p>
              <p className="mb-3 text-[10px] leading-snug text-[#667781]">
                Edita y envía botones o lista al cliente por WhatsApp.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PREVIEW_ATTACH_OPTIONS.map((option) => (
                  <AttachOptionButton
                    key={option.id}
                    option={option}
                    disabled={sessionOnlyDisabled}
                    onClick={() => handleInteractivePreview(option.variant)}
                  />
                ))}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
