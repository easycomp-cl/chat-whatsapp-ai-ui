"use client";

import { Bot, UserRound } from "lucide-react";
import { BOT_MODE_RESUMED_FALLBACK } from "@/lib/conversations/human-mode-until";
import { resolveSystemEvent } from "@/lib/conversations/system-event";
import { formatFullTime } from "@/lib/conversations/utils";
import {
  isGenericActorName,
  peekProfileEventActor,
} from "@/lib/customers/profile-event-actor";
import { humanizeProfileChangeLine } from "@/lib/customers/profile-patch";
import { ChatVehicleCard } from "@/features/conversations/components/chat-vehicle-card";
import type { OutboundSenderContext } from "@/lib/conversations/outbound-sender";
import type { Message } from "@/types/database.types";

function readLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function splitChangeItems(raw: string): string[] {
  return raw
    .split(/\s*,\s*(?=[^,]+:\s)/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Extrae líneas de "se añadió:" / "se modificó:" / "se eliminó:" desde body o content_text. */
function parseChangeGroupsFromText(text: string): {
  added: string[];
  modified: string[];
  removed: string[];
} {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return { added: [], modified: [], removed: [] };

  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  const addedRe = /se\s+a[nñ]adi[oó]:\s*/i;
  const modifiedRe = /se\s+modific[oó]:\s*/i;
  const removedRe = /se\s+elimin[oó]:\s*/i;
  const markers = [
    { key: "added" as const, re: addedRe, idx: normalized.search(addedRe) },
    { key: "modified" as const, re: modifiedRe, idx: normalized.search(modifiedRe) },
    { key: "removed" as const, re: removedRe, idx: normalized.search(removedRe) },
  ]
    .filter((marker) => marker.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  if (markers.length === 0) return { added: [], modified: [], removed: [] };

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const match = normalized.slice(marker.idx).match(marker.re);
    if (!match) continue;
    const start = marker.idx + match[0].length;
    const end = i + 1 < markers.length ? markers[i + 1].idx : normalized.length;
    const items = splitChangeItems(normalized.slice(start, end).replace(/\.\s*$/, ""));
    if (marker.key === "added") added.push(...items);
    else if (marker.key === "modified") modified.push(...items);
    else removed.push(...items);
  }

  return { added, modified, removed };
}

function ChangeBlock({ label, lines }: { label: string; lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="font-semibold">{label}</p>
      {lines.map((line) => (
        <p key={line} className="wrap-break-word">
          {humanizeProfileChangeLine(line)}
        </p>
      ))}
    </div>
  );
}

function readPayloadActorUserId(payload: Record<string, unknown> | undefined): string {
  if (!payload) return "";
  for (const key of ["actor_user_id", "actorUserId", "user_id", "userId", "updated_by_user_id"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function resolveActorDisplayName(
  isHuman: boolean,
  conversationId: string,
  payload: Record<string, unknown> | undefined,
  message: Message,
  outboundSender?: OutboundSenderContext
): string {
  if (!isHuman) return "";

  const fromPayload =
    typeof payload?.actor_name === "string" ? payload.actor_name.trim() : "";
  const fromSender = message.sender_display_name?.trim() ?? "";
  const actorUserId =
    readPayloadActorUserId(payload) || message.sender_user_id?.trim() || "";
  const fromTeam =
    actorUserId && outboundSender?.senderNameByUserId[actorUserId]
      ? outboundSender.senderNameByUserId[actorUserId].trim()
      : "";
  const pending = peekProfileEventActor(conversationId);

  // Tras un guardado reciente priorizamos al asesor logueado (el backend aún manda el tenant).
  if (pending && !isGenericActorName(pending)) return pending;
  for (const candidate of [fromSender, fromTeam, fromPayload]) {
    if (candidate && !isGenericActorName(candidate)) return candidate;
  }
  return "";
}

export function ChatSystemEventBubble({
  message,
  outboundSender,
}: {
  message: Message;
  outboundSender?: OutboundSenderContext;
}) {
  const event = resolveSystemEvent(message);
  if (event?.appearance === "dark_card") {
    return <ChatVehicleCard event={event} />;
  }

  const isHuman = event?.actor === "HUMAN";
  const actorName = resolveActorDisplayName(
    isHuman,
    message.conversation_id,
    event?.payload,
    message,
    outboundSender
  );
  const fromPayloadAdded = readLines(event?.payload?.added);
  const fromPayloadModified = readLines(event?.payload?.modified);
  const fromPayloadRemoved = readLines(event?.payload?.removed);
  const textForGroups =
    event?.body && /se\s+(a[nñ]adi|modific|elimin)/i.test(event.body)
      ? event.body
      : message.content_text ?? event?.body ?? "";
  const fromText = parseChangeGroupsFromText(textForGroups);
  const addedLines = (fromPayloadAdded.length > 0 ? fromPayloadAdded : fromText.added).map(
    humanizeProfileChangeLine
  );
  const modifiedLines = (
    fromPayloadModified.length > 0 ? fromPayloadModified : fromText.modified
  ).map(humanizeProfileChangeLine);
  const removedLines = (fromPayloadRemoved.length > 0 ? fromPayloadRemoved : fromText.removed).map(
    humanizeProfileChangeLine
  );
  const hasGroups = addedLines.length > 0 || modifiedLines.length > 0 || removedLines.length > 0;
  const title = event?.title?.trim() || "";
  const body = event?.body?.trim() || "";
  const plainFallback =
    !hasGroups && event?.kind !== "profile_saved" && event?.kind !== "profile_updated"
      ? [title, body].filter(Boolean).join(" · ")
      : !hasGroups && body && !/se\s+(a[nñ]adi|modific|elimin)/i.test(body)
        ? body
        : !hasGroups && title
          ? title
          : "";
  const eventText =
    plainFallback ||
    (event?.kind === "bot_mode_resumed" ? BOT_MODE_RESUMED_FALLBACK : "");
  const stampedAt = message.created_at ? formatFullTime(message.created_at) : "";

  return (
    <div className="flex w-full min-w-0 justify-center px-3 py-1">
      <div className="w-fit max-w-[min(28rem,100%)] rounded-lg bg-[#d7eef8] px-3 py-2 text-left text-[11px] leading-snug text-[#3b4a54] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            {isHuman ? (
              <UserRound className="size-3.5 shrink-0 text-[#dc2626]" strokeWidth={2.25} />
            ) : (
              <Bot className="size-3.5 shrink-0 text-[#027eb5]" strokeWidth={2.25} />
            )}
            {actorName ? (
              <span className="truncate font-medium text-[#dc2626]">{actorName}</span>
            ) : null}
          </div>
          {stampedAt ? (
            <span className="shrink-0 text-[10px] text-[#3b4a54]/65">{stampedAt}</span>
          ) : null}
        </div>
        {hasGroups ? (
          <div className="mt-1 space-y-1">
            <ChangeBlock label="se añadió:" lines={addedLines} />
            <ChangeBlock label="se modificó:" lines={modifiedLines} />
            <ChangeBlock label="se eliminó:" lines={removedLines} />
          </div>
        ) : null}
        {!hasGroups && eventText ? <p className="mt-1 wrap-anywhere">{eventText}</p> : null}
      </div>
    </div>
  );
}
