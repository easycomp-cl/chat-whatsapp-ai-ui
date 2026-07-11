"use client";

import { useTransition } from "react";
import { AlertCircle, CheckCheck, Clock3, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canResendWhatsappMessage,
  resolveWhatsappDeliveryStatus,
  type WhatsappDeliveryStatus,
} from "@/lib/conversations/delivery-status";
import { resendMessageAction } from "@/lib/actions/app-actions";
import type { Message } from "@/types/database.types";

type MessageDeliveryStatusProps = {
  message: Message;
  conversationId: string;
  isHuman?: boolean;
  onResent?: () => void;
};

function statusLabel(status: WhatsappDeliveryStatus): string {
  switch (status) {
    case "pending":
      return "Enviando a WhatsApp…";
    case "failed":
      return "No entregado";
    case "sent":
      return "Entregado";
  }
}

export function MessageDeliveryStatus({
  message,
  conversationId,
  isHuman = false,
  onResent,
}: MessageDeliveryStatusProps) {
  const [pending, startTransition] = useTransition();
  const status = resolveWhatsappDeliveryStatus(message);
  const showResend = canResendWhatsappMessage(message) && !pending;

  if (!status) {
    return (
      <CheckCheck className={cn("size-3.5", isHuman ? "text-[#53bdeb]" : "text-[#8696a0]")} />
    );
  }

  function handleResend() {
    startTransition(async () => {
      try {
        await resendMessageAction(message.id, conversationId);
        toast.success("Mensaje reenviado por WhatsApp");
        onResent?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo reenviar el mensaje"
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={cn(
          "flex items-center gap-1 text-[10px]",
          status === "failed" && "text-[#ea0038]",
          status === "pending" && "text-[#8696a0]",
          status === "sent" && "text-[#667781]"
        )}
        title={statusLabel(status)}
      >
        {status === "pending" && (
          pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Clock3 className="size-3" />
          )
        )}
        {status === "failed" && <AlertCircle className="size-3.5" />}
        {status === "sent" && (
          <CheckCheck className={cn("size-3.5", isHuman ? "text-[#53bdeb]" : "text-[#8696a0]")} />
        )}
        <span>{statusLabel(status)}</span>
      </div>
      {showResend && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 gap-1 rounded-full border-[#ea0038]/30 px-2 text-[10px] text-[#ea0038] hover:bg-[#ea0038]/5"
          onClick={handleResend}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RotateCcw className="size-3" />
          )}
          Reenviar
        </Button>
      )}
    </div>
  );
}
