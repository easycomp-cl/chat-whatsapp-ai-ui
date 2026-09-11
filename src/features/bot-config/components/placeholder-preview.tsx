"use client";

import { Eye } from "lucide-react";
import { substitutePlaceholders } from "@/lib/bot-personality/utils";
import type { BotPersonality } from "@/lib/bot-api/types";

export function PlaceholderPreview({
  text,
  businessName,
  botName,
  greetingMessage,
  fallbackMessage,
  toneGreetings,
}: {
  text: string;
  businessName: string;
  botName: string;
  greetingMessage?: string;
  fallbackMessage?: string;
  toneGreetings?: BotPersonality["tone_greetings"];
}) {
  if (!text.trim()) return null;

  const preview = substitutePlaceholders(text, {
    businessName,
    botName,
    greetingMessage,
    fallbackMessage,
    toneGreetings,
  });

  return (
    <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Eye className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <span className="font-medium text-foreground/80">Vista previa: </span>
        {preview}
      </p>
    </div>
  );
}
