"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Bot, Hand, MessageSquare, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotIdentityForm } from "@/features/bot-config/components/bot-identity-form";
import { ConversationalResponsesEditor } from "@/features/bot-config/components/conversational-responses-editor";
import { GreetingRulesForm } from "@/features/bot-config/components/greeting-rules-form";
import { HandoffSettings } from "@/features/bot-config/components/handoff-settings";
import { saveBotPersonalityAction } from "@/lib/actions/bot-personality-actions";
import {
  DEFAULT_GREETING_CONFIG,
  type BotPersonality,
  type BotPersonalityPatch,
} from "@/lib/bot-api/types";
import { validateVariantText } from "@/lib/bot-personality/utils";

function validatePersonality(data: BotPersonality): string | null {
  for (const response of data.conversational_responses) {
    for (const variant of response.variants) {
      const error = validateVariantText(variant.text);
      if (error) return error;
    }
  }
  return null;
}

export function BotSettingsPanel({
  initial,
  businessName,
}: {
  initial: BotPersonality | null;
  businessName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<BotPersonality>(
    initial ?? {
      bot_name: "",
      bot_tone: "",
      greeting_message: "",
      fallback_message: "",
      handoff_message: "",
      out_of_hours_message: "",
      greeting_config: DEFAULT_GREETING_CONFIG,
      tone_greetings: [],
      conversational_responses: [],
      handoff_on_low_confidence: false,
      placeholders: ["{nombre}", "{negocio}", "{bot}", "{saludo}"],
      triggers: [],
    }
  );

  const unavailable = !initial;

  function patch(partial: BotPersonalityPatch) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function handleSave(body: BotPersonalityPatch) {
    const validationError = validatePersonality(data);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      const result = await saveBotPersonalityAction(body);
      if (result.ok) {
        setData(result.data);
        toast.success("Configuración del bot guardada");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (unavailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalidad del bot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se pudo cargar la configuración del bot. Verifica que el backend esté
            desplegado con los endpoints <code>bot-personality</code>.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalidad del bot</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ajusta cómo saluda, responde y deriva conversaciones. Los cambios del flujo
          Importar chat se muestran aquí y puedes editarlos manualmente.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="identity">
          <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
            <TabsTrigger value="identity" className="gap-1.5">
              <Bot className="size-3.5" />
              Identidad
            </TabsTrigger>
            <TabsTrigger value="greetings" className="gap-1.5">
              <Hand className="size-3.5" />
              Saludos
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-1.5">
              <MessageSquare className="size-3.5" />
              Respuestas automáticas
            </TabsTrigger>
            <TabsTrigger value="handoff" className="gap-1.5">
              <UserRound className="size-3.5" />
              Derivación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4">
            <BotIdentityForm
              values={data}
              onChange={patch}
              businessName={businessName}
              disabled={pending}
            />
            <Button
              onClick={() =>
                handleSave({
                  bot_name: data.bot_name,
                  bot_tone: data.bot_tone,
                  greeting_message: data.greeting_message,
                  fallback_message: data.fallback_message,
                })
              }
              disabled={pending}
            >
              Guardar identidad
            </Button>
          </TabsContent>

          <TabsContent value="greetings" className="space-y-4">
            <GreetingRulesForm
              toneGreetings={data.tone_greetings}
              greetingConfig={data.greeting_config ?? DEFAULT_GREETING_CONFIG}
              onToneGreetingsChange={(tone_greetings) => patch({ tone_greetings })}
              onGreetingConfigChange={(greeting_config) => patch({ greeting_config })}
              disabled={pending}
            />
            <Button
              onClick={() =>
                handleSave({
                  tone_greetings: data.tone_greetings,
                  greeting_config: data.greeting_config,
                })
              }
              disabled={pending}
            >
              Guardar saludos
            </Button>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            <ConversationalResponsesEditor
              triggers={data.triggers}
              responses={data.conversational_responses}
              onChange={(conversational_responses) => patch({ conversational_responses })}
              businessName={businessName}
              botName={data.bot_name}
              greetingMessage={data.greeting_message}
              fallbackMessage={data.fallback_message}
              toneGreetings={data.tone_greetings}
              placeholders={data.placeholders}
              disabled={pending}
            />
            <Button
              onClick={() =>
                handleSave({
                  conversational_responses: data.conversational_responses,
                })
              }
              disabled={pending}
            >
              Guardar respuestas
            </Button>
          </TabsContent>

          <TabsContent value="handoff" className="space-y-4">
            <HandoffSettings
              values={data}
              onChange={patch}
              businessName={businessName}
              botName={data.bot_name}
              greetingMessage={data.greeting_message}
              toneGreetings={data.tone_greetings}
              disabled={pending}
            />
            <Button
              onClick={() =>
                handleSave({
                  handoff_message: data.handoff_message,
                  out_of_hours_message: data.out_of_hours_message,
                  handoff_on_low_confidence: data.handoff_on_low_confidence,
                })
              }
              disabled={pending}
            >
              Guardar derivación
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
