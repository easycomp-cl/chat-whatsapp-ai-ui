import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/types/database.types";

export function ModeBadge({ mode }: { mode: Conversation["mode"] }) {
  return (
    <Badge
      variant="outline"
      className={
        mode === "BOT"
          ? "border-[#7678ed]/25 bg-[#7678ed]/10 text-[#7678ed]"
          : "border-[#ff7a55]/25 bg-[#ff7a55]/10 text-[#c44d2a]"
      }
    >
      {mode}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "border-[#7678ed]/25 bg-[#7678ed]/10 text-[#7678ed]",
    PENDING: "border-[#ff7a55]/25 bg-[#ff7a55]/10 text-[#c44d2a]",
    CLOSED: "border-[#202022]/15 bg-[#202022]/5 text-[#202022]/60",
  };
  return (
    <Badge variant="outline" className={colors[status] ?? ""}>
      {status}
    </Badge>
  );
}
