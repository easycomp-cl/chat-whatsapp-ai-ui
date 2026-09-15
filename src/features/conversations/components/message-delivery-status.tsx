"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock3,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canResendWhatsappMessage,
  getWhatsappDeliveryStatusLabel,
  PENDING_GRACE_MS,
  resolveWhatsappDeliveryStatus,
  type WhatsappDeliveryStatus,
} from "@/lib/conversations/delivery-status";
import { resendMessageAction } from "@/lib/actions/app-actions";
import { userFacingActionError } from "@/lib/actions/action-result";
import type { Message } from "@/types/database.types";

type MessageDeliveryStatusProps = {
  message: Message;
  conversationId: string;
  onResent?: () => void;
  onRetryLocal?: (message: Message) => void;
};

const TICK_MUTED = "text-[#8696a0]";
const TICK_READ = "text-[#53bdeb]";

function DeliveryTicks({ status }: { status: WhatsappDeliveryStatus }) {
  if (status === "sent") {
    return <Check className={cn("size-3.5", TICK_MUTED)} />;
  }

  if (status === "delivered") {
    return <CheckCheck className={cn("size-3.5", TICK_MUTED)} />;
  }

  if (status === "read") {
    return <CheckCheck className={cn("size-3.5", TICK_READ)} />;
  }

  return null;
}

export function MessageDeliveryStatus({
  message,
  conversationId,
  onResent,
  onRetryLocal,
}: MessageDeliveryStatusProps) {
  const [pending, startTransition] = useTransition();
  const [, setTick] = useState(0);
  const status = resolveWhatsappDeliveryStatus(message);
  const showResend = canResendWhatsappMessage(message) && !pending;

  useEffect(() => {
    if (status !== "pending") return;
    const ageMs = Date.now() - new Date(message.created_at).getTime();
    const waitMs = Math.max(50, PENDING_GRACE_MS - ageMs + 50);
    const timeout = window.setTimeout(() => setTick((tick) => tick + 1), waitMs);
    return () => window.clearTimeout(timeout);
  }, [message.created_at, message.id, status]);

  if (!status) {
    return null;
  }

  function handleResend() {
    if (onRetryLocal) {
      onRetryLocal(message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await resendMessageAction(message.id, conversationId);
        if (result && typeof result === "object" && "ok" in result && !result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Mensaje reenviado por WhatsApp");
        onResent?.();
      } catch (error) {
        toast.error(userFacingActionError(error, "No se pudo reenviar el mensaje"));
      }
    });
  }

  const label = getWhatsappDeliveryStatusLabel(status, message);
  const showTicks = status === "sent" || status === "delivered" || status === "read";
  const showLabel = status === "pending" || status === "failed";

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={cn(
          "flex items-center gap-0.5 text-[10px]",
          status === "failed" && "text-[#ea0038]",
          status === "pending" && "text-[#8696a0]",
          showTicks && "text-[#667781]"
        )}
        title={label}
        aria-label={label}
      >
        {status === "pending" &&
          (pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Clock3 className="size-3" />
          ))}
        {status === "failed" && <AlertCircle className="size-3.5" />}
        {showTicks && <DeliveryTicks status={status} />}
        {showLabel && <span>{label}</span>}
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
