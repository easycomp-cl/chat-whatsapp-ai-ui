"use client";

import { Bot, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ConversationModeSwitchProps = {
  mode: "BOT" | "HUMAN";
  disabled?: boolean;
  lockedReason?: string;
  onModeChange: (mode: "BOT" | "HUMAN") => void;
};

export function ConversationModeSwitch({
  mode,
  disabled,
  lockedReason,
  onModeChange,
}: ConversationModeSwitchProps) {
  const isHuman = mode === "HUMAN";
  const title =
    lockedReason ??
    (isHuman ? "Modo humano activo" : "Bot activo");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-[#d1d7db] bg-white px-2.5 py-1.5 shadow-sm",
        disabled && "opacity-60"
      )}
      title={title}
    >
      <Bot
        className={cn(
          "size-4 shrink-0 transition-colors",
          !isHuman ? "text-[#7678ed]" : "text-[#202022]/30"
        )}
        aria-hidden
      />
      <Switch
        checked={isHuman}
        disabled={disabled}
        onCheckedChange={(checked) => onModeChange(checked ? "HUMAN" : "BOT")}
        className="data-unchecked:bg-[#7678ed] data-checked:bg-[#ff7a55]"
        aria-label={isHuman ? "Cambiar a modo bot" : "Cambiar a modo humano"}
      />
      <User
        className={cn(
          "size-4 shrink-0 transition-colors",
          isHuman ? "text-[#ff7a55]" : "text-[#202022]/30"
        )}
        aria-hidden
      />
    </div>
  );
}
