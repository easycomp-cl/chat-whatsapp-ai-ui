"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PlaceholderPreview } from "@/features/bot-config/components/placeholder-preview";
import type { BotPersonality } from "@/lib/bot-api/types";

type HandoffFields = Pick<
  BotPersonality,
  | "handoff_message"
  | "out_of_hours_message"
  | "handoff_on_low_confidence"
>;

export function HandoffSettings({
  values,
  onChange,
  businessName,
  botName,
  greetingMessage,
  toneGreetings,
  disabled,
}: {
  values: HandoffFields;
  onChange: (patch: Partial<HandoffFields>) => void;
  businessName: string;
  botName: string;
  greetingMessage: string;
  toneGreetings: BotPersonality["tone_greetings"];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 px-4 py-3">
        <div className="space-y-0.5">
          <Label>Derivar a humano cuando no hay información</Label>
          <p className="text-xs text-muted-foreground">
            Si está desactivado, el bot intentará una respuesta suave antes de derivar.
          </p>
        </div>
        <Switch
          checked={values.handoff_on_low_confidence}
          onCheckedChange={(checked) =>
            onChange({ handoff_on_low_confidence: checked })
          }
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="handoff_message">Mensaje al derivar</Label>
        <Textarea
          id="handoff_message"
          value={values.handoff_message}
          onChange={(e) => onChange({ handoff_message: e.target.value })}
          placeholder="Déjame revisarlo con un asesor y te respondemos en breve."
          rows={2}
          disabled={disabled}
        />
        <PlaceholderPreview
          text={values.handoff_message}
          businessName={businessName}
          botName={botName}
          greetingMessage={greetingMessage}
          toneGreetings={toneGreetings}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="out_of_hours_message">Fuera de horario</Label>
        <Textarea
          id="out_of_hours_message"
          value={values.out_of_hours_message}
          onChange={(e) => onChange({ out_of_hours_message: e.target.value })}
          placeholder="Estamos fuera de horario."
          rows={2}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Se usará cuando la lógica de horarios del negocio esté activa.
        </p>
      </div>
    </div>
  );
}
