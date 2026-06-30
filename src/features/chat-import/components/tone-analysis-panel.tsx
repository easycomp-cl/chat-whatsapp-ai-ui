"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveToneAnalysisAction } from "@/lib/actions/chat-import-actions";
import { EditablePhraseTags } from "./editable-phrase-tags";
import { BotToneSettingsPanel } from "./bot-tone-settings-panel";
import { SuggestedGreetingsPanel } from "./suggested-greetings-panel";
import {
  EMOJI_USAGE_LABELS,
  FORMALITY_LABELS,
  RESPONSE_LENGTH_LABELS,
  TONE_STATUS_LABELS,
} from "@/lib/chat-import/utils";
import {
  deriveAvoidLong,
  deriveGreetingConfig,
  deriveOfferNextStep,
  deriveResponseLength,
  deriveUseEmojis,
} from "@/lib/chat-import/tone-settings";
import type {
  GreetingConfig,
  SuggestedGreeting,
  ToneAnalysis,
} from "@/lib/bot-api/types";

export function ToneAnalysisPanel({
  tone,
  importJobId,
  onApproved,
}: {
  tone: ToneAnalysis;
  importJobId: string;
  onApproved: (updated: ToneAnalysis) => void;
}) {
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

  const isApproved = tone.status === "approved";

  function handleApprove() {
    if (!toneSummary.trim()) {
      toast.error("El resumen de tono no puede estar vacío");
      return;
    }
    startTransition(async () => {
      try {
        const updated = await approveToneAnalysisAction(
          tone.id,
          importJobId,
          {
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
          }
        );
        toast.success(
          "Tono actualizado. El bot usará este estilo en nuevas conversaciones."
        );
        onApproved({
          ...updated,
          common_phrases: commonPhrases,
          suggested_greetings: suggestedGreetings,
          filler_words: fillerWords,
          greeting_config: greetingConfig,
        } as ToneAnalysis);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al aplicar el tono"
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Tono detectado</CardTitle>
          {tone.confidence != null && (
            <p className="mt-1 text-sm text-muted-foreground">
              Confianza: {Math.round(tone.confidence * 100)}%
            </p>
          )}
        </div>
        <Badge variant={isApproved ? "default" : "secondary"}>
          {TONE_STATUS_LABELS[tone.status] ?? tone.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {tone.emoji_usage && (
            <Badge variant="outline">
              Emojis: {EMOJI_USAGE_LABELS[tone.emoji_usage] ?? tone.emoji_usage}
            </Badge>
          )}
          {tone.response_length && (
            <Badge variant="outline">
              Longitud:{" "}
              {RESPONSE_LENGTH_LABELS[tone.response_length] ?? tone.response_length}
            </Badge>
          )}
          {tone.formality_level && (
            <Badge variant="outline">
              Formalidad:{" "}
              {FORMALITY_LABELS[tone.formality_level] ?? tone.formality_level}
            </Badge>
          )}
        </div>

        <SuggestedGreetingsPanel
          greetings={suggestedGreetings}
          onChange={setSuggestedGreetings}
          fillerWords={fillerWords}
          onFillerWordsChange={setFillerWords}
          greetingConfig={greetingConfig}
          onGreetingConfigChange={setGreetingConfig}
          disabled={isApproved}
        />

        <EditablePhraseTags
          phrases={commonPhrases}
          onChange={setCommonPhrases}
          disabled={isApproved}
        />

        <div className="space-y-2">
          <Label htmlFor="tone-summary">Resumen de tono</Label>
          <Textarea
            id="tone-summary"
            value={toneSummary}
            onChange={(e) => setToneSummary(e.target.value)}
            rows={3}
            disabled={isApproved}
          />
        </div>

        {!isApproved && (
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

            <Button onClick={handleApprove} disabled={pending} className="w-full sm:w-auto">
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
      </CardContent>
    </Card>
  );
}
