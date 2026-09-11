"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlaceholderPreview } from "@/features/bot-config/components/placeholder-preview";
import type { BotPersonality } from "@/lib/bot-api/types";

type IdentityFields = Pick<
  BotPersonality,
  "bot_name" | "bot_tone" | "greeting_message" | "fallback_message"
>;

export function BotIdentityForm({
  values,
  onChange,
  businessName,
  disabled,
}: {
  values: IdentityFields;
  onChange: (patch: Partial<IdentityFields>) => void;
  businessName: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bot_name">Nombre del bot</Label>
          <Input
            id="bot_name"
            value={values.bot_name}
            onChange={(e) => onChange({ bot_name: e.target.value })}
            placeholder="Ej: Sol"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Se usa en prompts y en el placeholder {"{bot}"}.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bot_tone">Tono</Label>
          <Input
            id="bot_tone"
            value={values.bot_tone}
            onChange={(e) => onChange({ bot_tone: e.target.value })}
            placeholder="Ej: profesional y cercano"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Describe el estilo general de las respuestas.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="greeting_message">Saludo base</Label>
        <Textarea
          id="greeting_message"
          value={values.greeting_message}
          onChange={(e) => onChange({ greeting_message: e.target.value })}
          placeholder="Hola, soy Sol de Panadería Sol."
          rows={2}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Mensaje por defecto si no hay variantes ni saludos sugeridos configurados.
        </p>
        <PlaceholderPreview
          text={values.greeting_message}
          businessName={businessName}
          botName={values.bot_name}
          toneGreetings={[]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fallback_message">Sin información</Label>
        <Textarea
          id="fallback_message"
          value={values.fallback_message}
          onChange={(e) => onChange({ fallback_message: e.target.value })}
          placeholder="No tengo esa información confirmada todavía."
          rows={2}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Cuando no hay contexto y no se deriva a un humano.
        </p>
      </div>
    </div>
  );
}
