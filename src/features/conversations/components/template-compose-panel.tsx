"use client";

import {
  Calendar,
  Clock,
  Link2,
  Package,
  Sparkles,
  Store,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { WhatsappTemplateParameterField } from "@/lib/bot-api/types";
import {
  parameterFieldsFor,
  templateButtonLabel,
  templateFooter,
  templatePackDefinition,
  templateResolvedBody,
} from "@/features/whatsapp-templates/utils";
import { resolveTemplateButtonUrl } from "@/features/whatsapp-templates/template-cta";
import { WhatsappTemplateBubble } from "@/features/whatsapp-templates/components/whatsapp-template-bubble";
import {
  classifyTemplateField,
  effectiveTemplateFieldLabel,
  resolveTemplateFieldPrefill,
  shortTemplateFieldLabel,
  type TemplateComposeContext,
  type TemplateComposeDraft,
  type TemplateFieldKind,
} from "@/features/conversations/lib/template-compose";

type TemplateComposePanelProps = {
  draft: TemplateComposeDraft;
  context?: TemplateComposeContext;
  disabled?: boolean;
  showValidation?: boolean;
  activeSlot?: { component: "body" | "button"; index: number } | null;
  onActiveSlotChange?: (slot: { component: "body" | "button"; index: number } | null) => void;
  onChange: (draft: TemplateComposeDraft) => void;
};

const FIELD_ICONS: Record<TemplateFieldKind, LucideIcon> = {
  customer: User,
  business: Store,
  agent: User,
  order: Package,
  orderStatus: Package,
  product: Tag,
  productDetail: Tag,
  date: Calendar,
  time: Clock,
  payment: Link2,
  button: Link2,
  other: Sparkles,
};

function VariableFieldRow({
  field,
  label,
  value,
  missing,
  disabled,
  invalid,
  accent,
  onFocus,
  onBlur,
  onChange,
}: {
  field: WhatsappTemplateParameterField;
  label: string;
  value: string;
  missing: string | null;
  disabled?: boolean;
  invalid?: boolean;
  accent: "violet" | "teal";
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const kind = classifyTemplateField(field, label);
  const Icon = FIELD_ICONS[kind];
  const shortLabel = shortTemplateFieldLabel(label);
  const badgeClass =
    accent === "teal" ? "bg-teal-600 text-white" : "bg-[#0d9488] text-white";

  return (
    <div className="min-w-0">
      <label
        className={cn(
          "flex items-center gap-1.5 rounded-lg border bg-white/80 px-1.5 py-1",
          accent === "teal" ? "border-teal-200/80" : "border-[#0d9488]/20",
          invalid && "border-red-300 bg-red-50/70"
        )}
      >
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            badgeClass
          )}
        >
          {field.index}
        </span>
        <Icon className="size-3 shrink-0 text-[#667781]" aria-hidden />
        <span className="w-[4.75rem] shrink-0 truncate text-[11px] font-medium text-[#54656f]">
          {shortLabel}
        </span>
        <Input
          value={value}
          disabled={disabled}
          placeholder={field.example ?? shortLabel}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          aria-label={`${field.index} ${label}`}
          className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1.5 text-[13px] shadow-none focus-visible:ring-0"
        />
      </label>
      {!value.trim() && missing ? (
        <p className="mt-0.5 pl-7 text-[10px] leading-tight text-[#8696a0]">{missing}</p>
      ) : null}
    </div>
  );
}

export function TemplateComposePanel({
  draft,
  context = {},
  disabled,
  showValidation = false,
  activeSlot,
  onActiveSlotChange,
  onChange,
}: TemplateComposePanelProps) {
  const bodyFields = parameterFieldsFor(draft.template, "body");
  const buttonFields = parameterFieldsFor(draft.template, "button");
  const highlightIndex =
    activeSlot?.component === "body" ? activeSlot.index : null;

  function updateBody(index: number, value: string) {
    const next = [...draft.bodyValues];
    next[index] = value;
    onChange({ ...draft, bodyValues: next });
  }

  function updateButton(index: number, value: string) {
    const next = [...draft.buttonValues];
    next[index] = value;
    onChange({ ...draft, buttonValues: next });
  }

  return (
    <div className="@container flex w-full min-w-0 flex-col gap-2">
      {(bodyFields.length > 0 || buttonFields.length > 0) && (
        <div className="grid grid-cols-1 gap-1.5 @min-[26rem]:grid-cols-2">
          {bodyFields.map((field, index) => {
            const label = effectiveTemplateFieldLabel(draft.template, field);
            const missing = resolveTemplateFieldPrefill(draft.template, field, context).missing;
            return (
              <VariableFieldRow
                key={`body-${field.index}`}
                field={field}
                label={label}
                value={draft.bodyValues[index] ?? ""}
                missing={missing}
                disabled={disabled}
                invalid={showValidation && !draft.bodyValues[index]?.trim()}
                accent="violet"
                onFocus={() => onActiveSlotChange?.({ component: "body", index: field.index })}
                onBlur={() => onActiveSlotChange?.(null)}
                onChange={(value) => updateBody(index, value)}
              />
            );
          })}
          {buttonFields.map((field, index) => {
            const label = effectiveTemplateFieldLabel(draft.template, field);
            const missing = resolveTemplateFieldPrefill(draft.template, field, context).missing;
            return (
              <VariableFieldRow
                key={`button-${field.index}`}
                field={field}
                label={label}
                value={draft.buttonValues[index] ?? ""}
                missing={missing}
                disabled={disabled}
                invalid={showValidation && !draft.buttonValues[index]?.trim()}
                accent="teal"
                onFocus={() => onActiveSlotChange?.({ component: "button", index: field.index })}
                onBlur={() => onActiveSlotChange?.(null)}
                onChange={(value) => updateButton(index, value)}
              />
            );
          })}
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border border-black/5"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage:
            "radial-gradient(circle at 18px 12px, rgba(0,0,0,0.035) 1.2px, transparent 1.4px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="bg-[#075e54] px-3 py-1 text-[11px] font-medium text-white/90">
          Vista previa en el chat
        </div>
        <WhatsappTemplateBubble
          body={templateResolvedBody(draft.template)}
          values={draft.bodyValues}
          highlightIndex={highlightIndex}
          compose
          footer={templateFooter(draft.template)}
          buttonLabel={templateButtonLabel(draft.template)}
          buttonHint={templatePackDefinition(draft.template.name)?.buttonHint}
          buttonUrl={resolveTemplateButtonUrl(
            templatePackDefinition(draft.template.name),
            draft.buttonValues.find((value) => value.trim()) ??
              templatePackDefinition(draft.template.name)?.buttonParameter?.example ??
              null
          )}
          compact
          className="p-2"
        />
      </div>
    </div>
  );
}
