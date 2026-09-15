"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listWhatsappTemplatesAction,
  sendConversationTemplateAction,
} from "@/lib/actions/app-actions";
import type { WhatsappTemplate } from "@/lib/bot-api/types";
import type { Message } from "@/types/database.types";
import {
  fillTemplatePreview,
  isApprovedTemplate,
  isCustomerChatTemplate,
  parameterFieldsFor,
  templateBodyPreview,
  templateDisplayTitle,
} from "@/features/whatsapp-templates/utils";
import type { OutboundSenderContext } from "@/lib/conversations/outbound-sender";

type SendWhatsappTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  businessId: string;
  replyToMessageId?: string | null;
  outboundSender?: OutboundSenderContext;
  onSent?: (payload: {
    optimistic?: Message;
    serverMessage?: Record<string, unknown> | null;
    failed?: boolean;
    error?: string;
    optimisticId?: string;
  }) => void;
};

function valuesFromFields(
  template: WhatsappTemplate,
  component: "body" | "button"
): string[] {
  return parameterFieldsFor(template, component).map((field) => "");
}

export function SendWhatsappTemplateDialog({
  open,
  onOpenChange,
  conversationId,
  businessId,
  replyToMessageId,
  outboundSender,
  onSent,
}: SendWhatsappTemplateDialogProps) {
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [bodyValues, setBodyValues] = useState<string[]>([]);
  const [buttonValues, setButtonValues] = useState<string[]>([]);

  const approved = useMemo(
    () => templates.filter((row) => isApprovedTemplate(row) && isCustomerChatTemplate(row)),
    [templates]
  );
  const selected = approved.find((row) => row.name === selectedName) ?? approved[0] ?? null;
  const bodyFields = selected ? parameterFieldsFor(selected, "body") : [];
  const buttonFields = selected ? parameterFieldsFor(selected, "button") : [];
  const preview = selected
    ? fillTemplatePreview(templateBodyPreview(selected), bodyValues)
    : "";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void listWhatsappTemplatesAction("APPROVED").then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setLoadError(result.error);
        setTemplates([]);
        return;
      }
      const next = result.templates.filter(
        (row) => isApprovedTemplate(row) && isCustomerChatTemplate(row)
      );
      setTemplates(result.templates);
      const first = next[0];
      setSelectedName(first?.name ?? "");
      setBodyValues(first ? valuesFromFields(first, "body") : []);
      setButtonValues(first ? valuesFromFields(first, "button") : []);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleSelect(name: string) {
    const next = approved.find((row) => row.name === name);
    setSelectedName(name);
    setBodyValues(next ? valuesFromFields(next, "body") : []);
    setButtonValues(next ? valuesFromFields(next, "button") : []);
  }

  function handleSend() {
    if (!selected) return;
    if (bodyFields.some((field, index) => !bodyValues[index]?.trim())) {
      toast.error("Completa todas las variables de la plantilla.");
      return;
    }
    if (buttonFields.some((field, index) => !buttonValues[index]?.trim())) {
      toast.error("Completa el sufijo del botón de la plantilla.");
      return;
    }

    const rendered = fillTemplatePreview(templateBodyPreview(selected), bodyValues);
    const optimistic: Message = {
      id: `optimistic-template-${Date.now()}`,
      conversation_id: conversationId,
      business_id: businessId,
      direction: "OUTBOUND",
      sender_type: "HUMAN",
      content_text: rendered,
      content_type: "TEMPLATE",
      ai_generated: false,
      created_at: new Date().toISOString(),
      whatsapp_delivery_status: "pending",
      reply_to_message_id: replyToMessageId ?? null,
      reactions: [],
      sender_user_id: outboundSender?.userId ?? null,
      sender_display_name: outboundSender?.displayName ?? null,
    };

    onSent?.({ optimistic });
    onOpenChange(false);

    startTransition(async () => {
      const result = await sendConversationTemplateAction(conversationId, {
        template_name: selected.name,
        language_code: selected.language || "es",
        body_parameters: bodyValues.map((value) => value.trim()),
        ...(buttonValues.some((value) => value.trim())
          ? { button_parameters: buttonValues.map((value) => value.trim()) }
          : {}),
        ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
      });
      if (!result.ok) {
        toast.error(result.error);
        onSent?.({ failed: true, optimisticId: optimistic.id, error: result.error });
        return;
      }
      toast.success("Plantilla enviada por WhatsApp");
      onSent?.({ serverMessage: result.message });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Plantilla de WhatsApp</DialogTitle>
          <DialogDescription>
            Solo se pueden enviar plantillas aprobadas por Meta. Completa las variables antes de
            mandarlas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando plantillas aprobadas…
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay plantillas aprobadas para este chat. Revísalas en{" "}
            <Link href="/app/templates" className="font-medium text-[#7678ed] underline">
              Mis plantillas
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-template">Plantilla</Label>
              <select
                id="wa-template"
                value={selected?.name ?? ""}
                onChange={(event) => handleSelect(event.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {approved.map((row) => (
                  <option key={row.name} value={row.name}>
                    {templateDisplayTitle(row)}
                  </option>
                ))}
              </select>
            </div>

            {bodyFields.map((field, index) => (
              <div key={`body-${field.index}`} className="space-y-1.5">
                <Label htmlFor={`wa-body-${field.index}`}>{field.label}</Label>
                <Input
                  id={`wa-body-${field.index}`}
                  value={bodyValues[index] ?? ""}
                  placeholder={field.example ?? ""}
                  onChange={(event) => {
                    const next = [...bodyValues];
                    next[index] = event.target.value;
                    setBodyValues(next);
                  }}
                />
              </div>
            ))}

            {buttonFields.map((field, index) => (
              <div key={`button-${field.index}`} className="space-y-1.5">
                <Label htmlFor={`wa-button-${field.index}`}>{field.label}</Label>
                <Input
                  id={`wa-button-${field.index}`}
                  value={buttonValues[index] ?? ""}
                  placeholder={field.example ?? ""}
                  onChange={(event) => {
                    const next = [...buttonValues];
                    next[index] = event.target.value;
                    setButtonValues(next);
                  }}
                />
              </div>
            ))}

            {preview ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Vista previa</p>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm whitespace-pre-wrap">
                  {preview}
                </p>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={pending || loading || !selected}
            className="bg-[#7678ed] text-white hover:bg-[#7678ed]/90"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enviar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
