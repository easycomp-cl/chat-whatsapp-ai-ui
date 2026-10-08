"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/types/database.types";

type ConversationModeBadgeProps = {
  mode: Conversation["mode"];
  humanModeUntil?: string | null;
};

function parseHumanModeUntil(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

function getMinutesRemaining(until: Date): number {
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 60_000);
}

export function ConversationModeBadge({
  mode,
  humanModeUntil,
}: ConversationModeBadgeProps) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (mode !== "HUMAN") {
      setMinutesLeft(null);
      return;
    }

    const deadline = parseHumanModeUntil(humanModeUntil);
    if (!deadline) {
      setMinutesLeft(null);
      return;
    }

    function updateCounter() {
      const deadline = parseHumanModeUntil(humanModeUntil);
      if (!deadline) {
        setMinutesLeft(null);
        return;
      }

      const remaining = getMinutesRemaining(deadline);
      if (remaining <= 0) {
        setMinutesLeft(0);
        return;
      }

      setMinutesLeft(remaining);
    }

    updateCounter();
    const interval = window.setInterval(updateCounter, 30_000);

    return () => window.clearInterval(interval);
  }, [mode, humanModeUntil]);

  if (mode === "BOT") {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge
          variant="outline"
          className="border-[#0d9488]/30 bg-[#0d9488]/15 text-[#0d9488] font-semibold"
        >
          Modo BOT
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge
        variant="outline"
        className="border-[#ff7a55]/30 bg-[#ff7a55]/15 text-[#c44d2a] font-semibold"
      >
        Modo humano
      </Badge>
      {minutesLeft !== null && minutesLeft > 0 && (
        <span className="text-[10px] text-[#667781] leading-tight">
          Vuelve a BOT en {minutesLeft === 1 ? "menos de 1" : minutesLeft} min
        </span>
      )}
    </div>
  );
}
