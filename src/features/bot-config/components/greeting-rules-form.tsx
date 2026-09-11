"use client";

import { SuggestedGreetingsPanel } from "@/features/chat-import/components/suggested-greetings-panel";
import {
  DEFAULT_GREETING_CONFIG,
  type BotPersonality,
  type GreetingConfig,
  type SuggestedGreeting,
} from "@/lib/bot-api/types";

export function GreetingRulesForm({
  toneGreetings,
  greetingConfig,
  onToneGreetingsChange,
  onGreetingConfigChange,
  disabled,
}: {
  toneGreetings: SuggestedGreeting[];
  greetingConfig: GreetingConfig;
  onToneGreetingsChange: (greetings: SuggestedGreeting[]) => void;
  onGreetingConfigChange: (config: GreetingConfig) => void;
  disabled?: boolean;
}) {
  return (
    <SuggestedGreetingsPanel
      greetings={toneGreetings}
      onChange={onToneGreetingsChange}
      fillerWords={[]}
      onFillerWordsChange={() => {}}
      greetingConfig={greetingConfig ?? DEFAULT_GREETING_CONFIG}
      onGreetingConfigChange={onGreetingConfigChange}
      disabled={disabled}
    />
  );
}

export type GreetingRulesValues = Pick<BotPersonality, "tone_greetings" | "greeting_config">;
