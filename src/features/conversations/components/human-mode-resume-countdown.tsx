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
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (untilMs == null) return;

    let expired = false;

    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= untilMs && !expired) {
        expired = true;
        onExpireRef.current?.();
      }
    };

    const intervalId = window.setInterval(tick, HUMAN_MODE_COUNTDOWN_INTERVAL_MS);
    const remaining = untilMs - Date.now();
    const timeoutId = window.setTimeout(tick, Math.max(remaining + 50, 0));

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [untilIso, untilMs]);

  if (untilMs == null) return null;

  const label = formatBotResumeCountdown(untilMs - now);
  if (!label) return null;

  return (
    <p className="text-[11px] font-medium text-[#c44d2a]" aria-live="polite">
      {label}
    </p>
  );
}
