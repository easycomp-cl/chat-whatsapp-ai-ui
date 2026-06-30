"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveConsolidatedToneAction } from "@/lib/actions/chat-import-actions";
import { EditablePhraseTags } from "./editable-phrase-tags";
import { BotToneSettingsPanel } from "./bot-tone-settings-panel";
import { SuggestedGreetingsPanel } from "./suggested-greetings-panel";
import {
  EMOJI_USAGE_LABELS,
  FORMALITY_LABELS,
  RESPONSE_LENGTH_LABELS,
} from "@/lib/chat-import/utils";
import {
  deriveAvoidLong,
  deriveGreetingConfig,
  deriveOfferNextStep,
  deriveResponseLength,
  deriveUseEmojis,
} from "@/lib/chat-import/tone-settings";
import { fixMojibake } from "@/lib/text-encoding";
import type {
  ConsolidatedToneAnalysis,
  GreetingConfig,
  SuggestedGreeting,
} from "@/lib/bot-api/types";

function ToneMetrics({ tone }: { tone: ConsolidatedToneAnalysis }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tone.emoji_usage && (
        <Badge variant="outline" className="bg-background/80">
          Emojis: {EMOJI_USAGE_LABELS[tone.emoji_usage] ?? tone.emoji_usage}
        </Badge>
      )}
      {tone.response_length && (
        <Badge variant="outline" className="bg-background/80">
          Longitud:{" "}
          {RESPONSE_LENGTH_LABELS[tone.response_length] ?? tone.response_length}
        </Badge>
      )}
      {tone.formality_level && (
        <Badge variant="outline" className="bg-background/80">
          Formalidad:{" "}
          {FORMALITY_LABELS[tone.formality_level] ?? tone.formality_level}
        </Badge>
      )}
      {tone.confidence != null && (
        <Badge variant="outline" className="bg-background/80">
          Confianza: {Math.round(tone.confidence * 100)}%
        </Badge>
      )}
    </div>
  );
}

function ConsolidatedToneForm({
  tone: initialTone,
}: {
  tone: ConsolidatedToneAnalysis;
}) {
  const [tone, setTone] = useState(initialTone);
  const [pending, startTransition] = useTransition();
  const [toneSummary, setToneSummary] = useState(tone.tone_summary);
  const [commonPhrases, setCommonPhrases] = useState(tone.common_phrases);
  const [suggestedGreetings, setSuggestedGreetings] = useState<SuggestedGreeting[]>(
    tone.suggested_greetings ?? []
  );
  const [fillerWords, setFillerWords] = useState<string[]>(tone.filler_words ?? []);
  const [greetingConfig, setGreetingConfig] = useState<GreetingConfig>(
    deriveGreetingConfig(tone)
  );
  const [useEmojis, setUseEmojis] = useState(deriveUseEmojis(tone));
  const [responseLength, setResponseLength] = useState(deriveResponseLength(tone));
  const [offerNextStep, setOfferNextStep] = useState(deriveOfferNextStep(tone));
  const [avoidLong, setAvoidLong] = useState(deriveAvoidLong(tone));
  const approved = tone.status === "approved";

  function handleApprove() {
    if (!toneSummary.trim()) {
      toast.error("El resumen de tono no puede estar vacío");
      return;
    }
    startTransition(async () => {
      try {
        await approveConsolidatedToneAction({
          tone_summary: toneSummary.trim(),
          common_phrases: commonPhrases,
          rules: {
            use_emojis: useEmojis ? "moderate" : "none",
            response_length: responseLength,
            style: tone.formality_level ?? "semi_formal",
            offer_next_step: offerNextStep,
            avoid_long_explanations: avoidLong,
            suggested_greetings: suggestedGreetings,
            filler_words: fillerWords,
            greeting_config: greetingConfig,
          },
        });
        toast.success(
          "Tono consolidado aplicado al bot desde todos los chats analizados."
        );
        setTone({
          ...tone,
          status: "approved",
          tone_summary: toneSummary,
          common_phrases: commonPhrases,
          suggested_greetings: suggestedGreetings,
          filler_words: fillerWords,
          greeting_config: greetingConfig,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al aplicar tono"
        );
      }
    });
  }

  return (
    <CardContent className="space-y-6 p-0">
      <ToneMetrics tone={tone} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start xl:gap-8">
        <div className="space-y-6">
          <SuggestedGreetingsPanel
            greetings={suggestedGreetings}
            onChange={setSuggestedGreetings}
            fillerWords={fillerWords}
            onFillerWordsChange={setFillerWords}
            greetingConfig={greetingConfig}
            onGreetingConfigChange={setGreetingConfig}
            disabled={approved}
          />

          <div className="h-px bg-border/60 xl:hidden" />

          <EditablePhraseTags
            phrases={commonPhrases}
            onChange={setCommonPhrases}
            disabled={approved}
          />

          <div className="space-y-2">
            <Label htmlFor="consolidated-tone">Resumen de tono</Label>
            <Textarea
              id="consolidated-tone"
              value={toneSummary}
              onChange={(e) => setToneSummary(e.target.value)}
              rows={3}
              disabled={approved}
              className="min-h-[88px] resize-y bg-background/80"
            />
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-4">
          {!approved && (
            <>
              <BotToneSettingsPanel
                useEmojis={useEmojis}
                onUseEmojisChange={setUseEmojis}
                offerNextStep={offerNextStep}
                onOfferNextStepChange={setOfferNextStep}
                responseLength={responseLength}
                onResponseLengthChange={setResponseLength}
                detectedEmojiUsage={tone.emoji_usage}
                detectedResponseLength={tone.response_length}
                detectedSalesStyle={tone.sales_style}
              />

              <Button
                onClick={handleApprove}
                disabled={pending}
                size="lg"
                className="w-full font-semibold shadow-md"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Aplicando…
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Aplicar tono al bot
                  </>
                )}
              </Button>
            </>
          )}

          {approved && (
            <Badge className="w-fit" variant="default">
              Aplicado al bot
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  );
}

export function ConsolidatedTonePanel({
  tone,
}: {
  tone: ConsolidatedToneAnalysis | null;
}) {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      {!tone ? (
        <CardContent className="p-0">
          <div className="flex flex-col items-center rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center sm:px-6">
            <Sparkles className="mb-3 size-8 text-violet-400" aria-hidden />
            <p className="font-medium">Aún no hay tono detectado</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Cuando analices un chat, aquí verás el estilo detectado para revisarlo y
              aplicarlo al bot.
            </p>
          </div>
        </CardContent>
      ) : (
        <>
          {tone.is_consolidated && tone.source_import_jobs.length > 0 && (
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Fusionado desde {tone.source_import_jobs.length} chat
              {tone.source_import_jobs.length > 1 ? "s" : ""}:{" "}
              <span className="font-medium text-foreground/80">
                {tone.source_import_jobs
                  .map((j) => fixMojibake(j.filename ?? j.id.slice(0, 8)))
                  .join(", ")}
              </span>
            </p>
          )}
          <ConsolidatedToneForm tone={tone} />
        </>
      )}
    </Card>
  );
}
