"use client";

import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PlaceholderPreview } from "@/features/bot-config/components/placeholder-preview";
import {
  DEFAULT_CONVERSATIONAL_DEFAULTS,
  SELECTION_LABELS,
  WARMTH_LABELS,
  type BotPersonality,
  type ConversationalResponse,
  type ConversationalResponseVariant,
  type GreetingWarmth,
  type ResponseSelection,
} from "@/lib/bot-api/types";
import {
  MAX_VARIANTS_PER_TRIGGER,
  MAX_RESPONSE_TEXT_LENGTH,
  validateVariantText,
} from "@/lib/bot-personality/utils";
import { cn } from "@/lib/utils";

function getResponseForTrigger(
  responses: ConversationalResponse[],
  triggerId: string
): ConversationalResponse | undefined {
  return responses.find((r) => r.trigger === triggerId);
}

function upsertResponse(
  responses: ConversationalResponse[],
  triggerId: string,
  patch: Partial<ConversationalResponse>,
  defaultSelection: ResponseSelection
): ConversationalResponse[] {
  const existing = getResponseForTrigger(responses, triggerId);
  if (existing) {
    return responses.map((r) =>
      r.trigger === triggerId ? { ...r, ...patch } : r
    );
  }
  return [
    ...responses,
    {
      trigger: triggerId,
      enabled: true,
      selection: defaultSelection,
      variants: [],
      ...patch,
    },
  ];
}

function TriggerSection({
  trigger,
  response,
  responses,
  onChange,
  businessName,
  botName,
  greetingMessage,
  fallbackMessage,
  toneGreetings,
  placeholders,
  disabled,
}: {
  trigger: BotPersonality["triggers"][number];
  response: ConversationalResponse | undefined;
  responses: ConversationalResponse[];
  onChange: (responses: ConversationalResponse[]) => void;
  businessName: string;
  botName: string;
  greetingMessage: string;
  fallbackMessage: string;
  toneGreetings: BotPersonality["tone_greetings"];
  placeholders: string[];
  disabled?: boolean;
}) {
  const enabled = response?.enabled ?? true;
  const selection = response?.selection ?? trigger.default_selection;
  const variants = response?.variants ?? [];
  const defaultHint = DEFAULT_CONVERSATIONAL_DEFAULTS[trigger.id];

  function update(patch: Partial<ConversationalResponse>) {
    onChange(upsertResponse(responses, trigger.id, patch, trigger.default_selection));
  }

  function addVariant() {
    if (variants.length >= MAX_VARIANTS_PER_TRIGGER) return;
    update({
      variants: [...variants, { text: "", warmth: "neutral" }],
    });
  }

  function updateVariant(index: number, patch: Partial<ConversationalResponseVariant>) {
    const next = variants.map((v, i) => (i === index ? { ...v, ...patch } : v));
    update({ variants: next });
  }

  function removeVariant(index: number) {
    update({ variants: variants.filter((_, i) => i !== index) });
  }

  return (
    <div className="rounded-xl border bg-background/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-semibold">{trigger.label}</Label>
            {!enabled && (
              <Badge variant="secondary" className="text-[10px]">
                Desactivado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{trigger.description}</p>
          {defaultHint && variants.length === 0 && (
            <p className="text-[11px] text-muted-foreground/80">
              Por defecto: <span className="italic">{defaultHint}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Activo</Label>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
            disabled={disabled}
          />
        </div>
      </div>

      {enabled && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Modo de selección</Label>
            <Select
              value={selection}
              onValueChange={(value) =>
                update({ selection: value as ResponseSelection })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SELECTION_LABELS) as ResponseSelection[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SELECTION_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Variantes de respuesta</Label>
              <span className="text-[11px] text-muted-foreground">
                {variants.length}/{MAX_VARIANTS_PER_TRIGGER}
              </span>
            </div>

            {variants.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                Sin variantes personalizadas. El bot usará el texto por defecto.
              </div>
            ) : (
              variants.map((variant, index) => {
                const error = validateVariantText(variant.text);
                return (
                  <div
                    key={`${trigger.id}-${index}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Variante {index + 1}
                      </Label>
                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => removeVariant(index)}
                          aria-label={`Eliminar variante ${index + 1}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={variant.text}
                      onChange={(e) => updateVariant(index, { text: e.target.value })}
                      placeholder="Escribe la respuesta..."
                      rows={2}
                      maxLength={MAX_RESPONSE_TEXT_LENGTH}
                      disabled={disabled}
                      className={cn(error && variant.text.trim() && "border-destructive")}
                    />
                    {selection === "by_warmth" && (
                      <div className="flex flex-wrap gap-1.5">
                        {(["formal", "neutral", "warm"] as GreetingWarmth[]).map((warmth) => (
                          <Button
                            key={warmth}
                            type="button"
                            size="sm"
                            variant={variant.warmth === warmth ? "default" : "outline"}
                            onClick={() => updateVariant(index, { warmth })}
                            disabled={disabled}
                          >
                            {WARMTH_LABELS[warmth]}
                          </Button>
                        ))}
                      </div>
                    )}
                    {selection === "random" && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Peso</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={variant.weight ?? 1}
                          onChange={(e) =>
                            updateVariant(index, {
                              weight: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-20"
                          disabled={disabled}
                        />
                      </div>
                    )}
                    {error && variant.text.trim() && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                    <PlaceholderPreview
                      text={variant.text}
                      businessName={businessName}
                      botName={botName}
                      greetingMessage={greetingMessage}
                      fallbackMessage={fallbackMessage}
                      toneGreetings={toneGreetings}
                    />
                  </div>
                );
              })
            )}

            {!disabled && variants.length < MAX_VARIANTS_PER_TRIGGER && (
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="mr-1.5 size-4" />
                Agregar variante
              </Button>
            )}
          </div>

          {placeholders.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Placeholders disponibles:{" "}
              {placeholders.map((p) => (
                <code key={p} className="mx-0.5 rounded bg-muted px-1">
                  {p}
                </code>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversationalResponsesEditor({
  triggers,
  responses,
  onChange,
  businessName,
  botName,
  greetingMessage,
  fallbackMessage,
  toneGreetings,
  placeholders,
  disabled,
}: {
  triggers: BotPersonality["triggers"];
  responses: ConversationalResponse[];
  onChange: (responses: ConversationalResponse[]) => void;
  businessName: string;
  botName: string;
  greetingMessage: string;
  fallbackMessage: string;
  toneGreetings: BotPersonality["tone_greetings"];
  placeholders: string[];
  disabled?: boolean;
}) {
  if (triggers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay situaciones configurables disponibles desde el backend.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define varias respuestas por situación. El bot rotará o elegirá según el modo
        configurado.
      </p>
      {triggers.map((trigger) => (
        <TriggerSection
          key={trigger.id}
          trigger={trigger}
          response={getResponseForTrigger(responses, trigger.id)}
          responses={responses}
          onChange={onChange}
          businessName={businessName}
          botName={botName}
          greetingMessage={greetingMessage}
          fallbackMessage={fallbackMessage}
          toneGreetings={toneGreetings}
          placeholders={placeholders}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
