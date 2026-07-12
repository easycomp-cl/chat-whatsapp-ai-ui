"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

function getShortDisplayName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.length > 9 ? `${first.slice(0, 8)}…` : first;
}

const CONVERSATION_MODE_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "BOT", label: "Modo BOT" },
  { value: "HUMAN", label: "Modo HUMAN" },
  { value: "handoff", label: "Derivadas" },
] as const;

function ConversationModeSelectField({
  value,
  onValueChange,
  selectId,
  className,
  elevated = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  selectId?: string;
  className?: string;
  elevated?: boolean;
}) {
  const selectedLabel =
    CONVERSATION_MODE_OPTIONS.find((option) => option.value === value)?.label ??
    "Todas";

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={selectId} className="text-sm font-medium text-[#202022]">
        Modo de conversación
      </Label>
      <Select value={value} onValueChange={(v) => onValueChange(v ?? "all")}>
        <SelectTrigger
          id={selectId}
          className="h-10 w-full rounded-xl border-[#202022]/10 bg-white text-sm text-[#202022] shadow-none focus-visible:border-[#7678ed]/40 focus-visible:ring-[#7678ed]/15"
        >
          <SelectValue placeholder="Todas">{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          side={elevated ? "top" : "bottom"}
          positionerClassName={elevated ? "z-[70]" : undefined}
          className="z-[70] rounded-xl border border-[#202022]/8 bg-white p-1.5 shadow-[0_8px_24px_rgba(32,32,34,0.12)] ring-0"
        >
          {CONVERSATION_MODE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-lg py-2.5 pr-9 pl-3 text-sm text-[#202022] focus:bg-[#f3f4f6] data-highlighted:bg-[#f3f4f6] data-selected:bg-[#f3f4f6] [&_svg]:text-[#202022]"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConversationListFilters({
  query,
  mode,
  unreadOnly,
  modeSelectId,
  unreadSwitchId,
  onQueryChange,
  onModeChange,
  onUnreadChange,
  className,
}: {
  query: string;
  mode: string;
  unreadOnly: boolean;
  modeSelectId: string;
  unreadSwitchId: string;
  onQueryChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onUnreadChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#202022]/35" />
        <Input
          placeholder="Buscar conversación..."
          className="rounded-full border-[#202022]/10 bg-[#f9fafc] pl-9 text-[#202022] placeholder:text-[#202022]/35 focus-visible:border-[#7678ed]/40 focus-visible:ring-[#7678ed]/15"
          defaultValue={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ConversationModeSelectField
          selectId={modeSelectId}
          value={mode}
          onValueChange={onModeChange}
          className="min-w-[140px] flex-1"
        />
        <div className="flex items-center gap-2 pb-2.5">
          <Switch
            id={unreadSwitchId}
            checked={unreadOnly}
            onCheckedChange={onUnreadChange}
          />
          <Label htmlFor={unreadSwitchId} className="text-xs text-[#202022]/60">
            Humanas
          </Label>
        </div>
      </div>
    </div>
  );
}

type FilterDraft = {
  query: string;
  mode: string;
  unreadOnly: boolean;
};

function MobileConversationFiltersPopover({
  open,
  onOpenChange,
  anchorRef,
  draft,
  onDraftChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  draft: FilterDraft;
  onDraftChange: (draft: FilterDraft) => void;
  onApply: () => void;
}) {
  const mounted = useMounted();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth - rect.right - 16, 288);
      const left = Math.min(
        rect.right + 8,
        Math.max(8, window.innerWidth - panelWidth - 8)
      );
      const maxTop = window.innerHeight - 320;
      const top = Math.min(Math.max(8, rect.top), Math.max(8, maxTop));

      setPosition({ top, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar filtros"
        className="fixed inset-0 z-[60] bg-black/10"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-labelledby="mobile-filters-title"
        className="fixed z-[61] w-[min(calc(100vw-5.5rem),18rem)] rounded-2xl border border-[#202022]/8 bg-white p-4 shadow-[0_8px_40px_rgba(32,32,34,0.12)]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="mobile-filters-title"
            className="text-base leading-tight font-semibold text-[#202022]"
          >
            Filtrar conversaciones
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#202022]/50 transition-colors hover:bg-[#f9fafc] hover:text-[#202022]"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#202022]/35" />
            <Input
              placeholder="Buscar conversación..."
              value={draft.query}
              onChange={(e) =>
                onDraftChange({ ...draft, query: e.target.value })
              }
              className="h-10 rounded-xl border-[#202022]/10 bg-[#f9fafc] pl-9 text-[#202022] placeholder:text-[#202022]/35 focus-visible:border-[#7678ed]/40 focus-visible:ring-[#7678ed]/15"
            />
          </div>

          <ConversationModeSelectField
            selectId="conversation-mode-mobile"
            value={draft.mode}
            elevated
            onValueChange={(value) =>
              onDraftChange({ ...draft, mode: value })
            }
          />

          <div className="flex items-center justify-end gap-2 px-1">
            <Switch
              id="unread-only-mobile"
              checked={draft.unreadOnly}
              onCheckedChange={(checked) =>
                onDraftChange({ ...draft, unreadOnly: checked })
              }
            />
            <Label
              htmlFor="unread-only-mobile"
              className="text-sm text-[#202022]/70"
            >
              Humanas
            </Label>
          </div>

          <Button
            type="button"
            onClick={onApply}
            className="h-10 w-full rounded-xl bg-[#7678ed] text-white hover:bg-[#7678ed]/90"
          >
            <Search className="size-4" />
            Aplicar
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}

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
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>({
    query: "",
    mode: "all",
    unreadOnly: false,
  });
  const { hasPending } = usePendingMessages();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "all";
  const unreadOnly = searchParams.get("unread") === "1";
  const query = searchParams.get("q") ?? "";

  const activeId = pathname.split("/").pop();
  const hasActiveFilters = mode !== "all" || unreadOnly || Boolean(query);

  function replaceSearchParams(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    const base =
      activeId && activeId !== "conversations"
        ? `/app/conversations/${activeId}`
        : "/app/conversations";
    router.replace(`${base}?${params.toString()}`, { scroll: false });
  }

  function setModeFilter(value: string) {
    replaceSearchParams((params) => {
      if (value === "all") params.delete("mode");
      else params.set("mode", value);
    });
  }

  function setUnreadFilter(checked: boolean) {
    replaceSearchParams((params) => {
      if (checked) params.set("unread", "1");
      else params.delete("unread");
    });
  }

  function setQueryFilter(value: string) {
    replaceSearchParams((params) => {
      if (value) params.set("q", value);
      else params.delete("q");
    });
  }

  function openFilters() {
    setDraftFilters({ query, mode, unreadOnly });
    setFiltersOpen(true);
  }

  function applyFilters() {
    replaceSearchParams((params) => {
      if (draftFilters.query) params.set("q", draftFilters.query);
      else params.delete("q");

      if (draftFilters.mode === "all") params.delete("mode");
      else params.set("mode", draftFilters.mode);

      if (draftFilters.unreadOnly) params.set("unread", "1");
      else params.delete("unread");
    });
    setFiltersOpen(false);
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
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-[#202022]/8 bg-white transition-[width] duration-200",
        "w-[80px] md:w-full md:max-w-[360px]"
      )}
    >
      <div className="flex shrink-0 justify-center border-b border-[#202022]/8 py-3 md:hidden">
        <button
          ref={filterBtnRef}
          type="button"
          onClick={openFilters}
          aria-label="Filtrar conversaciones"
          aria-expanded={filtersOpen}
          className={cn(
            "relative flex size-10 items-center justify-center rounded-xl transition-colors",
            hasActiveFilters
              ? "bg-[#7678ed]/20 text-[#7678ed]"
              : "bg-[#7678ed]/12 text-[#7678ed] hover:bg-[#7678ed]/18"
          )}
        >
          <Filter className="size-5" />
          {hasActiveFilters && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#7678ed] ring-2 ring-white" />
          )}
        </button>
      </div>

      <MobileConversationFiltersPopover
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        anchorRef={filterBtnRef}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
      />

      <div className="hidden border-b border-[#202022]/8 p-4 md:block">
        <ConversationListFilters
          query={query}
          mode={mode}
          unreadOnly={unreadOnly}
          modeSelectId="conversation-mode-desktop"
          unreadSwitchId="unread-only"
          onQueryChange={setQueryFilter}
          onModeChange={setModeFilter}
          onUnreadChange={setUnreadFilter}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p
            className={cn(
              "p-6 text-center text-sm text-[#202022]/45",
              "max-md:px-1 max-md:py-4 max-md:text-[10px]"
            )}
          >
            <span className="md:hidden">—</span>
            <span className="hidden md:inline">
              {conversations.length === 0
                ? "No hay conversaciones"
                : "No hay conversaciones con estos filtros"}
            </span>
          </p>
        ) : (
          filtered.map((c) => {
            const isActive = activeId === c.id;
            const displayName =
              c.customers?.name ?? c.customers?.phone_number ?? "Sin nombre";
            const shortName = getShortDisplayName(displayName);
            const preview =
              c.last_message_preview ??
              (c.handoff_reason ? `Derivación: ${c.handoff_reason}` : "Sin mensajes");
            const isPending = mounted && !isActive && hasPending(c.id);

            return (
              <Link
                key={c.id}
                href={`/app/conversations/${c.id}?${searchParams.toString()}`}
                title={displayName}
                className={cn(
                  "shrink-0 border-b border-[#202022]/5 transition-all hover:bg-[#f9fafc]",
                  "flex flex-col items-center gap-1 px-1.5 py-3 md:flex-row md:items-start md:gap-3 md:px-4 md:py-3.5",
                  isActive &&
                    "bg-[#00a884]/14 hover:bg-[#00a884]/18 md:border-l-[3px] md:border-l-[#00a884]",
                  isPending && !isActive && "bg-[#ff7a55]/5"
                )}
              >
                <div
                  className={cn(
                    "relative",
                    isActive &&
                      "max-md:rounded-full max-md:ring-2 max-md:ring-[#00a884] max-md:ring-offset-2"
                  )}
                >
                  <ConversationAvatar
                    name={c.customers?.name}
                    phone={c.customers?.phone_number}
                    seed={c.customer_id}
                    size="xs"
                    className="md:size-11 md:text-sm"
                    channelClassName="max-md:hidden"
                  />
                  {isPending && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ff7a55] ring-2 ring-white">
                      <span className="size-2 rounded-full bg-white" />
                    </span>
                  )}
                  {c.handoff_reason && (
                    <span className="absolute -top-0.5 -left-0.5 size-2.5 rounded-full bg-[#ff7a55] ring-2 ring-white md:hidden" />
                  )}
                </div>

                <div className="flex w-full flex-col items-center gap-0.5 text-center md:hidden">
                  <p
                    className={cn(
                      "w-full truncate text-[10px] leading-tight font-semibold text-[#202022]",
                      isPending && "text-[#111b21]"
                    )}
                  >
                    {shortName}
                  </p>
                  <span className="text-[9px] text-[#202022]/45">
                    {formatChatTime(c.last_message_at)}
                  </span>
                </div>

                <div className="hidden min-w-0 flex-1 md:block">
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
