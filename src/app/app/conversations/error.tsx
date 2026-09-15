"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ConversationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("conversations-error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-[#202022]">
        No se pudo cargar la conversación.
      </p>
      <p className="max-w-md text-xs text-[#202022]/55">
        Intenta de nuevo. Si el problema continúa, recarga la página.
      </p>
      <Button type="button" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
