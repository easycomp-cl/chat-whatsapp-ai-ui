"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { setCustomerFrequentAction } from "@/lib/actions/customer-profile-actions";
import {
  isCustomerFrequent,
  setCustomerFrequentLocally,
} from "@/lib/customers/frequent-customer";
import { cn } from "@/lib/utils";

type CustomerFrequentToggleProps = {
  businessId: string;
  conversationId: string;
  customerId: string;
  canEdit: boolean;
  initialFrequent?: boolean;
  profileMetadata?: Record<string, unknown> | null;
};

function FrequentPill({
  frequent,
  label,
  className,
  onClick,
  disabled,
}: {
  frequent: boolean;
  label: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-medium wrap-break-word whitespace-normal shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all",
        frequent
          ? "border-[#e8dfd4] bg-[#faf7f2] text-[#4a4035]"
          : "border-[#eaeaec] bg-[#f5f5f7] text-[#6b6b70]",
        onClick &&
          !disabled &&
          (frequent
            ? "hover:border-[#ddd2c4] hover:bg-[#f5efe6]"
            : "hover:border-[#e0e0e4] hover:bg-[#efeff1]"),
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <Star
        className={cn(
          "size-4 shrink-0",
          frequent ? "fill-amber-500 text-amber-500" : "text-[#a3a3a8]"
        )}
      />
      <span className="min-w-0 text-center text-pretty">{label}</span>
    </Component>
  );
}

export function CustomerFrequentToggle({
  businessId,
  conversationId,
  customerId,
  canEdit,
  initialFrequent = false,
  profileMetadata,
}: CustomerFrequentToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [frequent, setFrequent] = useState(
    initialFrequent ||
      profileMetadata?.manual_returning === true ||
      false
  );

  useEffect(() => {
    setFrequent(
      isCustomerFrequent({ id: customerId, profile_metadata: profileMetadata }, businessId)
    );
  }, [businessId, customerId, profileMetadata]);

  function handleToggle() {
    const next = !frequent;
    startTransition(async () => {
      try {
        const result = await setCustomerFrequentAction(conversationId, customerId, next);
        setCustomerFrequentLocally(businessId, customerId, next);
        setFrequent(next);
        toast.success(
          next ? "Cliente guardado como frecuente" : "Cliente quitado de frecuentes"
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo actualizar el cliente"
        );
      }
    });
  }

  if (!canEdit) {
    if (!frequent) return null;
    return <FrequentPill frequent label="Cliente frecuente" />;
  }

  return (
    <FrequentPill
      frequent={frequent}
      disabled={pending}
      onClick={handleToggle}
      label={
        pending
          ? "Guardando…"
          : frequent
            ? "Quitar de clientes frecuentes"
            : "Guardar como cliente frecuente"
      }
    />
  );
}
