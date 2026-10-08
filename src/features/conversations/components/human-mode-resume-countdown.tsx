"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatBotResumeCountdown,
  HUMAN_MODE_COUNTDOWN_INTERVAL_MS,
  parseHumanModeUntilMs,
} from "@/lib/conversations/human-mode-until";

type HumanModeResumeCountdownProps = {
  untilIso: string;
  onExpire?: () => void;
};

export function HumanModeResumeCountdown({
  untilIso,
  onExpire,
}: HumanModeResumeCountdownProps) {
  const untilMs = parseHumanModeUntilMs(untilIso);
  const [now, setNow] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (untilMs == null) return;

    expiredRef.current = false;

    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= untilMs && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, HUMAN_MODE_COUNTDOWN_INTERVAL_MS);
    const remaining = untilMs - Date.now();
    const timeoutId =
      remaining > 0 ? window.setTimeout(tick, remaining + 50) : undefined;

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [untilIso, untilMs]);

  if (untilMs == null || now == null) return null;

  const label = formatBotResumeCountdown(untilMs - now);
  if (!label) return null;

  return (
    <p className="text-[11px] font-medium text-[#c44d2a]" aria-live="polite">
      {label}
    </p>
  );
}
