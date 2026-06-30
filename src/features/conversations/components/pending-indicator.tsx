import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type PendingIndicatorProps = {
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
};

export function PendingIndicator({
  className,
  size = "sm",
  showLabel = false,
}: PendingIndicatorProps) {
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff7a55]/15 text-[#ff7a55]",
        size === "sm" ? "p-1" : "px-2 py-1",
        className
      )}
      title="Mensaje pendiente de revisar"
    >
      <Clock className={iconSize} />
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-wide">Pendiente</span>
      )}
    </span>
  );
}
