"use client";

import { useState } from "react";
import { Hand, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_GREETING_CONFIG,
  WARMTH_LABELS,
  type GreetingConfig,
  type GreetingWarmth,
  type SuggestedGreeting,
} from "@/lib/bot-api/types";
import { INFORMAL_SLANG_PHRASES } from "@/lib/chat-import/constants";
import { cn } from "@/lib/utils";

const WARMTH_STYLES: Record<GreetingWarmth, string> = {
  formal: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50",
  neutral: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40",
  warm: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40",
};

export function SuggestedGreetingsPanel({
  greetings,
  onChange,
  fillerWords,
  onFillerWordsChange,
  greetingConfig,
  onGreetingConfigChange,
  disabled = false,
}: {
  greetings: SuggestedGreeting[];
  onChange: (greetings: SuggestedGreeting[]) => void;
  fillerWords: string[];
  onFillerWordsChange: (words: string[]) => void;
  greetingConfig: GreetingConfig;
  onGreetingConfigChange: (config: GreetingConfig) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [draftWarmth, setDraftWarmth] = useState<GreetingWarmth>("neutral");

  function addGreeting() {
    const text = draft.trim();
    if (!text) return;
    if (greetings.some((g) => g.text.toLowerCase() === text.toLowerCase())) return;
    onChange([
      ...greetings,
      { text, warmth: draftWarmth, source: "Manual" },
    ]);
    setDraft("");
  }

  function removeGreeting(index: number) {
    onChange(greetings.filter((_, i) => i !== index));
  }

  function removeFiller(word: string) {
    onFillerWordsChange(fillerWords.filter((w) => w !== word));
  }

  function removeInformalFillers() {
    onFillerWordsChange(
      fillerWords.filter((word) => !INFORMAL_SLANG_PHRASES.has(word.toLowerCase()))
    );
  }

  if (disabled && greetings.length === 0 && fillerWords.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Hand className="size-4 text-violet-600" />
              <Label className="text-sm font-semibold">Saludos sugeridos</Label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Detectados en tus chats importados. El bot los usará al saludar o al combinar
              saludo + respuesta.
            </p>
          </div>
          {!disabled && greetings.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {greetings.length} guardados
            </Badge>
          )}
        </div>

        {greetings.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {greetings.map((greeting, index) => (
              <div
                key={`${greeting.text}-${index}`}
                className={cn(
                  "group relative rounded-lg border px-3 py-2.5 text-sm transition-shadow hover:shadow-sm",
                  WARMTH_STYLES[greeting.warmth]
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{greeting.text}</p>
                    <p className="mt-1 truncate text-[11px] opacity-70">
                      {greeting.source}
                      {greeting.usage_count ? ` · ${greeting.usage_count}×` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {WARMTH_LABELS[greeting.warmth]}
                    </Badge>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeGreeting(index)}
                        className="rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label={`Quitar saludo ${greeting.text}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 size-5 opacity-50" />
            Los saludos aparecerán aquí tras analizar chats donde el negocio saluda a clientes.
          </div>
        )}

        {!disabled && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='Ej: Holaaa, Hola! Buen día!'
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGreeting();
                }
              }}
              className="flex-1"
            />
            <div className="flex gap-2">
              {(["formal", "neutral", "warm"] as const).map((warmth) => (
                <Button
                  key={warmth}
                  type="button"
                  size="sm"
                  variant={draftWarmth === warmth ? "default" : "outline"}
                  onClick={() => setDraftWarmth(warmth)}
                  className="flex-1 sm:flex-none"
                >
                  {WARMTH_LABELS[warmth]}
                </Button>
              ))}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={addGreeting}
                disabled={!draft.trim()}
                aria-label="Agregar saludo"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {fillerWords.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-sm font-semibold">Muletillas detectadas</Label>
            {!disabled && (
              <Button type="button" variant="outline" size="sm" onClick={removeInformalFillers}>
                Quitar slang informal
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Expresiones que usas seguido. Quita las que no quieras que el bot repita.
          </p>
          <div className="flex flex-wrap gap-2">
            {fillerWords.map((word) => (
              <Badge key={word} variant="secondary" className="gap-1 pr-1">
                {word}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFiller(word)}
                    className="rounded-full p-0.5 hover:bg-destructive/15 hover:text-destructive"
                    aria-label={`Quitar ${word}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!disabled && (
        <div className="space-y-3 rounded-xl border bg-background/70 p-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-violet-600" />
            <Label className="text-sm font-semibold">Criterio por tipo de cliente</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Clientes nuevos reciben saludos más neutros; clientes con historial pueden recibir
            saludos más cercanos.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Cliente nuevo</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["formal", "neutral", "warm"] as const).map((warmth) => (
                  <Button
                    key={warmth}
                    type="button"
                    size="sm"
                    variant={
                      greetingConfig.new_customer_warmth === warmth ? "default" : "outline"
                    }
                    onClick={() =>
                      onGreetingConfigChange({
                        ...greetingConfig,
                        new_customer_warmth: warmth,
                      })
                    }
                  >
                    {WARMTH_LABELS[warmth]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cliente con historial</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["formal", "neutral", "warm"] as const).map((warmth) => (
                  <Button
                    key={warmth}
                    type="button"
                    size="sm"
                    variant={
                      greetingConfig.returning_customer_warmth === warmth
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      onGreetingConfigChange({
                        ...greetingConfig,
                        returning_customer_warmth: warmth,
                      })
                    }
                  >
                    {WARMTH_LABELS[warmth]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs">Mensajes para considerar cliente habitual</Label>
              <p className="text-[11px] text-muted-foreground">
                Por defecto: {DEFAULT_GREETING_CONFIG.returning_min_messages} mensajes
              </p>
            </div>
            <Input
              type="number"
              min={1}
              max={50}
              value={greetingConfig.returning_min_messages}
              onChange={(e) =>
                onGreetingConfigChange({
                  ...greetingConfig,
                  returning_min_messages: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-full sm:w-24"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-3 py-2.5">
            <div>
              <Label className="text-xs">Combinar saludo con respuestas</Label>
              <p className="text-[11px] text-muted-foreground">
                Ej: &quot;Holaaa, las tablas valen $X&quot; cuando preguntan precio y saludan.
              </p>
            </div>
            <Switch
              checked={greetingConfig.combine_greeting_with_answers}
              onCheckedChange={(checked) =>
                onGreetingConfigChange({
                  ...greetingConfig,
                  combine_greeting_with_answers: checked,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
