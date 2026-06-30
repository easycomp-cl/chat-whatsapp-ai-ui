"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeConversationMode } from "@/lib/actions/app-actions";
import type { Conversation } from "@/types/database.types";

export function ConversationModeActions({
  conversation,
}: {
  conversation: Conversation;
}) {
  const [pending, startTransition] = useTransition();
  const nextMode = conversation.mode === "BOT" ? "HUMAN" : "BOT";

  function handleChange() {
    startTransition(async () => {
      try {
        await changeConversationMode(conversation.id, nextMode);
        toast.success(`Conversación en modo ${nextMode}`);
      } catch {
        toast.error("No se pudo cambiar el modo");
      }
    });
  }

  return (
    <Button onClick={handleChange} disabled={pending} variant="outline">
      Cambiar a {nextMode}
    </Button>
  );
}
