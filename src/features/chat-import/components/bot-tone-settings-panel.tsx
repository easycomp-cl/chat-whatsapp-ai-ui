"use client";

import type { ComponentType } from "react";
import { Smile, MessageSquareText, ArrowRight, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RESPONSE_LENGTH_LABELS } from "@/lib/chat-import/utils";
import { cn } from "@/lib/utils";

type BotToneSettingsPanelProps = {
  useEmojis: boolean;
  onUseEmojisChange: (value: boolean) => void;
  offerNextStep: boolean;
  onOfferNextStepChange: (value: boolean) => void;
  responseLength: string;
  onResponseLengthChange: (value: string) => void;
  detectedEmojiUsage?: string | null;
  detectedResponseLength?: string | null;
  detectedSalesStyle?: string | null;
  disabled?: boolean;
};

function SettingCard({
  icon: Icon,
  title,
  description,
  detected,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  detected?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="size-4 shrink-0 text-violet-600 dark:text-violet-400" />
            <Label className="text-sm font-semibold">{title}</Label>
            {detected && (
              <Badge variant="secondary" className="text-[11px] font-normal">
                Detectado: {detected}
              </Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 items-center sm:pt-0.5">{children}</div>
      </div>
    </div>
  );
}

export function BotToneSettingsPanel({
  useEmojis,
  onUseEmojisChange,
  offerNextStep,
  onOfferNextStepChange,
  responseLength,
  onResponseLengthChange,
  detectedEmojiUsage,
  detectedResponseLength,
  detectedSalesStyle,
  disabled = false,
}: BotToneSettingsPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
          Ajustes del bot
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Preconfigurados según tu análisis. Puedes ajustarlos antes de aplicar.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-1">
        <SettingCard
          icon={Smile}
          title="Usar emojis"
          description="Si está activo, el bot puede incluir emojis como en tus chats."
          detected={
            detectedEmojiUsage
              ? { none: "Sin emojis", low: "Pocos", moderate: "Moderado", high: "Muchos" }[
                  detectedEmojiUsage
                ] ?? detectedEmojiUsage
              : null
          }
        >
          <Switch
            checked={useEmojis}
            onCheckedChange={onUseEmojisChange}
            disabled={disabled}
            aria-label="Usar emojis"
          />
        </SettingCard>

        <SettingCard
          icon={ArrowRight}
          title="Ofrecer siguiente paso"
          description="Cierra con una acción útil: agendar, ver precios, escribir de nuevo, etc."
          detected={detectedSalesStyle || null}
        >
          <Switch
            checked={offerNextStep}
            onCheckedChange={onOfferNextStepChange}
            disabled={disabled}
            aria-label="Ofrecer siguiente paso"
          />
        </SettingCard>

        <div className="rounded-xl border bg-background/80 p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Ruler className="size-4 text-violet-600 dark:text-violet-400" />
              <Label className="text-sm font-semibold">Longitud de respuesta</Label>
              {detectedResponseLength && (
                <Badge variant="secondary" className="text-[11px] font-normal">
                  Detectado:{" "}
                  {RESPONSE_LENGTH_LABELS[detectedResponseLength] ?? detectedResponseLength}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Breve = directo; Medio = balanceado; Largo = más detalle cuando haga falta.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["short", "medium", "long"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={responseLength === value ? "default" : "outline"}
                  className={cn("w-full", responseLength === value && "shadow-sm")}
                  onClick={() => onResponseLengthChange(value)}
                  disabled={disabled}
                >
                  {RESPONSE_LENGTH_LABELS[value]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MessageSquareText className="mt-0.5 size-3.5 shrink-0" />
            <p>
              Si el cliente saluda y pregunta algo en el mismo mensaje, el bot combinará un
              saludo natural con la respuesta de catálogo o FAQ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
