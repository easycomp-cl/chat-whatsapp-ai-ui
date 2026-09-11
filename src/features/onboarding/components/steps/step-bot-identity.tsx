"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { OnboardingDraft } from "../../types";
import { BOT_TONE_OPTIONS } from "../../types";
import { BotPreviewCard } from "../bot-preview-card";
import { generateOnboardingGreeting } from "../../greeting-generator";
import { resolveUseNamedAgent } from "../../utils";

type StepBotIdentityProps = {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
};

export function StepBotIdentity({ draft, onChange }: StepBotIdentityProps) {
  const [pending, startTransition] = useTransition();

  const bot = draft.bot_identity ?? {
    use_named_agent: false,
    bot_name: "",
    bot_tone: "profesional y cercano",
    greeting_message: "",
  };

  const useNamedAgent = resolveUseNamedAgent(draft);
  const agentName = bot.bot_name?.trim() ?? "";
  const needsAgentNameForGreeting = useNamedAgent && !agentName;

  function updateBot(patch: Partial<typeof bot>) {
    onChange({ bot_identity: { ...bot, ...patch } });
  }

  function handleToggleNamedAgent(checked: boolean) {
    if (!checked) {
      const nextDraft: OnboardingDraft = {
        ...draft,
        bot_identity: {
          ...bot,
          use_named_agent: false,
          bot_name: "",
        },
      };
      updateBot({
        use_named_agent: false,
        bot_name: "",
        greeting_message: generateOnboardingGreeting(nextDraft, {
          includeBotName: false,
        }),
      });
      return;
    }
    updateBot({ use_named_agent: true });
  }

  function handleGenerateGreeting() {
    if (needsAgentNameForGreeting) {
      toast.message("Agrega el nombre del agente", {
        description: "Es necesario para generar un saludo con identidad propia.",
      });
      return;
    }

    startTransition(() => {
      const generated = generateOnboardingGreeting(draft);
      updateBot({ greeting_message: generated });
      toast.success("Saludo generado", {
        description: "Puedes editarlo antes de continuar.",
      });
    });
  }

  const greetingPlaceholder = generateOnboardingGreeting(
    useNamedAgent
      ? draft
      : {
          ...draft,
          bot_identity: { ...bot, use_named_agent: false, bot_name: "" },
        },
    { includeBotName: useNamedAgent }
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-3">
        <div className="space-y-1">
          <Label htmlFor="use-named-agent" className="text-sm">
            Asistente con nombre propio
          </Label>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {useNamedAgent
              ? "Tu negocio responde con un agente con identidad propia, como una mascota virtual de IA."
              : "Las respuestas usarán el tono de tu negocio, sin presentar un bot con nombre."}
          </p>
        </div>
        <Switch
          id="use-named-agent"
          checked={useNamedAgent}
          onCheckedChange={handleToggleNamedAgent}
          className="shrink-0"
        />
      </div>

      {useNamedAgent && (
        <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <Label htmlFor="bot-name">
            Nombre del agente <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bot-name"
            value={bot.bot_name ?? ""}
            onChange={(e) => updateBot({ bot_name: e.target.value })}
            placeholder="Woody"
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Obligatorio para el asistente con nombre propio y para generar el saludo con IA.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Tono de comunicación</Label>
        <div className="flex flex-wrap gap-1.5">
          {BOT_TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => updateBot({ bot_tone: tone })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-all duration-200",
                bot.bot_tone === tone
                  ? "border-[#7678ed] bg-[#7678ed]/10 text-[#7678ed]"
                  : "border-border hover:border-[#7678ed]/40"
              )}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="greeting-message">Mensaje de saludo</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#7678ed]/30 text-[#7678ed] hover:bg-[#7678ed]/5"
            onClick={handleGenerateGreeting}
            disabled={pending || needsAgentNameForGreeting}
            title={
              needsAgentNameForGreeting
                ? "Agrega el nombre del agente para generar el saludo"
                : undefined
            }
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Generar con IA
          </Button>
        </div>
        <Textarea
          id="greeting-message"
          value={bot.greeting_message ?? ""}
          onChange={(e) => updateBot({ greeting_message: e.target.value })}
          placeholder={greetingPlaceholder}
          rows={2}
          required
        />
      </div>

      <BotPreviewCard draft={draft} />
    </div>
  );
}
