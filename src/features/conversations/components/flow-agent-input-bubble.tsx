"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitFlowAgentInputAction } from "@/lib/actions/flow-actions";
import {
  buildAgentInputPreviewValues,
  renderFlowTemplate,
} from "@/lib/flows/utils";
import type { PendingAgentInput } from "@/lib/bot-api/types";

type FlowAgentInputBubbleProps = {
  runId: string;
  pendingAgentInput: PendingAgentInput;
  onSubmitted?: () => void;
};

export function FlowAgentInputBubble({
  runId,
  pendingAgentInput,
  onSubmitted,
}: FlowAgentInputBubbleProps) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of pendingAgentInput.fields) {
      const prefilled = pendingAgentInput.prefilled?.[field.key];
      const current = field.value ?? prefilled;
      if (current !== undefined && current !== null) {
        initial[field.key] = String(current);
      }
    }
    return initial;
  });

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const field of pendingAgentInput.fields) {
      const prefilled = pendingAgentInput.prefilled?.[field.key];
      const current = field.value ?? prefilled;
      if (current !== undefined && current !== null) {
        initial[field.key] = String(current);
      }
    }
    setValues(initial);
  }, [pendingAgentInput]);

  const previewValues = useMemo(() => {
    const merged = buildAgentInputPreviewValues(
      pendingAgentInput.fields.map((f) => ({
        key: f.key,
        value: values[f.key] ?? f.value,
      })),
      pendingAgentInput.prefilled
    );
    return merged;
  }, [pendingAgentInput, values]);

  const preview = renderFlowTemplate(pendingAgentInput.template, previewValues);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const field of pendingAgentInput.fields) {
      const raw = values[field.key];
      if (raw === undefined || raw === "") {
        if (field.required) {
          toast.error(`Completa el campo "${field.label}"`);
          return;
        }
        continue;
      }
      payload[field.key] =
        field.type === "number" ? Number(raw) : field.type === "boolean" ? raw === "true" : raw;
    }

    startTransition(async () => {
      try {
        await submitFlowAgentInputAction(runId, { values: payload });
        toast.success("Mensaje enviado al cliente");
        onSubmitted?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al enviar");
      }
    });
  }

  return (
    <div className="border-t border-[#7678ed]/25 bg-gradient-to-b from-[#7678ed]/6 to-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#202022]">
        <Bot className="size-4 text-[#7678ed]" />
        Flujo: completar y enviar al cliente
      </div>

      <div className="mb-4 rounded-xl border border-[#d1d7db] bg-[#f0f2f5] p-3">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#667781]">
          Vista previa del mensaje
        </p>
        <p className="whitespace-pre-wrap text-sm text-[#111b21]">{preview}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {pendingAgentInput.fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-[#667781]">
              {field.label}
              {field.required && " *"}
            </Label>
            <Input
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              required={field.required}
              className="border-[#d1d7db] bg-white"
            />
          </div>
        ))}
        <Button type="submit" disabled={pending} className="w-full bg-[#7678ed] hover:bg-[#7678ed]/90">
          <Send className="size-4" />
          {pending ? "Enviando..." : "Enviar al cliente"}
        </Button>
      </form>
    </div>
  );
}
