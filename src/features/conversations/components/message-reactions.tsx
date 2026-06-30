import { cn } from "@/lib/utils";
import type { MessageReaction } from "@/types/database.types";

type MessageReactionsProps = {
  reactions: MessageReaction[];
  inbound: boolean;
};

function aggregateReactions(reactions: MessageReaction[]) {
  const customerReactions = reactions.filter((r) => r.sender_type === "CUSTOMER");
  const map = new Map<string, number>();

  for (const r of customerReactions) {
    if (!r.emoji) continue;
    map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
  }

  return [...map.entries()].map(([emoji, count]) => ({ emoji, count }));
}

export function MessageReactions({ reactions, inbound }: MessageReactionsProps) {
  const aggregated = aggregateReactions(reactions);
  if (aggregated.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute z-10 flex flex-wrap gap-0.5",
        inbound
          ? "right-3 bottom-1 translate-y-1/2"
          : "bottom-1 left-3 translate-y-1/2"
      )}
    >
      {aggregated.map(({ emoji, count }) => (
        <span
          key={emoji}
          className="inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-px text-[13px] leading-none shadow-[0_1px_3px_rgba(11,20,26,0.16)] ring-1 ring-[#d1d7db]/80"
          title="Reacción del cliente"
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px] font-medium text-[#667781]">{count}</span>}
        </span>
      ))}
    </div>
  );
}

export function hasCustomerReactions(reactions: MessageReaction[]) {
  return reactions.some((r) => r.sender_type === "CUSTOMER" && r.emoji);
}
