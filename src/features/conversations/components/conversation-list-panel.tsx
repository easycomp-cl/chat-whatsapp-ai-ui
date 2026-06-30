"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConversationAvatar } from "@/features/conversations/components/conversation-avatar";
import { formatChatTime } from "@/lib/conversations/utils";
import type { ConversationRow } from "@/lib/conversations/load-conversations";
import { PendingIndicator } from "@/features/conversations/components/pending-indicator";
import { usePendingMessages } from "@/features/conversations/context/pending-messages-context";
import { useLiveConversationsList } from "@/features/conversations/hooks/use-live-conversations-list";
import { useMounted } from "@/hooks/use-mounted";

export function ConversationListPanel({
  conversations: initialConversations,
  businessId,
  agentId,
}: {
  conversations: ConversationRow[];
  businessId: string;
  agentId?: string | null;
}) {
  const conversations = useLiveConversationsList(businessId, initialConversations, agentId);
  const mounted = useMounted();
  const { hasPending } = usePendingMessages();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "all";
  const unreadOnly = searchParams.get("unread") === "1";
  const query = searchParams.get("q") ?? "";

  const activeId = pathname.split("/").pop();

  function setModeFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("mode");
    else params.set("mode", value);
    const base =
      activeId && activeId !== "conversations"
        ? `/app/conversations/${activeId}`
        : "/app/conversations";
    router.replace(`${base}?${params.toString()}`, { scroll: false });
  }

  function setUnreadFilter(checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) params.set("unread", "1");
    else params.delete("unread");
    const base =
      activeId && activeId !== "conversations"
        ? `/app/conversations/${activeId}`
        : "/app/conversations";
    router.replace(`${base}?${params.toString()}`, { scroll: false });
  }

  const filtered = conversations.filter((c) => {
    if (mode === "BOT" || mode === "HUMAN") {
      if (c.mode !== mode) return false;
    }
    if (mode === "handoff" && !c.handoff_reason) return false;
    if (unreadOnly && c.mode !== "HUMAN") return false;
    if (query) {
      const q = query.toLowerCase();
      const name = c.customers?.name?.toLowerCase() ?? "";
      const phone = c.customers?.phone_number ?? "";
      if (!name.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  return (
    <aside className="flex w-full max-w-[360px] shrink-0 flex-col border-r border-[#202022]/8 bg-white">
      <div className="border-b border-[#202022]/8 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#202022]/35" />
          <Input
            placeholder="Buscar conversación..."
            className="rounded-full border-[#202022]/10 bg-[#f9fafc] pl-9 text-[#202022] placeholder:text-[#202022]/35 focus-visible:border-[#7678ed]/40 focus-visible:ring-[#7678ed]/15"
            defaultValue={query}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              const val = e.target.value;
              if (val) params.set("q", val);
              else params.delete("q");
              const base =
                activeId && activeId !== "conversations"
                  ? `/app/conversations/${activeId}`
                  : "/app/conversations";
              router.replace(`${base}?${params.toString()}`, { scroll: false });
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Select value={mode} onValueChange={(v) => setModeFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-[130px] rounded-full border-[#202022]/10 text-xs">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="BOT">Modo BOT</SelectItem>
              <SelectItem value="HUMAN">Modo HUMAN</SelectItem>
              <SelectItem value="handoff">Derivadas</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="unread-only"
              checked={unreadOnly}
              onCheckedChange={setUnreadFilter}
            />
            <Label htmlFor="unread-only" className="text-xs text-[#202022]/60">
              Humanas
            </Label>
            <Filter className="size-4 text-[#202022]/35" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#202022]/45">
            No hay conversaciones
          </p>
        ) : (
          filtered.map((c) => {
            const isActive = activeId === c.id;
            const displayName =
              c.customers?.name ?? c.customers?.phone_number ?? "Sin nombre";
            const preview =
              c.last_message_preview ??
              (c.handoff_reason ? `Derivación: ${c.handoff_reason}` : "Sin mensajes");
            const isPending = mounted && !isActive && hasPending(c.id);

            return (
              <Link
                key={c.id}
                href={`/app/conversations/${c.id}?${searchParams.toString()}`}
                className={cn(
                  "flex gap-3 border-b border-[#202022]/5 px-4 py-3.5 transition-all hover:bg-[#f9fafc]",
                  isActive && "border-l-[3px] border-l-[#00a884] bg-[#00a884]/14 hover:bg-[#00a884]/18",
                  isPending && !isActive && "bg-[#ff7a55]/5"
                )}
              >
                <div className="relative">
                  <ConversationAvatar
                    name={c.customers?.name}
                    phone={c.customers?.phone_number}
                    seed={c.customer_id}
                  />
                  {isPending && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ff7a55] ring-2 ring-white">
                      <span className="size-2 rounded-full bg-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "truncate font-semibold text-[#202022]",
                        isPending && "text-[#111b21]"
                      )}
                    >
                      {displayName}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isPending && <PendingIndicator />}
                      <span className="text-[11px] text-[#202022]/45">
                        {formatChatTime(c.last_message_at)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[#202022]/50">
                    {preview}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        c.mode === "BOT"
                          ? "bg-[#7678ed]/12 text-[#7678ed]"
                          : "bg-[#ff7a55]/12 text-[#c44d2a]"
                      )}
                    >
                      {c.mode}
                    </span>
                    {c.handoff_reason && (
                      <span className="size-2 rounded-full bg-[#ff7a55]" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
