import type { GreetingConfig, ToneAnalysis } from "@/lib/bot-api/types";
import { DEFAULT_GREETING_CONFIG } from "@/lib/bot-api/types";

type ToneRules = {
  use_emojis?: boolean | string;
  response_length?: string;
  offer_next_step?: boolean;
  avoid_long_explanations?: boolean;
  greeting_config?: GreetingConfig;
};

export function deriveUseEmojis(tone: ToneAnalysis): boolean {
  const rules = tone.recommended_bot_rules as ToneRules;
  if (rules.use_emojis === false || rules.use_emojis === "none") return false;
  if (rules.use_emojis === true || rules.use_emojis === "moderate" || rules.use_emojis === "high") {
    return true;
  }
  return tone.emoji_usage !== "none" && tone.emoji_usage !== "low";
}

export function deriveResponseLength(tone: ToneAnalysis): string {
  const rules = tone.recommended_bot_rules as ToneRules;
  return (
    (typeof rules.response_length === "string" && rules.response_length) ||
    tone.response_length ||
    "medium"
  );
}

export function deriveOfferNextStep(tone: ToneAnalysis): boolean {
  const rules = tone.recommended_bot_rules as ToneRules;
  if (typeof rules.offer_next_step === "boolean") return rules.offer_next_step;
  const sales = (tone.sales_style ?? "").toLowerCase();
  return /agendar|agenda|reserv|cotiz|siguiente|escrib|contact/.test(sales);
}

export function deriveAvoidLong(tone: ToneAnalysis): boolean {
  const rules = tone.recommended_bot_rules as ToneRules;
  if (typeof rules.avoid_long_explanations === "boolean") {
    return rules.avoid_long_explanations;
  }
  return tone.response_length === "short";
}

export function deriveGreetingConfig(tone: ToneAnalysis): GreetingConfig {
  return tone.greeting_config ?? DEFAULT_GREETING_CONFIG;
}
