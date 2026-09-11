"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enableBotOnAllHumanConversationsAction } from "@/lib/actions/app-actions";

export function EnableBotOnAllHumanButton({
  humanCount,
  className,
  size = "default",
}: {
  humanCount: number;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (humanCount === 0) return null;

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await enableBotOnAllHumanConversationsAction();
        if (result.updated === 0) {
          toast.message("No hay conversaciones en modo humano");
          return;
        }
        toast.success(
          result.updated === 1
            ? "Bot activado en 1 conversación"
            : `Bot activado en ${result.updated} conversaciones`
        );
        router.refresh();
      } catch {
        toast.error("No se pudo activar el bot en las conversaciones");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Bot className="size-4" />
      )}
      Activar bot ({humanCount})
    </Button>
  );
}
